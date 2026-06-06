import { describe, expect, it } from 'vitest';
import { escapeHtml, injectEventPageMeta } from './eventPageMeta';

const SAMPLE_HTML = `<!doctype html>
<html lang="en">
<head>
  <title>GiveLive - Interactive Fundraising Platform</title>
  <meta property="og:title" content="GiveLive - Interactive Fundraising Platform" />
  <meta property="og:description" content="Join us for an amazing fundraising experience" />
  <meta property="og:url" content="https://givelive.app" />
  <meta name="twitter:title" content="GiveLive - Interactive Fundraising Platform" />
</head>
<body><div id="root"></div></body>
</html>`;

describe('injectEventPageMeta', () => {
    it('injects QR display text into title and Open Graph tags', () => {
        const html = injectEventPageMeta(SAMPLE_HTML, {
            displayName: 'Scan to Save',
            eventName: 'Summer Campaign',
            eventUrl: 'https://www.givelive.app/event/abc-123',
        });

        expect(html).toContain('<title>Scan to Save</title>');
        expect(html).toContain('property="og:title" content="Scan to Save"');
        expect(html).toContain('name="description" content="Scan to Save"');
        expect(html).toContain('name="apple-mobile-web-app-title" content="Scan to Save"');
        expect(html).toContain('property="og:url" content="https://www.givelive.app/event/abc-123"');
    });

    it('escapes HTML in user-provided display text', () => {
        const html = injectEventPageMeta(SAMPLE_HTML, {
            displayName: 'Save & "Go" <Now>',
            eventName: 'Test',
            eventUrl: 'https://www.givelive.app/event/x',
        });

        expect(html).toContain('content="Save &amp; &quot;Go&quot; &lt;Now&gt;"');
        expect(html).not.toContain('content="Save & "Go" <Now>"');
    });
});

describe('escapeHtml', () => {
    it('escapes special characters', () => {
        expect(escapeHtml(`Tom's "QR" <tips>`)).toBe('Tom&#39;s &quot;QR&quot; &lt;tips&gt;');
    });
});
