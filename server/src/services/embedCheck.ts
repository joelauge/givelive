const PARENT_ORIGIN = process.env.GIVELIVE_ORIGIN || 'https://givelive.app';

function parseFrameAncestors(csp: string): string[] | null {
    const match = csp.match(/frame-ancestors\s+([^;]+)/i);
    if (!match) return null;
    return match[1].trim().split(/\s+/).filter(Boolean);
}

function normalizeOrigin(value: string): string | null {
    try {
        if (value.startsWith('http://') || value.startsWith('https://')) {
            return new URL(value).origin;
        }
        return null;
    } catch {
        return null;
    }
}

function isParentAllowedByCsp(ancestors: string[], targetOrigin: string): boolean {
    if (ancestors.includes('*')) return true;
    if (ancestors.includes("'none'")) return false;

    const parentOrigin = PARENT_ORIGIN.replace(/\/$/, '');
    let parentUrl: URL;
    try {
        parentUrl = new URL(parentOrigin);
    } catch {
        return false;
    }

    return ancestors.some((entry) => {
        if (entry === "'self'") {
            return targetOrigin === parentUrl.origin;
        }
        const allowedOrigin = normalizeOrigin(entry);
        return allowedOrigin === parentUrl.origin;
    });
}

export async function checkUrlEmbeddable(
    targetUrl: string
): Promise<{ embeddable: boolean; reason?: string }> {
    let url: URL;
    try {
        url = new URL(targetUrl);
    } catch {
        return { embeddable: false, reason: 'invalid-url' };
    }

    if (!['http:', 'https:'].includes(url.protocol)) {
        return { embeddable: false, reason: 'invalid-protocol' };
    }

    const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
            'User-Agent': 'GiveLive-Embed-Check/1.0',
            Accept: 'text/html',
        },
        signal: AbortSignal.timeout(10_000),
    });

    const xfo = response.headers.get('x-frame-options')?.toLowerCase();
    if (xfo === 'deny' || xfo === 'sameorigin') {
        return { embeddable: false, reason: 'x-frame-options' };
    }

    const cspHeaders = [
        response.headers.get('content-security-policy'),
        response.headers.get('content-security-policy-report-only'),
    ].filter(Boolean) as string[];

    for (const csp of cspHeaders) {
        const ancestors = parseFrameAncestors(csp);
        if (!ancestors) continue;

        if (!isParentAllowedByCsp(ancestors, new URL(response.url).origin)) {
            return { embeddable: false, reason: 'csp-frame-ancestors' };
        }
    }

    return { embeddable: true };
}
