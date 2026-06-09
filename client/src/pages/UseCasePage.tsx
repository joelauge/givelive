import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Sparkles } from 'lucide-react';
import GuidePromo from '../components/GuidePromo';
import NewsletterSignup from '../components/NewsletterSignup';
import ShareButtons from '../components/ShareButtons';
import { getRelatedUseCases, getUseCase } from '../data/useCases';
import { getTemplateOgImageUrl, usePageSeo } from '../lib/seo';

export default function UseCasePage() {
    const { slug } = useParams();
    const useCase = slug ? getUseCase(slug) : undefined;

    usePageSeo({
        title: useCase ? useCase.title : 'Use case not found',
        description: useCase
            ? useCase.metaDescription
            : 'This use case could not be found. Browse all GiveLive QR flow use cases by industry.',
        path: slug ? `/use-cases/${slug}` : '/use-cases',
        ogImage: useCase ? getTemplateOgImageUrl(useCase.templateId) : undefined,
        noIndex: !useCase,
    });

    // FAQPage structured data for rich results
    useEffect(() => {
        if (!useCase) return;
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: useCase.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
        });
        document.head.appendChild(script);
        return () => script.remove();
    }, [useCase]);

    if (!useCase) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold">Use case not found</h1>
                <Link to="/use-cases" className="text-primary hover:underline">
                    Browse all use cases
                </Link>
            </div>
        );
    }

    const related = getRelatedUseCases(useCase);

    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Breadcrumb */}
            <nav className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
                <Link to="/use-cases" className="hover:text-primary transition">Use Cases</Link>
                <ChevronRight size={14} />
                <Link to={`/use-cases#${useCase.audience.slug}`} className="hover:text-primary transition">
                    {useCase.audience.name}
                </Link>
                <ChevronRight size={14} />
                <span className="text-gray-600">{useCase.templateName}</span>
            </nav>

            {/* Hero */}
            <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 bg-surface border border-gray-200 text-gray-500">
                    <Sparkles size={12} />
                    {useCase.templateCategory} · {useCase.audience.name}
                </div>
                <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
                    {useCase.headline}
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-8">
                    {useCase.intro}
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Link
                        to={`/blog/${useCase.templateId}`}
                        className="bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        Use the free {useCase.templateName} template
                        <ArrowRight size={18} />
                    </Link>
                </div>
                <ShareButtons title={useCase.title} url={`/use-cases/${useCase.slug}`} className="justify-center mt-8" />
            </header>

            {/* Pain points */}
            <section className="bg-surface border-y border-gray-100 py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                        Sound familiar?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {useCase.audience.painPoints.map((pain) => (
                            <div key={pain} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <p className="text-gray-600 leading-relaxed">{pain}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                        What this flow does for you
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {useCase.benefits.map((benefit) => (
                            <div key={benefit.title} className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
                                    <Check size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 bg-surface border-y border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-center">
                        How to launch it
                    </h2>
                    <ol className="space-y-6">
                        {useCase.steps.map((step, i) => (
                            <li key={step} className="flex gap-4 items-start">
                                <span className="shrink-0 w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <p className="text-gray-600 leading-relaxed pt-1.5">{step}</p>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-10 text-center">
                        <Link
                            to={`/blog/${useCase.templateId}`}
                            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition"
                        >
                            Start with this template <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                        Frequently asked questions
                    </h2>
                    <div className="space-y-4">
                        {useCase.faqs.map((faq) => (
                            <details
                                key={faq.question}
                                className="group rounded-2xl border border-gray-100 bg-white p-6 open:shadow-sm"
                            >
                                <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4">
                                    {faq.question}
                                    <ChevronRight size={18} className="shrink-0 text-gray-400 group-open:rotate-90 transition-transform" />
                                </summary>
                                <p className="mt-4 text-gray-500 leading-relaxed">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Related */}
            {related.length > 0 && (
                <section className="py-16 bg-surface border-t border-gray-100">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">Related use cases</h2>
                        <div className="grid sm:grid-cols-3 gap-6">
                            {related.map((r) => (
                                <Link
                                    key={r.slug}
                                    to={`/use-cases/${r.slug}`}
                                    className="group p-5 rounded-2xl border border-gray-100 bg-white hover:border-primary/20 hover:shadow-lg transition-all"
                                >
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                        {r.audience.name}
                                    </p>
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug">
                                        {r.headline}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Newsletter */}
            <section className="py-16">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <GuidePromo className="mb-8" />
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Get weekly QR marketing playbooks</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Use cases, template breakdowns, and automation recipes in your inbox.
                        </p>
                        <NewsletterSignup source={`use-case:${useCase.slug}`} />
                    </div>
                </div>
            </section>
        </div>
    );
}
