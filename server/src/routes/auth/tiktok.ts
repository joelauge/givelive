import { FastifyInstance } from 'fastify';
import { TikTokService } from '../../services/tiktok';
import { query } from '../../db';

export default async function tiktokAuthRoutes(server: FastifyInstance) {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Helper to get the correct backend URL dynamically
    const getBackendUrl = (request: any) => {
        const host = request.headers.host;
        const protocol = request.headers['x-forwarded-proto'] || 'http';

        // If the user hasn't explicitly set a BACKEND_URL, use the current host.
        // If they HAVE set it, but it doesn't match the current host, it might cause redirect issues.
        // We'll favor the host that the user is actually visiting to ensure the redirect works.
        return `${protocol}://${host}`;
    };

    // 0. Diagnostic endpoint
    server.get('/auth/tiktok/check', async (request, reply) => {
        const clientKey = (process.env.TIKTOK_CLIENT_KEY || '').trim();
        const clientSecret = (process.env.TIKTOK_CLIENT_SECRET || '').trim();
        const backendUrl = getBackendUrl(request);
        const redirectUri = `${backendUrl}/api/auth/tiktok/callback`;

        // Construct alternative URIs to help the user test
        const nonWwwUrl = `${request.headers['x-forwarded-proto'] || 'https'}://givelive.app/api/auth/tiktok/callback`;
        const wwwUrl = `${request.headers['x-forwarded-proto'] || 'https'}://www.givelive.app/api/auth/tiktok/callback`;

        return {
            status: 'Diagnostic Info v3 (Improved)',
            hasClientKey: !!clientKey,
            hasClientSecret: !!clientSecret,
            detectedConfig: {
                clientKey: clientKey,
                currentDetectedRedirectUri: redirectUri,
                isWww: request.headers.host?.startsWith('www.')
            },
            sandboxReminders: [
                "1. You must be logged into TikTok as 'theultimategamemaster' in this browser.",
                "2. The URL below must match your TikTok Dashboard EXACTLY.",
                "3. Ensure you clicked 'Apply Changes' in the TikTok Portal."
            ],
            testLinks: {
                currentVariation: `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=test`,
                forceWWW: `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(wwwUrl)}&state=test`,
                forceNonWWW: `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(nonWwwUrl)}&state=test`
            },
            rawHeaders: request.headers
        };
    });

    // 1. Kick off the TikTok OAuth flow
    server.get('/auth/tiktok', async (request, reply) => {
        const clientKey = (process.env.TIKTOK_CLIENT_KEY || '').trim();
        const clientSecret = (process.env.TIKTOK_CLIENT_SECRET || '').trim();
        const backendUrl = getBackendUrl(request);
        const redirectUri = `${backendUrl}/api/auth/tiktok/callback`;

        console.log(`[TikTok Debug] Initiation - Host: ${request.headers.host}`);
        console.log(`[TikTok Debug] Key: ${clientKey}`);
        console.log(`[TikTok Debug] Redirect: ${redirectUri}`);

        if (!clientKey || !clientSecret) {
            console.error('[TikTok Debug] Error: Keys missing');
            return reply.code(400).send({
                error: 'Configuration Error',
                message: 'TikTok API keys are not configured on the server.'
            });
        }

        const scope = 'user.info.basic';
        const state = Math.random().toString(36).substring(7);

        // Remove trailing slash and add client_id as a redundant parameter (some environments prefer it)
        const authUrl = `https://www.tiktok.com/v2/auth/authorize` +
            `?client_key=${clientKey}` +
            `&client_id=${clientKey}` +
            `&scope=${encodeURIComponent(scope)}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${state}`;

        server.log.info({ msg: 'Redirecting to TikTok', authUrl });
        return reply.redirect(authUrl);
    });

    // 2. Handle the callback from TikTok
    server.get('/auth/tiktok/callback', async (request, reply) => {
        const { code, state, error, error_description } = request.query as any;
        const backendUrl = getBackendUrl(request);
        const redirectUri = `${backendUrl}/api/auth/tiktok/callback`;

        if (error) {
            server.log.error(`TikTok Auth Error: ${error} - ${error_description}`);
            return reply.redirect(`${FRONTEND_URL}/settings?error=tiktok_failed`);
        }

        if (!code) {
            return reply.redirect(`${FRONTEND_URL}/settings?error=no_code`);
        }

        try {
            // Exchange code for tokens
            const tokenData = await TikTokService.exchangeCodeForToken(code, redirectUri);

            // Fetch User Info to get an external ID
            const userInfo = await TikTokService.getUserInfo(tokenData.access_token);

            // Store integration
            await query(`
                INSERT INTO integrations (org_id, platform, external_id, access_token, metadata)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (org_id, platform, external_id) DO UPDATE
                SET access_token = $4, metadata = $5, updated_at = NOW()
            `, [
                'default-org',
                'tiktok',
                userInfo.open_id,
                tokenData.access_token,
                JSON.stringify({
                    display_name: userInfo.display_name,
                    avatar_url: userInfo.avatar_url,
                    refresh_token: tokenData.refresh_token,
                    scope: tokenData.scope
                })
            ]);

            return reply.redirect(`${FRONTEND_URL}/settings?connected=tiktok`);
        } catch (err: any) {
            server.log.error(`TikTok Callback Error: ${err.message}`);
            return reply.redirect(`${FRONTEND_URL}/settings?error=oauth_failed`);
        }
    });
}
