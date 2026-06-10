import { FastifyInstance } from 'fastify';
import { signApprovalToken, verifyApprovalToken } from '../lib/approvalToken';
import { DEFAULT_INBOX, sendMail } from '../lib/mailer';

const GITHUB_REPO = process.env.CONTENT_GITHUB_REPO || 'joelauge/givelive';
const APPROVAL_TTL_SECONDS = 7 * 24 * 60 * 60; // links stay valid for a week

const publicBaseUrl = () =>
    (process.env.PUBLIC_BASE_URL || 'https://www.givelive.app').replace(/\/$/, '');

function htmlPage(title: string, body: string, tone: 'success' | 'error'): string {
    const accent = tone === 'success' ? '#16a34a' : '#dc2626';
    return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
<div style="background:#fff;border-radius:16px;padding:40px;max-width:420px;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,.5);">
<div style="font-size:48px;margin-bottom:16px;">${tone === 'success' ? '&#9989;' : '&#10060;'}</div>
<h1 style="font-size:22px;margin:0 0 12px;color:#0f172a;">${title}</h1>
<p style="color:#475569;line-height:1.6;margin:0;">${body}</p>
<p style="margin-top:24px;"><a href="https://github.com/${GITHUB_REPO}/pulls" style="color:${accent};font-weight:600;text-decoration:none;">View pull requests &rarr;</a></p>
</div></body></html>`;
}

export default async function contentApprovalRoutes(fastify: FastifyInstance) {
    // Called by the content-agent GitHub workflow after it opens a PR.
    fastify.post('/content/notify', async (request, reply) => {
        const secret = process.env.CONTENT_APPROVAL_SECRET;
        if (!secret) {
            return reply.code(503).send({ error: 'Content approval is not configured' });
        }

        const provided = request.headers['x-agent-secret'];
        if (provided !== secret) {
            return reply.code(401).send({ error: 'Unauthorized' });
        }

        const { prNumber, title, prUrl } = request.body as {
            prNumber?: number;
            title?: string;
            prUrl?: string;
        };
        if (!prNumber || !title) {
            return reply.code(400).send({ error: 'prNumber and title are required' });
        }

        const token = signApprovalToken(
            { pr: prNumber, exp: Math.floor(Date.now() / 1000) + APPROVAL_TTL_SECONDS },
            secret
        );
        const approveUrl = `${publicBaseUrl()}/api/content/approve?token=${token}`;
        const reviewUrl = prUrl || `https://github.com/${GITHUB_REPO}/pull/${prNumber}`;
        const inbox = process.env.CONTENT_APPROVAL_EMAIL || DEFAULT_INBOX;

        try {
            const sent = await sendMail({
                to: inbox,
                subject: `New article ready to publish: ${title}`,
                text: [
                    `The content agent drafted a new article: "${title}"`,
                    '',
                    `Approve & publish: ${approveUrl}`,
                    `Review on GitHub: ${reviewUrl}`,
                    '',
                    'The approve link merges the pull request and the article deploys with the next release. It expires in 7 days.',
                ].join('\n'),
                html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2 style="color:#0f172a;margin:0 0 8px;">New article ready to publish</h2>
  <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
    The content agent drafted <strong>&ldquo;${title}&rdquo;</strong> and opened pull request #${prNumber}.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
    <td style="border-radius:10px;background:#16a34a;">
      <a href="${approveUrl}" style="display:inline-block;padding:14px 28px;color:#fff;font-weight:700;font-size:16px;text-decoration:none;">Approve &amp; Publish</a>
    </td>
    <td style="width:12px;"></td>
    <td style="border-radius:10px;border:1px solid #cbd5e1;">
      <a href="${reviewUrl}" style="display:inline-block;padding:13px 24px;color:#0f172a;font-weight:600;font-size:16px;text-decoration:none;">Review on GitHub</a>
    </td>
  </tr></table>
  <p style="color:#94a3b8;font-size:13px;line-height:1.6;">
    Approving merges the pull request; the article goes live with the next deploy.
    This link works only for this article and expires in 7 days.
  </p>
</div>`,
            });

            if (!sent) {
                fastify.log.warn('Content approval notify: no SMTP configuration found');
                return reply.code(503).send({ error: 'No SMTP configuration' });
            }
            return { success: true };
        } catch (err) {
            fastify.log.error({ err }, 'Failed to send content approval email');
            return reply.code(500).send({ error: 'Failed to send approval email' });
        }
    });

    // One-click approve link target from the email.
    fastify.get('/content/approve', async (request, reply) => {
        reply.type('text/html');

        const secret = process.env.CONTENT_APPROVAL_SECRET;
        const githubToken = process.env.CONTENT_GITHUB_TOKEN;
        if (!secret || !githubToken) {
            return reply
                .code(503)
                .send(htmlPage('Not configured', 'Content approval is not configured on this server.', 'error'));
        }

        const { token } = request.query as { token?: string };
        const payload = token ? verifyApprovalToken(token, secret) : null;
        if (!payload) {
            return reply
                .code(400)
                .send(htmlPage('Link invalid or expired', 'This approval link is no longer valid. You can still review and merge the pull request on GitHub.', 'error'));
        }

        try {
            const res = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/pulls/${payload.pr}/merge`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                        'X-GitHub-Api-Version': '2022-11-28',
                    },
                    body: JSON.stringify({ merge_method: 'squash' }),
                }
            );

            if (res.status === 200) {
                return reply.send(
                    htmlPage('Article approved', `Pull request #${payload.pr} was merged. The article publishes with the next deploy (usually within a couple of minutes).`, 'success')
                );
            }
            if (res.status === 405 || res.status === 409) {
                // Already merged, closed, or not mergeable
                const detail = (await res.json().catch(() => null)) as { message?: string } | null;
                return reply.send(
                    htmlPage('Already handled', detail?.message || `Pull request #${payload.pr} was already merged or cannot be merged automatically.`, 'error')
                );
            }

            const detail = (await res.json().catch(() => null)) as { message?: string } | null;
            fastify.log.error({ status: res.status, detail }, 'GitHub merge failed');
            return reply
                .code(502)
                .send(htmlPage('Merge failed', detail?.message || 'GitHub rejected the merge. Please merge the pull request manually.', 'error'));
        } catch (err) {
            fastify.log.error({ err }, 'Error merging content PR');
            return reply
                .code(502)
                .send(htmlPage('Merge failed', 'Could not reach GitHub. Please merge the pull request manually.', 'error'));
        }
    });
}
