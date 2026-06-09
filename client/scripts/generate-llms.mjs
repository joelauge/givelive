/**
 * Generates SEO/GEO artifacts from the marketing data files:
 *   - public/blog/*.md          (per-template Markdown)
 *   - public/use-cases/*.md     (per use-case Markdown)
 *   - public/llms.txt           (LLM-readable site index)
 *   - public/sitemap.xml        (all public HTML URLs)
 *
 * Sources: src/data/templateLibrary.ts, src/data/useCases.ts, src/data/articles.json
 * Run: npm run generate:llms (also runs before build)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const BLOG_MD = path.join(PUBLIC, 'blog');
const USE_CASES_MD = path.join(PUBLIC, 'use-cases');
const SITE = 'https://givelive.app';

// A single-quoted TS string, handling escaped quotes (\')
const STR = `'((?:[^'\\\\]|\\\\.)*)'`;
const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\');

function parseTemplates(tsContent) {
    const templates = [];
    const re = new RegExp(
        `id:\\s*${STR},\\s*name:\\s*${STR},\\s*description:\\s*${STR},\\s*category:\\s*${STR},`,
        'g'
    );
    let match;
    while ((match = re.exec(tsContent)) !== null) {
        templates.push({
            id: unescape(match[1]),
            name: unescape(match[2]),
            description: unescape(match[3]),
            category: unescape(match[4]),
        });
    }
    return templates;
}

function parseAudiences(tsContent) {
    const audiences = [];
    const re = new RegExp(`slug:\\s*${STR},\\s*name:\\s*${STR},\\s*shortName:`, 'g');
    let match;
    while ((match = re.exec(tsContent)) !== null) {
        audiences.push({ slug: unescape(match[1]), name: unescape(match[2]) });
    }
    return audiences;
}

function parseUseCases(tsContent, audiences) {
    const useCases = [];
    // Split the useCaseCopy object into per-audience blocks (keys may be quoted or bare)
    const blockRe = /\n    '?([\w-]+)'?:\s*\[([\s\S]*?)\n    \],/g;
    const entryRe = new RegExp(
        `templateId:\\s*${STR},\\s*title:\\s*${STR},\\s*metaDescription:\\s*${STR},\\s*headline:\\s*${STR},`,
        'g'
    );

    let block;
    while ((block = blockRe.exec(tsContent)) !== null) {
        const audienceSlug = block[1];
        const audience = audiences.find((a) => a.slug === audienceSlug);
        if (!audience) continue;

        entryRe.lastIndex = 0;
        let entry;
        while ((entry = entryRe.exec(block[2])) !== null) {
            useCases.push({
                slug: `${unescape(entry[1])}-for-${audienceSlug}`,
                templateId: unescape(entry[1]),
                title: unescape(entry[2]),
                metaDescription: unescape(entry[3]),
                headline: unescape(entry[4]),
                audience,
            });
        }
    }
    return useCases;
}

function loadArticles() {
    const articlesPath = path.join(ROOT, 'src/data/articles.json');
    if (!fs.existsSync(articlesPath)) return [];
    return JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
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

function useCaseMarkdown(u) {
    return `# ${u.title}

**Audience:** ${u.audience.name}  
**Template:** ${SITE}/blog/${u.templateId}  
**Website:** ${SITE}/use-cases/${u.slug}

> ${u.headline}

${u.metaDescription}

## How to launch

1. Open ${SITE}/use-cases/${u.slug}
2. Start from the free template at ${SITE}/blog/${u.templateId}
3. Customize copy, branding, and journey steps in the visual builder
4. Publish and place your QR code where your audience already is

## Related

- [All use cases](${SITE}/use-cases)
- [All templates](${SITE}/blog.md)
- [Pricing](${SITE}/pricing.md)
`;
}

function buildLlmsTxt(templates, useCases, articles) {
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

    const byAudience = useCases.reduce((acc, u) => {
        if (!acc[u.audience.name]) acc[u.audience.name] = [];
        acc[u.audience.name].push(u);
        return acc;
    }, {});

    const useCaseSections = Object.keys(byAudience)
        .sort()
        .map((audienceName) => {
            const links = byAudience[audienceName]
                .map((u) => `- [${u.title}](${SITE}/use-cases/${u.slug}.md): ${u.metaDescription}`)
                .join('\n');
            return `### ${audienceName}\n\n${links}`;
        })
        .join('\n\n');

    const articleLinks = articles
        .map((a) => `- [${a.title}](${SITE}/articles/${a.slug}.md): ${a.description}`)
        .join('\n');

    return `# GiveLive

> GiveLive is a QR-powered acquisition platform. Build intelligent journeys from scan to lead capture, payments, SMS/email follow-up, and CRM integrations.

GiveLive is for marketers, nonprofits, venues, churches, real-estate teams, and local businesses turning physical touchpoints into automated digital workflows. Start free; paid plans scale campaigns, leads, branding, and automation.

Markdown versions of key pages are available at \`{path}.md\` (e.g. ${SITE}/pricing.md).

## Product

- [Home](${SITE}/index.md): Product overview, features, integrations, and getting started
- [Pricing](${SITE}/pricing.md): Free, Starter, Growth, Pro, and Enterprise plans with limits
- [How to use GiveLive](${SITE}/how-to.md): Step-by-step guide from first QR to publish and analytics
- [Free template library](${SITE}/blog.md): Browse all pre-built QR flow templates
- [Use cases by industry](${SITE}/use-cases): How each industry uses QR flows

## Templates

${categorySections}

## Use Cases

${useCaseSections}
${articles.length > 0 ? `\n## Articles\n\n${articleLinks}\n` : ''}
## Legal

- [Privacy Policy](${SITE}/privacy.md): Data collection, use, and your rights
- [Terms of Service](${SITE}/tos.md): Account, payments, acceptable use, and liability

## Optional

- [Sitemap](${SITE}/sitemap.xml): Machine-readable list of public HTML URLs
- [Robots](${SITE}/robots.txt): Crawl rules for search engines
`;
}

function buildSitemap(templates, useCases, articles) {
    const urls = [
        { loc: '/', changefreq: 'weekly', priority: '1.0' },
        { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
        { loc: '/how-to', changefreq: 'monthly', priority: '0.8' },
        { loc: '/blog', changefreq: 'weekly', priority: '0.9' },
        { loc: '/use-cases', changefreq: 'weekly', priority: '0.9' },
        ...templates.map((t) => ({
            loc: `/blog/${t.id}`,
            changefreq: 'monthly',
            priority: '0.7',
        })),
        ...useCases.map((u) => ({
            loc: `/use-cases/${u.slug}`,
            changefreq: 'monthly',
            priority: '0.7',
        })),
        ...articles.map((a) => ({
            loc: `/blog/articles/${a.slug}`,
            changefreq: 'monthly',
            priority: '0.6',
        })),
        { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
        { loc: '/tos', changefreq: 'yearly', priority: '0.3' },
    ];

    const entries = urls
        .map(
            (u) => `  <url>
    <loc>${SITE}${u.loc === '/' ? '/' : u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function main() {
    const tsContent = fs.readFileSync(path.join(ROOT, 'src/data/templateLibrary.ts'), 'utf8');
    const useCasesContent = fs.readFileSync(path.join(ROOT, 'src/data/useCases.ts'), 'utf8');

    const templates = parseTemplates(tsContent);
    const audiences = parseAudiences(useCasesContent);
    const useCases = parseUseCases(useCasesContent, audiences);
    const articles = loadArticles();

    if (templates.length === 0) {
        console.error('No templates parsed from templateLibrary.ts');
        process.exit(1);
    }
    if (useCases.length === 0) {
        console.error('No use cases parsed from useCases.ts');
        process.exit(1);
    }

    fs.mkdirSync(BLOG_MD, { recursive: true });
    fs.mkdirSync(USE_CASES_MD, { recursive: true });

    for (const t of templates) {
        fs.writeFileSync(path.join(BLOG_MD, `${t.id}.md`), templateMarkdown(t), 'utf8');
    }
    for (const u of useCases) {
        fs.writeFileSync(path.join(USE_CASES_MD, `${u.slug}.md`), useCaseMarkdown(u), 'utf8');
    }

    fs.writeFileSync(path.join(PUBLIC, 'llms.txt'), buildLlmsTxt(templates, useCases, articles), 'utf8');
    fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), buildSitemap(templates, useCases, articles), 'utf8');

    console.log(
        `Generated llms.txt, sitemap.xml, ${templates.length} blog/*.md, ${useCases.length} use-cases/*.md (${articles.length} articles indexed)`
    );
}

main();
