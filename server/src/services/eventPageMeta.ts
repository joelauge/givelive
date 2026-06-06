import fs from 'fs';
import path from 'path';

export type EventPageMeta = {
    displayName: string;
    eventName: string;
    eventUrl: string;
    campaignImage?: string;
};

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function findIndexHtmlPath(): string {
    const candidates = [
        path.join(process.cwd(), 'dist/index.html'),
        path.join(__dirname, '../../dist/index.html'),
        path.join(__dirname, '../../../dist/index.html'),
        path.join(__dirname, '../../../../dist/index.html'),
    ];

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    throw new Error('index.html not found for event page metadata injection');
}

function replaceMetaTag(
    html: string,
    selector: 'name' | 'property',
    key: string,
    content: string
): string {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(
        `<meta[^>]*${selector}=["']${escapedKey}["'][^>]*>`,
        'i'
    );
    const replacement = `<meta ${selector}="${key}" content="${content}" />`;

    if (pattern.test(html)) {
        return html.replace(pattern, replacement);
    }

    return html.replace('</head>', `  ${replacement}\n</head>`);
}

function replaceTitle(html: string, title: string): string {
    if (/<title>.*?<\/title>/i.test(html)) {
        return html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
    }
    return html.replace('</head>', `  <title>${title}</title>\n</head>`);
}

export function injectEventPageMeta(html: string, meta: EventPageMeta): string {
    const title = escapeHtml(meta.displayName);
    const description = escapeHtml(meta.displayName);
    const eventName = escapeHtml(meta.eventName);
    const eventUrl = escapeHtml(meta.eventUrl);

    let result = replaceTitle(html, title);
    result = replaceMetaTag(result, 'name', 'description', description);
    result = replaceMetaTag(result, 'name', 'apple-mobile-web-app-title', title);
    result = replaceMetaTag(result, 'property', 'og:type', 'website');
    result = replaceMetaTag(result, 'property', 'og:title', title);
    result = replaceMetaTag(result, 'property', 'og:description', `Join us for ${eventName}`);
    result = replaceMetaTag(result, 'property', 'og:url', eventUrl);
    result = replaceMetaTag(result, 'property', 'og:site_name', 'GiveLive');
    result = replaceMetaTag(result, 'name', 'twitter:card', 'summary_large_image');
    result = replaceMetaTag(result, 'name', 'twitter:title', title);
    result = replaceMetaTag(result, 'name', 'twitter:description', `Join us for ${eventName}`);

    if (meta.campaignImage) {
        const image = escapeHtml(meta.campaignImage);
        result = replaceMetaTag(result, 'property', 'og:image', image);
        result = replaceMetaTag(result, 'name', 'twitter:image', image);
    }

    return result;
}

export function parseNodeConfig(config: unknown): Record<string, unknown> {
    if (!config) return {};
    if (typeof config === 'string') {
        try {
            return JSON.parse(config) as Record<string, unknown>;
        } catch {
            return {};
        }
    }
    if (typeof config === 'object') {
        return config as Record<string, unknown>;
    }
    return {};
}

export function buildEventPageUrl(eventId: string): string {
    const base = (process.env.GIVELIVE_ORIGIN || 'https://www.givelive.app').replace(/\/$/, '');
    return `${base}/event/${eventId}`;
}
