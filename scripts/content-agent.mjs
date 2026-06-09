/**
 * Weekly content agent: generates one SEO blog article from the topic queue.
 *
 * Reads:    marketing/topics.json          (first topic with status "pending")
 * Writes:   client/public/articles/{slug}.md
 *           client/src/data/articles.json  (prepends the new article)
 *           marketing/topics.json          (marks the topic "done")
 *
 * Requires: OPENAI_API_KEY env var.
 * Optional: CONTENT_AGENT_MODEL (default gpt-4o-mini)
 *
 * Run locally:  OPENAI_API_KEY=... node scripts/content-agent.mjs
 * In CI:        .github/workflows/content-agent.yml (weekly cron -> PR)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TOPICS_PATH = path.join(ROOT, 'marketing/topics.json');
const ARTICLES_JSON = path.join(ROOT, 'client/src/data/articles.json');
const ARTICLES_DIR = path.join(ROOT, 'client/public/articles');
const TEMPLATE_LIB = path.join(ROOT, 'client/src/data/templateLibrary.ts');

const MODEL = process.env.CONTENT_AGENT_MODEL || 'gpt-4o-mini';
const API_KEY = process.env.OPENAI_API_KEY;

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .split('-')
        .slice(0, 8)
        .join('-');
}

function parseTemplates(tsContent) {
    const templates = [];
    const re =
        /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*description:\s*'([^']+)',\s*category:\s*'([^']+)',/g;
    let match;
    while ((match = re.exec(tsContent)) !== null) {
        templates.push({ id: match[1], name: match[2], description: match[3], category: match[4] });
    }
    return templates;
}

function buildPrompt(topic, templates, existingArticles) {
    const templateList = templates
        .map((t) => `- ${t.name} (/blog/${t.id}): ${t.description} [${t.category}]`)
        .join('\n');

    const existingTitles = existingArticles.map((a) => `- ${a.title}`).join('\n') || '- (none yet)';

    return `You are the content writer for GiveLive (https://givelive.app), a QR-powered acquisition platform. Marketers, nonprofits, churches, real-estate teams, event organizers, restaurants, and creators use GiveLive to build "QR flows": a QR code triggers a mobile journey with lead-capture forms, payments/donations, SMS and email follow-up, and CRM integrations (HubSpot, Salesforce, Follow Up Boss, Mailchimp, Zapier, Make, n8n). There is a free plan (1 campaign, 100 leads/month) and paid plans from $19/month.

Write one complete, original blog article.

TOPIC: ${topic.topic}
ANGLE: ${topic.angle}
TAGS: ${topic.tags.join(', ')}

RELEVANT FREE TEMPLATES (link 2-4 of them naturally in the body using their /blog/{id} paths):
${templateList}

EXISTING ARTICLES (do not duplicate these titles or their core thesis):
${existingTitles}

REQUIREMENTS:
- 1,200-1,800 words of genuinely useful, specific content. No filler, no generic "in today's digital world" openers.
- Write for practitioners: concrete numbers, examples, and step-by-step tactics they can apply this week.
- Use Markdown: ## section headings, short paragraphs, lists where they help, bold for key claims.
- Mention GiveLive naturally where relevant (2-4 times), never as a hard sell. Link templates as [Template Name](/blog/template-id).
- End with a practical next step the reader can take immediately.
- Do NOT fabricate specific named studies or precise statistics with false attribution; use well-known directional findings carefully ("studies consistently show...").

Respond with ONLY a JSON object in this exact shape:
{
  "title": "Article title, compelling and specific, max 70 chars",
  "description": "Meta description, 140-160 chars, active voice",
  "tags": ["tag1", "tag2", "tag3"],
  "markdown": "The full article body in Markdown, WITHOUT the title as an H1 (the page renders it separately)"
}`;
}

async function generateArticle(topic, templates, existingArticles) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            response_format: { type: 'json_object' },
            temperature: 0.7,
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an expert B2B content marketer who writes specific, practical, non-generic articles. You respond only with valid JSON.',
                },
                { role: 'user', content: buildPrompt(topic, templates, existingArticles) },
            ],
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty completion from OpenAI');

    const article = JSON.parse(content);
    for (const field of ['title', 'description', 'markdown']) {
        if (!article[field] || typeof article[field] !== 'string') {
            throw new Error(`Generated article missing field: ${field}`);
        }
    }
    if (article.markdown.length < 3000) {
        throw new Error(`Generated article too short (${article.markdown.length} chars)`);
    }
    return article;
}

function main() {
    if (!API_KEY) {
        console.error('OPENAI_API_KEY is required');
        process.exit(1);
    }

    const queue = JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf8'));
    const topic = queue.topics.find((t) => t.status === 'pending');
    if (!topic) {
        console.log('No pending topics in the queue — nothing to do.');
        process.exit(0);
    }

    const templates = parseTemplates(fs.readFileSync(TEMPLATE_LIB, 'utf8'));
    const existingArticles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf8'));

    console.log(`Generating article for topic: ${topic.topic}`);

    generateArticle(topic, templates, existingArticles)
        .then((article) => {
            const date = new Date().toISOString().slice(0, 10);
            let slug = slugify(article.title);
            if (existingArticles.some((a) => a.slug === slug)) {
                slug = `${slug}-${date}`;
            }

            const frontmatter = [
                '---',
                `title: ${JSON.stringify(article.title)}`,
                `description: ${JSON.stringify(article.description)}`,
                `date: ${JSON.stringify(date)}`,
                `tags: ${JSON.stringify(article.tags ?? topic.tags)}`,
                '---',
                '',
            ].join('\n');

            fs.mkdirSync(ARTICLES_DIR, { recursive: true });
            fs.writeFileSync(path.join(ARTICLES_DIR, `${slug}.md`), frontmatter + article.markdown + '\n', 'utf8');

            const meta = {
                slug,
                title: article.title,
                description: article.description,
                date,
                tags: article.tags ?? topic.tags,
                relatedTemplateIds: topic.relatedTemplateIds ?? [],
            };
            fs.writeFileSync(
                ARTICLES_JSON,
                JSON.stringify([meta, ...existingArticles], null, 2) + '\n',
                'utf8'
            );

            topic.status = 'done';
            topic.completedAt = date;
            topic.slug = slug;
            fs.writeFileSync(TOPICS_PATH, JSON.stringify(queue, null, 2) + '\n', 'utf8');

            console.log(`Article written: client/public/articles/${slug}.md`);
            console.log(`Title: ${article.title}`);
        })
        .catch((err) => {
            console.error('Content agent failed:', err.message);
            process.exit(1);
        });
}

main();
