import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import NewsletterSignup from '../components/NewsletterSignup';
import ShareButtons from '../components/ShareButtons';
import TemplateCard from '../components/TemplateCard';
import articles from '../data/articles.json';
import { templates } from '../data/templateLibrary';
import { usePageSeo } from '../lib/seo';

type ArticleMeta = {
    slug: string;
    title: string;
    description: string;
    date: string;
    tags: string[];
    relatedTemplateIds?: string[];
};

/** Strip YAML frontmatter; metadata comes from articles.json instead. */
function stripFrontmatter(markdown: string): string {
    return markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
}

function formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function ArticlePage() {
    const { slug } = useParams();
    const article = (articles as ArticleMeta[]).find((a) => a.slug === slug);
    // Keyed by slug so navigating between articles resets to loading without extra state writes
    const [loaded, setLoaded] = useState<{ slug: string; content: string } | null>(null);
    const [errorSlug, setErrorSlug] = useState<string | null>(null);

    usePageSeo({
        title: article ? article.title : 'Article not found',
        description: article
            ? article.description
            : 'This article could not be found. Browse all GiveLive articles and template guides.',
        path: slug ? `/blog/articles/${slug}` : '/blog',
        ogType: 'article',
        noIndex: !article,
    });

    useEffect(() => {
        if (!article) return;
        let cancelled = false;

        fetch(`/articles/${article.slug}.md`)
            .then((res) => {
                if (!res.ok) throw new Error('not found');
                return res.text();
            })
            .then((text) => {
                if (!cancelled) setLoaded({ slug: article.slug, content: stripFrontmatter(text) });
            })
            .catch(() => {
                if (!cancelled) setErrorSlug(article.slug);
            });

        return () => {
            cancelled = true;
        };
    }, [article]);

    const content = loaded && loaded.slug === article?.slug ? loaded.content : null;
    const loadError = errorSlug === article?.slug;

    if (!article || loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">Article not found</h1>
                <Link to="/blog" className="text-primary hover:underline">Back to Blog</Link>
            </div>
        );
    }

    const relatedTemplates = (article.relatedTemplateIds ?? [])
        .map((id) => templates.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t));

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-primary transition mb-8"
                >
                    <ArrowLeft size={16} /> All guides &amp; articles
                </Link>

                <header className="mb-10">
                    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-6">{article.title}</h1>
                    <p className="text-xl text-slate-500 leading-relaxed mb-6">{article.description}</p>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar size={14} /> {formatDate(article.date)}
                            </span>
                            {article.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-gray-100 text-gray-500 text-xs font-medium">
                                    <Tag size={10} /> {tag}
                                </span>
                            ))}
                        </div>
                        <ShareButtons title={article.title} url={`/blog/articles/${article.slug}`} />
                    </div>
                </header>

                {content === null ? (
                    <div className="space-y-4 animate-pulse">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${85 - (i % 3) * 15}%` }} />
                        ))}
                    </div>
                ) : (
                    <div className="prose prose-lg prose-slate max-w-none prose-a:text-primary prose-headings:font-bold">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                )}

                {relatedTemplates.length > 0 && (
                    <section className="mt-16 border-t border-gray-100 pt-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Templates mentioned in this article</h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedTemplates.map((template) => (
                                <TemplateCard key={template.id} template={template} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="mt-16 bg-surface border border-gray-100 rounded-3xl p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Get weekly QR marketing playbooks</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Articles like this one, plus template breakdowns and automation recipes, in your inbox.
                    </p>
                    <NewsletterSignup source={`article:${article.slug}`} />
                </section>
            </article>
        </div>
    );
}
