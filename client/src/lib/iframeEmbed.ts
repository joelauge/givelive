/**
 * Detect whether a cross-origin iframe was blocked by X-Frame-Options / CSP.
 *
 * When embedding succeeds, reading contentWindow.location throws SecurityError.
 * When blocked, the browser leaves a readable about:blank or error placeholder.
 */
export function isIframeEmbedBlocked(iframe: HTMLIFrameElement, targetUrl: string): boolean {
    try {
        const win = iframe.contentWindow;
        if (!win) return true;

        let href: string;
        try {
            href = win.location.href;
        } catch (err) {
            if (err instanceof DOMException && err.name === 'SecurityError') {
                return false;
            }
            return true;
        }

        if (!href || href === 'about:blank' || href.startsWith('about:')) {
            return true;
        }

        if (href.startsWith('chrome-error://') || href.includes('chromewebdata')) {
            return true;
        }

        try {
            const targetOrigin = new URL(targetUrl).origin;
            if (href.startsWith(targetOrigin)) {
                return false;
            }
        } catch {
            // ignore invalid target URL
        }

        return true;
    } catch {
        return true;
    }
}

export const IFRAME_DETECT_DELAY_MS = 200;
export const IFRAME_LOAD_TIMEOUT_MS = 8000;
export const BLOCKED_REDIRECT_DWELL_MS = 3000;
