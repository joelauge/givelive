import { FastifyInstance } from 'fastify';
import twilio from 'twilio';
import { query } from '../db';
import { sendEmail } from '../services/email';

interface SMSBody {
    to: string;
    body: string;
    nodeId?: string;
    eventId?: string;
}

export default async function smsRoutes(server: FastifyInstance) {
    // Trim to handle accidental whitespace or quotes from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
    const clientUrl = (process.env.CLIENT_URL || 'https://givelive.app').trim();

    let client: any;
    if (accountSid && authToken) {
        try {
            // Safe logging for debugging production credentials
            const safeSid = `${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}`;
            const safeToken = `${authToken.substring(0, 2)}...${authToken.substring(authToken.length - 2)}`;
            const safePhone = fromNumber ? `${fromNumber.substring(0, 3)}...${fromNumber.substring(fromNumber.length - 4)}` : 'MISSING';

            server.log.info(`[Twilio] Initializing with SID: ${safeSid} (len: ${accountSid.length}), Token: ${safeToken} (len: ${authToken.length}), Phone: ${safePhone}`);

            client = twilio(accountSid, authToken);
            server.log.info('[Twilio] Client initialized successfully');
        } catch (err: any) {
            server.log.error(`[Twilio] Initialization failed: ${err.message}`);
        }
    } else {
        server.log.warn(`Twilio credentials missing: SID=${!!accountSid}, Token=${!!authToken}, Phone=${!!fromNumber}`);
    }

    // Helper: Send SMS
    const sendSms = async (to: string, body: string) => {
        if (!fromNumber) {
            server.log.error('TWILIO_PHONE_NUMBER environment variable is MISSING. Cannot send SMS.');
            throw new Error('Server configuration error: TWILIO_PHONE_NUMBER not set');
        }

        if (client) {
            try {
                const message = await client.messages.create({ body, from: fromNumber, to });
                server.log.info(`[Twilio] Sent message SID ${message.sid} to ${to}`);
                return { success: true, sid: message.sid };
            } catch (err: any) {
                // Check for common Twilio authentication errors
                if (err.status === 401 || err.code === 20003) {
                    server.log.error(`[Twilio] Authentication failed: ${err.message}. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.`);
                    throw new Error(`Twilio Authentication Failure: ${err.message}`);
                }
                server.log.error(`[Twilio] Failed to send to ${to}: ${err.message} (Code: ${err.code})`);
                throw err;
            }
        } else {
            const mockMsg = `[MOCK SMS] To: ${to}, Body: ${body}`;
            server.log.info(mockMsg);
            return { success: true, mock: true, body: mockMsg };
        }
    };

    // Helper: Find or Create User
    const getOrCreateUser = async (phone: string, eventId: string) => {
        const existing = await query('SELECT * FROM users WHERE phone_number = $1 AND event_id = $2', [phone, eventId]);
        if (existing.rows.length > 0) return existing.rows[0];

        const newUser = await query('INSERT INTO users (phone_number, event_id) VALUES ($1, $2) RETURNING *', [phone, eventId]);
        return newUser.rows[0];
    };

    // Helper: Update Progress
    const updateProgress = async (userId: string, eventId: string, nodeId: string) => {
        const existing = await query('SELECT * FROM user_progress WHERE user_id = $1 AND event_id = $2', [userId, eventId]);
        if (existing.rows.length > 0) {
            await query('UPDATE user_progress SET current_node_id = $1, updated_at = NOW() WHERE id = $2', [nodeId, existing.rows[0].id]);
        } else {
            await query('INSERT INTO user_progress (user_id, event_id, current_node_id) VALUES ($1, $2, $3)', [userId, eventId, nodeId]);
        }
    };

    server.post<{ Body: SMSBody }>('/sms/send', async (request, reply) => {
        try {
            const { to, body, nodeId, eventId } = request.body as SMSBody;
            if (!to || !body) {
                return reply.code(400).send({ error: 'Missing "to" or "body" in request' });
            }

            // Send
            const result = await sendSms(to, body);

            // Update State if context provided
            if (nodeId && eventId) {
                const user = await getOrCreateUser(to, eventId);
                await updateProgress(user.id, eventId, nodeId);
            }

            return result;
        } catch (err: any) {
            server.log.error(err);
            reply.code(500).send({
                error: err.message || 'Failed to send SMS',
                details: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    });

    server.post('/sms/webhook', async (request, reply) => {
        try {
            const { From, Body } = request.body as any;
            if (!From || !Body) {
                server.log.warn('[Webhook] Received empty body or From field');
                return reply.type('text/xml').send('<Response></Response>');
            }
            server.log.info(`[Webhook] From: ${From}, Body: ${Body}`);

            // 1. Find User (ACTIVE session)
            const userRes = await query(`
                SELECT u.id as user_id, u.event_id, up.current_node_id, u.email
                FROM users u
                JOIN user_progress up ON u.id = up.user_id
                WHERE u.phone_number = $1
                ORDER BY up.updated_at DESC
                LIMIT 1
            `, [From]);

            if (userRes.rows.length === 0) {
                server.log.warn(`[Webhook] No active session for ${From}`);
                return reply.type('text/xml').send('<Response></Response>');
            }

            const { user_id, event_id, current_node_id } = userRes.rows[0];

            // 2. Load Current Node
            const nodeRes = await query('SELECT * FROM journey_nodes WHERE id = $1', [current_node_id]);
            if (nodeRes.rows.length === 0) {
                server.log.error(`[Webhook] Current node ${current_node_id} not found for user ${user_id}`);
                return reply.type('text/xml').send('<Response></Response>');
            }

            const currentNode = nodeRes.rows[0];
            const config = currentNode.config || {};
            const nextNodes = currentNode.next_nodes || []; // Array of { nodeId, handle }

            // 3. Logic Matching
            let triggerHandle = 'default';

            if (config.expectedResponses && Array.isArray(config.expectedResponses)) {
                const match = config.expectedResponses.find((r: any) =>
                    r.trigger.toLowerCase() === Body.trim().toLowerCase()
                );

                if (match) {
                    triggerHandle = `response-${match.trigger}`;
                    server.log.info(`[Webhook] Matched trigger '${match.trigger}' -> Handle '${triggerHandle}'`);
                }
            }

            // 4. Find Next Node ID
            let nextNodeId = null;
            const objectMatch = nextNodes.find((n: any) => typeof n === 'object' && n.handle === triggerHandle);
            if (objectMatch) {
                nextNodeId = objectMatch.nodeId;
            } else if (triggerHandle === 'default' && nextNodes.length > 0) {
                nextNodeId = typeof nextNodes[0] === 'string' ? nextNodes[0] : nextNodes[0].nodeId;
            }

            if (!nextNodeId) {
                server.log.info(`[Webhook] No path found for handle '${triggerHandle}' from node ${current_node_id}`);
                return reply.type('text/xml').send('<Response></Response>');
            }

            // 5. Load Next Node
            const nextNodeRes = await query('SELECT * FROM journey_nodes WHERE id = $1', [nextNodeId]);
            if (nextNodeRes.rows.length === 0) {
                server.log.error(`[Webhook] Next node ${nextNodeId} not found`);
                return reply.type('text/xml').send('<Response></Response>');
            }
            const nextNode = nextNodeRes.rows[0];
            const nextConfig = nextNode.config || {};

            // 6. Execute Next Node
            await updateProgress(user_id, event_id, nextNodeId);

            if (nextNode.type === 'sms' || nextNode.type === 'message') {
                // Send SMS if configuration allows
                const msgBody = nextConfig.smsMessage || (nextConfig.messageSequence ? nextConfig.messageSequence[0]?.content : '');

                // BUG FIX: Use nextConfig instead of config (the previous node's config)
                const isSmsType = nextConfig.messageType === 'sms' || nextConfig.messageType === 'both' || !nextConfig.messageType;

                if (isSmsType && msgBody) {
                    // RESOLVE LINKS
                    const allNodesRes = await query('SELECT id, config FROM journey_nodes WHERE event_id = $1', [event_id]);
                    const allNodes = allNodesRes.rows;

                    // Regex to match {{Link:LabelOrId?params}}
                    const resolvedMsgBody = msgBody.replace(/\{\{Link:([^?\}]+)[^}]*\}\}/g, (match: string, labelOrId: string) => {
                        // 1. Try exact ID match
                        let target = allNodes.find((n: any) => n.id === labelOrId);

                        // 2. Try normalized Label match (e.g. "PaymentPage" matches "Payment Page")
                        if (!target) {
                            target = allNodes.find((n: any) => {
                                const nLabel = n.config?.label || '';
                                const normalized = nLabel.replace(/\s+/g, '');
                                return normalized === labelOrId;
                            });
                        }

                        if (target) {
                            return `${clientUrl}/event/${event_id}?nodeId=${target.id}`;
                        }
                        return match; // Keep unmodified if target not found
                    });

                    await sendSms(From, resolvedMsgBody);
                }

                // Send Email if configuration allows
                const isEmailType = nextConfig.messageType === 'email' || nextConfig.messageType === 'both';
                if (isEmailType && userRes.rows[0].email) {
                    const toEmail = userRes.rows[0].email;
                    const subject = nextConfig.emailSubject || 'Update from GiveLive';
                    const body = nextConfig.emailBody || '';
                    const sections = nextConfig.emailSections || [];
                    const context = { link: `${clientUrl}/event/${event_id}` };

                    await sendEmail(toEmail, subject, body, sections, context);
                }
            } else if (nextNode.type === 'page' || nextNode.type === 'donation') {
                // Send standard continuation link
                const link = `${clientUrl}/event/${event_id}?nodeId=${nextNodeId}`;
                const msgBody = `Tap here to continue: ${link}`;
                await sendSms(From, msgBody);
            }

            return reply.type('text/xml').send('<Response></Response>');

        } catch (err: any) {
            server.log.error(err);
            // Twilio webhooks should generally return success even on internal errors to prevent retries if not desired
            // and because Twilio won't do anything with the 500 anyway except log it in their console.
            return reply.type('text/xml').send('<Response></Response>');
        }
    });
}
