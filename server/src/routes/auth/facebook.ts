import { FastifyInstance } from 'fastify';
import { MetaService } from '../../services/meta';
import { query } from '../../db';

export default async function facebookAuthRoutes(server: FastifyInstance) {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const REDIRECT_URI = `${BACKEND_URL}/api/auth/facebook/callback`;

    // 1. Kick off the OAuth flow
    server.get('/auth/facebook', async (request, reply) => {
        const appId = process.env.FACEBOOK_APP_ID;
        const scope = [
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_metadata'
        ].join(',');

        const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;

        return reply.redirect(authUrl);
    });

    // 2. Handle the callback from Meta
    server.get('/auth/facebook/callback', async (request, reply) => {
        const { code } = request.query as { code: string };

        if (!code) {
            return reply.redirect(`${FRONTEND_URL}/settings?error=no_code`);
        }

        try {
            // Exchange code for short-lived token
            const tokenData = await MetaService.exchangeCodeForToken(code, REDIRECT_URI);

            // Exchange for long-lived token
            const longLivedToken = await MetaService.getLongLivedToken(tokenData.access_token);

            // Fetch Pages to confirm the token works and we have at least one page
            const pages = await MetaService.getUserPages(longLivedToken.access_token);
            server.log.info(`[Facebook OAuth] Discovered ${pages.length} pages for user`);

            if (pages.length === 0) {
                return reply.redirect(`${FRONTEND_URL}/settings?error=no_pages_found`);
            }

            // Save the user access token temporarily/permanently to allow the user to pick a page
            await query(`
                INSERT INTO integrations (org_id, platform, external_id, access_token, metadata)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (org_id, platform, external_id) DO UPDATE
                SET access_token = $4, metadata = $5, updated_at = NOW()
            `, [
                'default-org',
                'facebook_user',
                'meta_user_account', // generic ID for now as we only support one connection per org
                longLivedToken.access_token,
                JSON.stringify({
                    available_pages: pages.length
                })
            ]);

            // Redirect the user to the frontend for the Meta page selection onboarding
            return reply.redirect(`${FRONTEND_URL}/settings?meta_onboarding=true`);
        } catch (err: any) {
            server.log.error(`Facebook OAuth Error: ${err.message}`);
            return reply.redirect(`${FRONTEND_URL}/settings?error=oauth_failed`);
        }
    });

    // 3. Deauthorize Callback
    server.post('/auth/facebook/deauthorize', async (request, reply) => {
        server.log.info('Meta Deauthorize Request Received');

        // Remove integrations for the organization
        // In a multi-tenant app, we'd verify the signed_request to get the user/page ID
        await query('DELETE FROM integrations WHERE org_id = $1 AND platform IN ($2, $3)', ['default-org', 'facebook', 'instagram']);

        return { success: true };
    });

    // 4. Data Deletion Request
    server.post('/auth/facebook/delete-data', async (request, reply) => {
        server.log.info('Meta Data Deletion Request Received');
        // Meta expects a JSON response with a confirmation URL and code
        const confirmationCode = Math.random().toString(36).substring(7);
        return {
            url: `${FRONTEND_URL}/settings?deletion_id=${confirmationCode}`,
            confirmation_code: confirmationCode
        };
    });
}
