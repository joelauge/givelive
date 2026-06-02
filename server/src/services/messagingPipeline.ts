import { query } from '../db';
import { MetaService } from './meta';
import { TikTokService } from './tiktok';

export class MessagingPipeline {
    /**
     * Handles an incoming Instagram DM
     */
    static async handleInstagramMessage(senderId: string, recipientId: string, text: string) {
        await this.handleSocialEvent('instagram', 'dm', senderId, recipientId, text);
    }

    /**
     * Handles an incoming Instagram Comment
     */
    static async handleInstagramComment(senderId: string, pageId: string, text: string, mediaId: string) {
        await this.handleSocialEvent('instagram', 'comment', senderId, pageId, text);
    }

    /**
     * Handles an incoming TikTok DM
     */
    static async handleTikTokMessage(senderId: string, recipientId: string, text: string) {
        await this.handleSocialEvent('tiktok', 'dm', senderId, recipientId, text);
    }

    /**
     * Handles an incoming TikTok Comment
     */
    static async handleTikTokComment(senderId: string, videoId: string, text: string, commentId: string) {
        // For TikTok, we might need to look up by video_id or just use the seller's account
        await this.handleSocialEvent('tiktok', 'comment', senderId, videoId, text, commentId);
    }

    private static async handleSocialEvent(platform: string, eventType: string, senderId: string, recipientId: string, text: string, commentId?: string) {
        // 1. Find the integration
        // For Instagram, both DM and Comments are linked to the IG Business Account in our integrations table
        // But for comments, we might need to look up by Page ID (stored in metadata)
        let integrationRes = await query(
            'SELECT * FROM integrations WHERE platform = $1 AND (external_id = $2 OR metadata->>\'page_id\' = $2)',
            [platform, recipientId]
        );

        if (integrationRes.rows.length === 0) {
            console.error(`[MessagingPipeline] No integration found for ${platform} ID: ${recipientId}`);
            return;
        }

        const integration = integrationRes.rows[0];
        const { org_id, metadata } = integration;
        const accessToken = integration.platform === 'instagram' ? metadata.page_access_token : integration.access_token;
        const igBusinessId = integration.platform === 'instagram' ? integration.external_id : null;

        // 2. Find the Journey/Event that has this trigger
        // We look for a start node that matches platform + eventType
        const journeyRes = await query(`
            SELECT n.event_id, n.id as node_id, n.config 
            FROM journey_nodes n
            JOIN events e ON n.event_id = e.id
            WHERE e.org_id = $1 
            AND n.type = 'start'
            AND n.config->>'triggerType' = 'social'
            AND n.config->'triggerConfig'->>'platform' = $2
            AND n.config->'triggerConfig'->>'event' = $3
        `, [org_id, platform, eventType]);

        if (journeyRes.rows.length === 0) {
            console.info(`[MessagingPipeline] No journey found for ${platform} ${eventType} in organization ${org_id}`);
            return;
        }

        // 3. Filter by Keyword if applicable
        const matchingJourneys = journeyRes.rows.filter(j => {
            const keyword = j.config?.triggerConfig?.keyword;
            if (!keyword) return true; // Generic trigger
            return text.toUpperCase().includes(keyword.toUpperCase());
        });

        if (matchingJourneys.length === 0) return;

        // Use the first match for now
        const { event_id: eventId, node_id: rootNodeId } = matchingJourneys[0];

        // 4. Find or Create User
        const metadataKey = platform === 'instagram' ? 'instagram_id' : 'tiktok_id';
        let userRes = await query(
            'SELECT * FROM users WHERE event_id = $1 AND (metadata->>$2 = $3)',
            [eventId, metadataKey, senderId]
        );

        let user;
        if (userRes.rows.length === 0) {
            const createRes = await query(
                'INSERT INTO users (event_id, metadata) VALUES ($1, $2) RETURNING *',
                [eventId, JSON.stringify({ [metadataKey]: senderId })]
            );
            user = createRes.rows[0];
        } else {
            user = userRes.rows[0];
        }

        // 5. Check progress or start fresh
        // For Social triggers, we often want to Re-start the flow if it's a new trigger
        // But for now, let's just use the root node if it's a trigger event
        const nodeRes = await query('SELECT * FROM journey_nodes WHERE id = $1', [rootNodeId]);
        const startNode = nodeRes.rows[0];

        if (!startNode) return;

        // 6. Execute from Start Node's next children
        const firstNextNodeId = startNode.next_nodes?.[0]?.nodeId;
        if (firstNextNodeId) {
            const nextNodeRes = await query('SELECT * FROM journey_nodes WHERE id = $1', [firstNextNodeId]);
            const nextNode = nextNodeRes.rows[0];
            if (nextNode) {
                // Update progress to the first real action node
                await query(
                    `INSERT INTO user_progress (user_id, event_id, current_node_id) 
                         VALUES ($1, $2, $3) 
                         ON CONFLICT (user_id, event_id) DO UPDATE SET current_node_id = $3`,
                    [user.id, eventId, firstNextNodeId]
                );
                await this.executeNode(user, eventId, nextNode, integration, text, commentId);
            }
        }
    }

    private static async executeNode(user: any, eventId: string, node: any, integration: any, incomingText?: string, commentId?: string) {
        const { id, type, config, next_nodes } = node;
        const { platform, metadata } = integration;
        const accessToken = platform === 'instagram' ? metadata.page_access_token : integration.access_token;

        if (type === 'message') {
            // Send Reply
            const replyText = config.message || "Hello! How can I help you today?";

            if (platform === 'instagram') {
                await MetaService.sendIGMessage(user.metadata.instagram_id, accessToken, replyText);
            } else if (platform === 'tiktok') {
                if (commentId) {
                    await TikTokService.sendReply(commentId, accessToken, replyText);
                } else {
                    console.log(`[MessagingPipeline] TikTok DM Not Implemented Yet. Message: ${replyText}`);
                }
            }

            // Move to next node (if simple sequential)
            const next = next_nodes?.[0]?.nodeId;
            if (next) {
                const nextNodeRes = await query('SELECT * FROM journey_nodes WHERE id = $1', [next]);
                const nextNode = nextNodeRes.rows[0];
                if (nextNode) {
                    await query('UPDATE user_progress SET current_node_id = $1 WHERE user_id = $2 AND event_id = $3', [next, user.id, eventId]);
                    // Recursively execute if it's an automation node
                    if (['message', 'delay'].includes(nextNode.type)) {
                        await this.executeNode(user, eventId, nextNode, integration, undefined, commentId);
                    }
                }
            }
        }
    }
}
