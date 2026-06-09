/**
 * Generates llms.txt and per-template Markdown files from templateLibrary.ts.
 * Run: npm run generate:llms (also runs before build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const BLOG_MD = path.join(PUBLIC, 'blog');
const SITE = 'https://givelive.app';

function parseTemplates(tsContent) {
    const templates = [];
    const re =
        /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*description:\s*'([^']+)',\s*category:\s*'([^']+)',/g;
    let match;
    while ((match = re.exec(tsContent)) !== null) {
        templates.push({
            id: match[1],
            name: match[2],
            description: match[3],
            category: match[4],
        });
    }
    return templates;
}

function templateMarkdown(t) {
    return `# Free ${t.name} Template

**Category:** ${t.category}  
**Website:** ${SITE}/blog/${t.id}

${t.description}. Get started in minutes with this professionally designed, mobile-optimized GiveLive QR flow template.

## Overview

The **${t.name}** template is pre-configured with an optimal flow to maximize conversions—whether you're looking to ${t.description.toLowerCase()} or engage scanners at your location.

## What's included

- Pre-built mobile-optimized pages
- QR / link Start trigger
- Integrated payment processing (where applicable)
- Automated SMS/email follow-up steps
- Real-time analytics dashboard

## How to use

1. Open https://givelive.app/blog/${t.id}
2. Click **Use this free template** and sign in
3. Customize copy, images, and journey steps in the builder
4. Publish and distribute your QR code

## Related

- [All templates](${SITE}/blog.md)
- [How to use GiveLive](${SITE}/how-to.md)
- [Pricing](${SITE}/pricing.md)
`;
}

function buildLlmsTxt(templates) {
    const byCategory = templates.reduce((acc, t) => {
        if (!acc[t.category]) acc[t.category] = [];
        acc[t.category].push(t);
        return acc;
    }, {});

    const categorySections = Object.keys(byCategory)
        .sort()
        .map((category) => {
            const links = byCategory[category]
                .map(
                    (t) =>
                        `- [${t.name}](${SITE}/blog/${t.id}.md): ${t.description} (${category})`
                )
                .join('\n');
            return `## ${category}\n\n${links}`;
        })
        .join('\n\n');

    return `# GiveLive

> GiveLive is a QR-powered acquisition platform. Build intelligent journeys from scan to lead capture, payments, SMS/email follow-up, and CRM integrations.

GiveLive is for marketers, nonprofits, venues, churches, real-estate teams, and local businesses turning physical touchpoints into automated digital workflows. Start free; paid plans scale campaigns, leads, branding, and automation.

Markdown versions of key pages are available at \`{path}.md\` (e.g. ${SITE}/pricing.md).

## Product

- [Home](${SITE}/index.md): Product overview, features, integrations, and getting started
- [Pricing](${SITE}/pricing.md): Free, Starter, Growth, Pro, and Enterprise plans with limits
- [How to use GiveLive](${SITE}/how-to.md): Step-by-step guide from first QR to publish and analytics
- [Free template library](${SITE}/blog.md): Browse all pre-built QR flow templates

## Templates

${categorySections}

## Legal

- [Privacy Policy](${SITE}/privacy.md): Data collection, use, and your rights
- [Terms of Service](${SITE}/tos.md): Account, payments, acceptable use, and liability

## Optional

- [Sitemap](${SITE}/sitemap.xml): Machine-readable list of public HTML URLs
- [Robots](${SITE}/robots.txt): Crawl rules for search engines
`;
}

function main() {
    const libraryPath = path.join(ROOT, 'src/data/templateLibrary.ts');
    const tsContent = fs.readFileSync(libraryPath, 'utf8');
    const templates = parseTemplates(tsContent);

    if (templates.length === 0) {
        console.error('No templates parsed from templateLibrary.ts');
        process.exit(1);
    }

    fs.mkdirSync(BLOG_MD, { recursive: true });

    for (const t of templates) {
        const outPath = path.join(BLOG_MD, `${t.id}.md`);
        fs.writeFileSync(outPath, templateMarkdown(t), 'utf8');
    }

    fs.writeFileSync(path.join(PUBLIC, 'llms.txt'), buildLlmsTxt(templates), 'utf8');

    console.log(`Generated llms.txt and ${templates.length} blog/*.md files`);
}

main();
