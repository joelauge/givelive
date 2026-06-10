import { FastifyInstance } from 'fastify';
import { query } from '../db';
import { ensureMailSchema } from '../db/ensureMailSchema';
import { requirePlatformAdmin } from '../lib/auth';
import { validateEmail } from '../lib/leadValidation';
import { verifyWebhookSignature } from '../lib/webhookSignature';

const RESEND_API = 'https://api.resend.com';
const MAIL_FROM = process.env.MAIL_INBOX_ADDRESS || 'hello@givelive.app';
const MAIL_FROM_NAME = process.env.MAIL_INBOX_NAME || 'GiveLive';

function resendHeaders() {
    return {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
    };
}

async function fetchReceivedEmail(emailId: string): Promise<{
    text?: string;
    html?: string;
    headers?: Record<string, string>;
} | null> {
    const res = await fetch(`${RESEND_API}/emails/receiving/${emailId}`, {
        headers: resendHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as { text?: string; html?: string; headers?: Record<string, string> };
}

export default async function mailRoutes(server: FastifyInstance) {
    // --- Inbound webhook (Resend → us). Needs the raw body for signature
    // verification, so it lives in its own encapsulated scope with a
    // buffer content-type parser.
    server.register(async (scope) => {
        scope.removeContentTypeParser('application/json');
        scope.addContentTypeParser(
            'application/json',
            { parseAs: 'buffer' },
            (_req, body, done) => done(null, body)
        );

        scope.post('/mail/inbound', async (request, reply) => {
            const secret = process.env.RESEND_WEBHOOK_SECRET;
            if (!secret || !process.env.RESEND_API_KEY) {
                return reply.code(503).send({ error: 'Inbound mail is not configured' });
            }

            const rawBody = request.body as Buffer;
            const valid = verifyWebhookSignature({
                secret,
                id: String(request.headers['svix-id'] || ''),
                timestamp: String(request.headers['svix-timestamp'] || ''),
                signature: String(request.headers['svix-signature'] || ''),
                payload: rawBody,
            });
            if (!valid) {
                return reply.code(401).send({ error: 'Invalid signature' });
            }

            let event: any;
            try {
                event = JSON.parse(rawBody.toString('utf8'));
            } catch {
                return reply.code(400).send({ error: 'Invalid JSON' });
            }

            if (event?.type !== 'email.received') {
                return { received: true };
            }

            const data = event.data || {};
            if (!data.email_id || !data.from) {
                return reply.code(400).send({ error: 'Malformed event' });
            }

            await ensureMailSchema();

            // The webhook only carries metadata; pull the body from Resend.
            const content = await fetchReceivedEmail(data.email_id);

            await query(
                `INSERT INTO inbox_emails
                    (resend_email_id, message_id, direction, from_address, to_addresses,
                     cc_addresses, subject, text_body, html_body, attachments, received_at)
                 VALUES ($1, $2, 'inbound', $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (resend_email_id) DO NOTHING`,
                [
                    data.email_id,
                    data.message_id || null,
                    data.from,
                    JSON.stringify(data.to || []),
                    JSON.stringify(data.cc || []),
                    data.subject || '(no subject)',
                    content?.text || null,
                    content?.html || null,
                    JSON.stringify(data.attachments || []),
                    data.created_at || new Date().toISOString(),
                ]
            );

            return { received: true };
        });
    });

    // --- Admin inbox API (platform operators only) ---

    server.get('/mail/messages', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        await ensureMailSchema();

        const { limit = '50', offset = '0' } = request.query as { limit?: string; offset?: string };
        const result = await query(
            `SELECT id, from_address, to_addresses, subject, is_read, direction, received_at, created_at,
                    LEFT(COALESCE(text_body, ''), 160) AS snippet,
                    attachments
             FROM inbox_emails
             WHERE direction = 'inbound'
             ORDER BY received_at DESC NULLS LAST, created_at DESC
             LIMIT $1 OFFSET $2`,
            [Math.min(parseInt(limit) || 50, 100), parseInt(offset) || 0]
        );
        const unread = await query(
            `SELECT COUNT(*)::int AS count FROM inbox_emails WHERE direction = 'inbound' AND is_read = false`
        );
        return { messages: result.rows, unreadCount: unread.rows[0]?.count ?? 0 };
    });

    server.get<{ Params: { id: string } }>('/mail/messages/:id', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        await ensureMailSchema();

        const result = await query('SELECT * FROM inbox_emails WHERE id = $1', [request.params.id]);
        const message = result.rows[0];
        if (!message) {
            return reply.code(404).send({ error: 'Message not found' });
        }

        if (!message.is_read && message.direction === 'inbound') {
            await query('UPDATE inbox_emails SET is_read = true WHERE id = $1', [message.id]);
            message.is_read = true;
        }

        const replies = await query(
            `SELECT * FROM inbox_emails WHERE in_reply_to = $1 ORDER BY created_at ASC`,
            [message.id]
        );
        return { message, replies: replies.rows };
    });

    server.patch<{ Params: { id: string } }>('/mail/messages/:id', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        await ensureMailSchema();

        const { is_read } = request.body as { is_read?: boolean };
        if (typeof is_read !== 'boolean') {
            return reply.code(400).send({ error: 'is_read boolean is required' });
        }
        const result = await query(
            'UPDATE inbox_emails SET is_read = $1 WHERE id = $2 RETURNING id, is_read',
            [is_read, request.params.id]
        );
        if (!result.rows[0]) return reply.code(404).send({ error: 'Message not found' });
        return result.rows[0];
    });

    server.delete<{ Params: { id: string } }>('/mail/messages/:id', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        await ensureMailSchema();

        const result = await query('DELETE FROM inbox_emails WHERE id = $1 RETURNING id', [request.params.id]);
        if (!result.rows[0]) return reply.code(404).send({ error: 'Message not found' });
        return { deleted: true };
    });

    server.post<{ Params: { id: string } }>('/mail/messages/:id/reply', async (request, reply) => {
        const userId = await requirePlatformAdmin(request, reply);
        if (!userId) return;
        if (!process.env.RESEND_API_KEY) {
            return reply.code(503).send({ error: 'Outbound mail is not configured' });
        }
        await ensureMailSchema();

        const { text } = request.body as { text?: string };
        if (!text?.trim()) {
            return reply.code(400).send({ error: 'Reply text is required' });
        }

        const result = await query('SELECT * FROM inbox_emails WHERE id = $1', [request.params.id]);
        const original = result.rows[0];
        if (!original) return reply.code(404).send({ error: 'Message not found' });

        const recipient = validateEmail(original.from_address);
        if (!recipient.valid) {
            return reply.code(400).send({ error: 'Original sender address is not a valid recipient' });
        }

        const subject = /^re:/i.test(original.subject || '')
            ? original.subject
            : `Re: ${original.subject || '(no subject)'}`;

        const threadHeaders: Record<string, string> = {};
        if (original.message_id) {
            threadHeaders['In-Reply-To'] = original.message_id;
            threadHeaders['References'] = original.message_id;
        }

        const sendRes = await fetch(`${RESEND_API}/emails`, {
            method: 'POST',
            headers: resendHeaders(),
            body: JSON.stringify({
                from: `${MAIL_FROM_NAME} <${MAIL_FROM}>`,
                to: [recipient.normalized],
                subject,
                text: text.trim(),
                headers: threadHeaders,
            }),
        });

        if (!sendRes.ok) {
            const detail = (await sendRes.json().catch(() => null)) as { message?: string } | null;
            request.log.error({ status: sendRes.status, detail }, 'Resend reply send failed');
            return reply.code(502).send({ error: detail?.message || 'Failed to send reply' });
        }

        const sent = (await sendRes.json()) as { id: string };
        const stored = await query(
            `INSERT INTO inbox_emails
                (resend_email_id, direction, from_address, to_addresses, subject, text_body, is_read, in_reply_to, received_at)
             VALUES ($1, 'outbound', $2, $3, $4, $5, true, $6, NOW())
             RETURNING *`,
            [
                sent.id,
                MAIL_FROM,
                JSON.stringify([recipient.normalized]),
                subject,
                text.trim(),
                original.id,
            ]
        );

        return { success: true, reply: stored.rows[0] };
    });
}
