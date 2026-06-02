import { FastifyInstance } from 'fastify';
import { IntegrationService } from '../services/integrations';
import { MetaService } from '../services/meta';
import { query } from '../db';

export async function integrationRoutes(server: FastifyInstance) {
    server.post('/integrations/products', async (request, reply) => {
        try {
            const { type, config } = request.body as any;
            const products = await IntegrationService.getProducts(type, config);
            return { products };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Failed to fetch products' });
        }
    });


    server.get('/integrations/status', async (request, reply) => {
        try {
            const res = await query('SELECT platform, metadata FROM integrations WHERE org_id = $1', ['default-org']);

            const integrations: any = {
                facebook: false,
                instagram: false,
                tiktok: false,
                whatsapp: false,
                shopify: false,
                metadata: {}
            };

            for (const row of res.rows) {
                integrations[row.platform] = true;
                integrations.metadata[row.platform] = row.metadata;
            }

            return integrations;
        } catch (err) {
            server.log.error(err);
            return {
                facebook: false,
                instagram: false,
                tiktok: false,
                whatsapp: false,
                shopify: false,
                metadata: {}
            };
        }
    });

    server.delete('/integrations/:platform', async (request, reply) => {
        try {
            const { platform } = request.params as any;
            await query('DELETE FROM integrations WHERE org_id = $1 AND platform = $2', ['default-org', platform]);
            return { success: true };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Failed to disconnect integration' });
        }
    });

    server.get('/integrations/meta/pages', async (request, reply) => {
        try {
            const res = await query('SELECT access_token FROM integrations WHERE org_id = $1 AND platform = $2', ['default-org', 'facebook_user']);
            if (res.rows.length === 0) {
                return reply.code(404).send({ error: 'No user credential found' });
            }

            const userAccessToken = res.rows[0].access_token;
            const pages = await MetaService.getUserPages(userAccessToken);

            // Format for frontend
            const formatted = pages.map(p => ({
                id: p.id,
                name: p.name,
                hasInstagram: !!p.instagram_business_account,
                igUsername: p.instagram_business_account?.username
            }));

            return { pages: formatted };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Failed to fetch meta pages' });
        }
    });

    server.post('/integrations/meta/select', async (request, reply) => {
        try {
            const { pageId } = request.body as { pageId: string };

            // 1. Get the user token
            const res = await query('SELECT access_token FROM integrations WHERE org_id = $1 AND platform = $2', ['default-org', 'facebook_user']);
            if (res.rows.length === 0) {
                return reply.code(404).send({ error: 'No user credential found' });
            }

            const userAccessToken = res.rows[0].access_token;

            // 2. Fetch pages and find the selected one
            const pages = await MetaService.getUserPages(userAccessToken);
            const selectedPage = pages.find(p => p.id === pageId);

            if (!selectedPage) {
                return reply.code(404).send({ error: 'Page not found or inaccessible' });
            }

            // 3. Clear any existing active Facebook/IG integrations for this org
            await query('DELETE FROM integrations WHERE org_id = $1 AND platform IN ($2, $3)', ['default-org', 'facebook', 'instagram']);

            // 4. Save the selected Facebook Page
            await query(`
                INSERT INTO integrations (org_id, platform, external_id, access_token, metadata)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                'default-org',
                'facebook',
                selectedPage.id,
                userAccessToken, // User token is fine for most graph API calls on this page
                JSON.stringify({
                    page_id: selectedPage.id,
                    page_name: selectedPage.name,
                    page_access_token: selectedPage.access_token
                })
            ]);

            // 5. Save the linked Instagram (if any)
            if (selectedPage.instagram_business_account) {
                await query(`
                    INSERT INTO integrations (org_id, platform, external_id, access_token, metadata)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    'default-org',
                    'instagram',
                    selectedPage.instagram_business_account.id,
                    userAccessToken,
                    JSON.stringify({
                        page_id: selectedPage.id,
                        page_name: selectedPage.name,
                        page_access_token: selectedPage.access_token,
                        ig_username: selectedPage.instagram_business_account.username
                    })
                ]);

                // Subscribe to webhooks
                try {
                    await MetaService.subscribeToWebhooks(selectedPage.id, selectedPage.access_token);
                } catch (subErr) {
                    server.log.error(`Failed to subscribe page ${selectedPage.id} to webhooks: ${subErr}`);
                }
            }

            return { success: true };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Failed to save meta selection' });
        }
    });

}
