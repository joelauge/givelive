import { useEffect } from 'react';

export const SITE = {
    name: 'GiveLive',
    url: 'https://givelive.app',
    defaultTitle: 'GiveLive — Intelligent QR Flows for Acquisition',
    defaultDescription:
        'GiveLive is the operating system for high-impact acquisition. Create immersive digital-to-physical journeys, capture leads instantly, and automate your follow-up workflows.',
    defaultOgImage: 'https://givelive.app/assets/blog_illustration_fundraising.png',
    twitterCard: 'summary_large_image',
} as const;

export type PageSeoOptions = {
    title: string;
    description: string;
    path?: string;
    ogImage?: string;
    ogType?: string;
    noIndex?: boolean;
    /** When true, use title as-is instead of appending the site name. */
    rawTitle?: boolean;
    /** Skip canonical and og:url updates (event pages keep a generic og:url for iOS QR UX). */
    omitUrl?: boolean;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
    const selector = `meta[${attr}="${key}"]`;
    let el = document.querySelector(selector);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
    let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        document.head.appendChild(el);
    }
    el.href = href;
}

function removeMeta(attr: 'name' | 'property', key: string) {
    document.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

export function formatPageTitle(title: string, rawTitle = false): string {
    if (rawTitle) return title;
    if (title.includes(SITE.name)) return title;
    return `${title} | ${SITE.name}`;
}

export function absoluteUrl(path = '/'): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${SITE.url}${normalized}`;
}

export function getTemplateOgImageUrl(templateId: string): string {
    const baseName = templateId.replace(/-/g, '_');
    return absoluteUrl(`/assets/blog_illustration_${baseName}.png`);
}

export function applyPageSeo(options: PageSeoOptions) {
    const {
        title,
        description,
        path = '/',
        ogImage = SITE.defaultOgImage,
        ogType = 'website',
        noIndex = false,
        rawTitle = false,
        omitUrl = false,
    } = options;

    const pageTitle = formatPageTitle(title, rawTitle);
    const canonical = absoluteUrl(path);

    document.title = pageTitle;

    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', SITE.name);
    upsertMeta('property', 'og:title', pageTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', ogImage);
    if (!omitUrl) {
        upsertMeta('property', 'og:url', canonical);
        upsertLink('canonical', canonical);
    }
    upsertMeta('name', 'twitter:card', SITE.twitterCard);
    upsertMeta('name', 'twitter:title', pageTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', ogImage);

    if (noIndex) {
        upsertMeta('name', 'robots', 'noindex, nofollow');
    } else {
        removeMeta('name', 'robots');
    }
}

export function usePageSeo(options: PageSeoOptions) {
    const { title, description, path, ogImage, ogType, noIndex, rawTitle, omitUrl } = options;

    useEffect(() => {
        applyPageSeo({ title, description, path, ogImage, ogType, noIndex, rawTitle, omitUrl });
        return () => {
            applyPageSeo({
                title: SITE.defaultTitle,
                description: SITE.defaultDescription,
                path: '/',
                rawTitle: true,
            });
        };
    }, [title, description, path, ogImage, ogType, noIndex, rawTitle, omitUrl]);
}

export function eventMetaDescription(eventName: string): string {
    const name = eventName?.trim() || 'this experience';
    return `Scan to begin ${name}. Complete the journey on your phone—no app download required.`;
}
