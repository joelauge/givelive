import nodemailer from 'nodemailer';
import { query } from '../db';

export const DEFAULT_INBOX = process.env.DEMO_REQUEST_EMAIL || 'hello@givelive.app';

export type SmtpConfig = {
    host: string;
    port: number;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
};

/** Prefer the admin-configured email settings, fall back to SMTP env vars. */
export async function resolveSmtpConfig(): Promise<SmtpConfig | null> {
    try {
        const res = await query('SELECT value FROM settings WHERE key = $1', ['email_config']);
        const cfg = res.rows[0]?.value;
        if (cfg?.host && cfg?.user) {
            return {
                host: cfg.host,
                port: parseInt(cfg.port) || 587,
                user: cfg.user,
                pass: cfg.pass,
                fromName: cfg.fromName || 'GiveLive',
                fromEmail: cfg.fromEmail || DEFAULT_INBOX,
            };
        }
    } catch {
        // settings table unavailable; fall through to env config
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS || '',
            fromName: 'GiveLive',
            fromEmail: process.env.SMTP_FROM || DEFAULT_INBOX,
        };
    }

    return null;
}

export async function sendMail(options: {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
}): Promise<boolean> {
    const config = await resolveSmtpConfig();
    if (!config) return false;

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: { user: config.user, pass: config.pass },
    });

    await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        ...options,
    });
    return true;
}
