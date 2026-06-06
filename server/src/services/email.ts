import nodemailer from 'nodemailer';
import { query } from '../db';
import { emailWatermarkHtml } from './watermark';

interface EmailConfig {
    provider: string;
    host: string;
    port: string;
    user: string;
    pass: string;
    fromName: string;
    fromEmail: string;
}

export async function sendEmail(to: string, subject: string, body: string, sections: any[], context?: any) {
    try {
        // 1. Get Settings
        const res = await query('SELECT value FROM settings WHERE key = $1', ['email_config']);
        if (res.rows.length === 0) {
            console.warn('[Email] No email configuration found.');
            return false;
        }
        const config: EmailConfig = res.rows[0].value;

        // 2. Setup Transporter
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port) || 587,
            secure: parseInt(config.port) === 465, // true for 465, false for other ports
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });

        // 3. Generate HTML
        const htmlContent = generateHtml(body, sections, context);

        // 4. Send
        const info = await transporter.sendMail({
            from: `"${config.fromName}" <${config.fromEmail}>`,
            to,
            subject,
            html: htmlContent,
        });

        console.log(`[Email] Sent: ${info.messageId}`);
        return true;

    } catch (err) {
        console.error('[Email] Error sending email:', err);
        return false;
    }
}

function generateHtml(body: string, sections: any[], context?: any) {
    let contentHtml = '';

    // Legacy Body
    if (body) {
        contentHtml += `<div style="margin-bottom: 20px; white-space: pre-wrap;">${body}</div>`;
    }

    // Sections
    if (sections && Array.isArray(sections)) {
        sections.forEach(section => {
            const style = `padding: ${section.content.paddingTop || 20}px ${section.content.paddingBottom || 20}px; background-color: ${section.content.backgroundColor || 'transparent'};`;

            contentHtml += `<div style="${style}">`;

            switch (section.type) {
                case 'header':
                    contentHtml += `<h1 style="color: ${section.content.color || '#000'}; text-align: ${section.content.textAlign || 'center'}; margin: 0;">${section.content.title}</h1>`;
                    break;
                case 'text':
                    contentHtml += `<p style="color: ${section.content.color || '#000'}; font-size: ${section.content.fontSize || 16}px; text-align: ${section.content.textAlign || 'left'}; margin: 0;">${section.content.text}</p>`;
                    break;
                case 'image':
                    contentHtml += `<img src="${section.content.url}" alt="${section.content.alt || ''}" style="max-width: 100%; border-radius: ${section.content.borderRadius || 0}px; display: block; margin: 0 auto;" />`;
                    break;
                case 'columns':
                    // Simple 2-col table
                    contentHtml += `
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="50%" valign="top" style="padding-right: 10px;">${section.content.left}</td>
                                <td width="50%" valign="top" style="padding-left: 10px;">${section.content.right}</td>
                            </tr>
                        </table>
                    `;
                    break;
                case 'form':
                case 'payment':
                    // Render as Button
                    const btnColor = section.content.buttonColor || '#000000';
                    const btnText = section.content.buttonText || (section.type === 'payment' ? 'Donate Now' : 'Submit');
                    // We need a link. If context has eventId, we can link to the flow.
                    const link = context?.link || '#';
                    contentHtml += `
                        <div style="text-align: center;">
                            <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: ${btnColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">${btnText}</a>
                        </div>
                    `;
                    break;
                case 'link':
                    contentHtml += `<div style="text-align: ${section.content.textAlign || 'center'};">`;
                    if (section.content.style === 'button') {
                        contentHtml += `
                            <a href="${section.content.url}" style="display: inline-block; padding: 12px 24px; background-color: ${section.content.buttonColor || '#000000'}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">${section.content.label}</a>
                        `;
                    } else {
                        contentHtml += `
                            <a href="${section.content.url}" style="color: ${section.content.textColor || '#000000'}; text-decoration: underline; font-weight: bold;">${section.content.label}</a>
                        `;
                    }
                    contentHtml += `</div>`;
                    break;
            }

            contentHtml += `</div>`;
        });
    }

    const footerHtml = context?.showWatermark
        ? emailWatermarkHtml(context?.eventId)
        : '';

    // Wrapper
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
                ${contentHtml}
                ${footerHtml}
            </div>
        </body>
        </html>
    `;
}
