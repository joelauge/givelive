import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { IntegrationService } from '../services/integrations';
import { validatePublishFlow } from '../lib/journeyValidation';
import { checkPublishLimit } from '../services/planEnforcement';
import { requireEventAccess } from '../lib/eventAccess';
import { ensureAnalyticsSchema } from '../db/ensureAnalyticsSchema';
import { trackAnalyticsEvent } from '../services/analytics';

function socialTriggersEnabledFromEnv(): boolean {
    return process.env.SHOW_SOCIAL_TRIGGERS === 'true';
}

interface NodeBody {
    event_id: string;
    type: 'page' | 'sms' | 'delay' | 'condition' | 'donation' | 'end' | 'fub' | 'salesforce' | 'hubspot' | 'constant_contact' | 'mailchimp' | 'brevo' | 'zapier' | 'make' | 'n8n';
    config?: any;
    next_nodes?: any[];
}

interface ProgressBody {
    user_id: string;
    event_id: string;
    current_node_id: string;
    action?: string; // e.g., 'clicked_link', 'watched_video'
}

export default async function journeyRoutes(server: FastifyInstance) {
    // Get all nodes for an event
    server.get<{ Params: { eventId: string } }>('/journey/:eventId/nodes', async (request, reply) => {
        try {
            const { eventId } = request.params;
            const result = await query('SELECT * FROM journey_nodes WHERE event_id = $1', [eventId]);
            return result.rows;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create a node
    server.post<{ Body: NodeBody }>('/journey/nodes', async (request, reply) => {
        try {
            const { event_id, type, config, next_nodes } = request.body;
            const result = await query(
                'INSERT INTO journey_nodes (event_id, type, config, next_nodes) VALUES ($1, $2, $3, $4) RETURNING *',
                [event_id, type, config || {}, next_nodes || []]
            );
            reply.code(201).send(result.rows[0]);
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update a node
    server.put<{ Params: { id: string }; Body: NodeBody }>('/journey/nodes/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const { type, config, next_nodes } = request.body;
            const result = await query(
                'UPDATE journey_nodes SET type = $1, config = $2, next_nodes = $3 WHERE id = $4 RETURNING *',
                [type, config, next_nodes, id]
            );
            if (result.rows.length === 0) {
                reply.code(404).send({ error: 'Node not found' });
                return;
            }
            return result.rows[0];
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Start Journey (Create User + Progress)
    server.post<{ Body: { event_id: string; phone_number?: string } }>('/journey/start', async (request, reply) => {
        try {
            const { event_id, phone_number } = request.body;

            // Create user (or find existing - simplified for now)
            const userResult = await query(
                'INSERT INTO users (event_id, phone_number) VALUES ($1, $2) RETURNING *',
                [event_id, phone_number]
            );
            const user = userResult.rows[0];

            // Get event and root node
            const eventResult = await query('SELECT root_node_id FROM events WHERE id = $1', [event_id]);

            if (eventResult.rows.length === 0) {
                reply.code(404).send({ error: 'Event not found' });
                return;
            }

            const rootNodeId = eventResult.rows[0]?.root_node_id;

            if (!rootNodeId) {
                reply.code(400).send({ error: 'Journey not yet published. Please publish the flow in the builder.' });
                return;
            }

            // Create progress
            const progressResult = await query(
                'INSERT INTO user_progress (user_id, event_id, current_node_id) VALUES ($1, $2, $3) RETURNING *',
                [user.id, event_id, rootNodeId]
            );

            await trackAnalyticsEvent({
                event_id,
                user_id: user.id,
                node_id: rootNodeId,
                action: 'scan',
                metadata: { source: phone_number ? 'sms_link' : 'qr_or_link' },
            });

            return { user, progress: progressResult.rows[0] };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
    // Publish Journey (Bulk replace)
    server.post<{ Params: { eventId: string }; Body: { nodes: any[]; edges: any[] } }>('/journey/:eventId/publish', async (request, reply) => {
        try {
            await ensureAnalyticsSchema();

            const { eventId } = request.params;
            const access = await requireEventAccess(request, reply, eventId);
            if (!access) return;

            const { nodes, edges } = request.body;

            const validationErrors = validatePublishFlow({
                nodes,
                edges,
                socialTriggersEnabled: socialTriggersEnabledFromEnv(),
            });

            if (validationErrors.length > 0) {
                reply.code(400).send({
                    error: 'Cannot publish journey',
                    validationErrors,
                });
                return;
            }

            const orgId = access.event.org_id;
            if (orgId) {
                const publishLimit = await checkPublishLimit(orgId, eventId);
                if (!publishLimit.canPublish) {
                    return reply.code(403).send({
                        error: 'plan_limit',
                        message: `Your ${publishLimit.planId} plan allows ${publishLimit.limit} live QR campaign${publishLimit.limit === 1 ? '' : 's'}. Upgrade to publish more.`,
                        planId: publishLimit.planId,
                        limit: publishLimit.limit,
                        publishedCount: publishLimit.publishedCount,
                    });
                }
            }

            // 1. Clear existing nodes
            await query('DELETE FROM journey_nodes WHERE event_id = $1', [eventId]);

            // 2. Create ID mapping from frontend IDs to database UUIDs
            const idMapping = new Map<string, string>();

            // 3. Insert new nodes and build ID mapping
            let rootNodeId: string | null = null;

            for (const node of nodes) {
                const nodeType = node.data?.type || node.type || 'page';
                const nodeData = node.data || {};

                // Ensure type is in config
                if (!nodeData.type) {
                    nodeData.type = nodeType;
                }

                // Insert node without next_nodes first (will update after we have all UUIDs)
                const result = await query(
                    'INSERT INTO journey_nodes (event_id, type, config, next_nodes) VALUES ($1, $2, $3, $4) RETURNING id',
                    [
                        eventId,
                        nodeType,
                        JSON.stringify(nodeData),
                        JSON.stringify([]) // Empty for now, will update later
                    ]
                );

                const dbNodeId = result.rows[0].id;
                idMapping.set(node.id, dbNodeId);

                // If type is 'start', this is the root
                if (nodeType === 'start') {
                    rootNodeId = dbNodeId;
                }
            }

            // 4. Now update next_nodes with mapped UUIDs and Handles
            for (const node of nodes) {
                const dbNodeId = idMapping.get(node.id);
                if (!dbNodeId) continue;

                // Find edges starting from this node
                const outboundEdges = edges.filter((e: any) => e.source === node.id);

                // Map to { nodeId, handle } to preserve branching logic
                const nextNodesData = outboundEdges.map((e: any) => ({
                    nodeId: idMapping.get(e.target),
                    handle: e.sourceHandle || 'default'
                })).filter((n: any) => n.nodeId);

                // Update next_nodes
                await query(
                    'UPDATE journey_nodes SET next_nodes = $1 WHERE id = $2',
                    [JSON.stringify(nextNodesData), dbNodeId]
                );
            }

            // 5. Update Event Root Node
            if (rootNodeId) {
                await query('UPDATE events SET root_node_id = $1 WHERE id = $2', [rootNodeId, eventId]);
            } else if (nodes.length > 0) {
                // Fallback: use the first node if no explicit start
                const firstNodeDbId = idMapping.get(nodes[0].id);
                if (firstNodeDbId) {
                    await query('UPDATE events SET root_node_id = $1 WHERE id = $2', [firstNodeDbId, eventId]);
                }
            }

            await query(
                `UPDATE events SET
                    is_published = true,
                    updated_at = NOW(),
                    flow_data = jsonb_set(COALESCE(flow_data, '{}'::jsonb), '{isPublished}', 'true'::jsonb)
                 WHERE id = $1`,
                [eventId]
            );

            await trackAnalyticsEvent({
                event_id: eventId,
                action: 'flow_published',
                metadata: {
                    node_count: nodes.length,
                    org_id: orgId,
                },
            });

            return { success: true, message: 'Journey published successfully' };
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({
                error: 'Failed to publish journey',
                details: err.message || 'Internal Server Error'
            });
        }
    });

    // Test Integration Connection
    server.post<{ Body: { type: string; config: any } }>('/journey/test-connection', async (request, reply) => {
        try {
            const { type, config } = request.body;
            const result = await IntegrationService.validateConnection(type, config);
            return result;
        } catch (err: any) {
            server.log.error(err);
            reply.code(200).send({ success: false, message: err.message || 'Validation failed' });
        }
    });

    // Sync Lead to Integration
    server.post<{ Body: { userId: string; nodeId: string } }>('/journey/sync-lead', async (request, reply) => {
        try {
            const { userId, nodeId } = request.body;

            // 1. Get User Data
            const userRes = await query('SELECT email, first_name, last_name, phone_number FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }
            const user = userRes.rows[0];

            if (!user.email) {
                return { success: false, message: 'User email missing, cannot sync' };
            }

            // 2. Get Node Config
            const nodeRes = await query('SELECT * FROM journey_nodes WHERE id = $1', [nodeId]);
            if (nodeRes.rows.length === 0) {
                return { success: false, message: 'Node not found' };
            }
            const node = nodeRes.rows[0];
            const config = node.config || {};

            // 3. Sync
            const result = await IntegrationService.syncLead(node.type, config, user);

            if (result?.success === true) {
                await trackAnalyticsEvent({
                    event_id: node.event_id,
                    user_id: userId,
                    node_id: nodeId,
                    action: 'integration_sync',
                    metadata: { platform: node.type },
                });
            }

            return result;
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({ success: false, message: err.message || 'Sync failed' });
        }
    });
}
