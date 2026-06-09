import { Link } from 'react-router-dom';
import { ArrowRight, QrCode } from 'lucide-react';
import { audiences, getUseCasesByAudience } from '../data/useCases';
import { usePageSeo } from '../lib/seo';

export default function UseCaseIndex() {
    usePageSeo({
        title: 'QR Flow Use Cases by Industry',
        description:
            'See how real estate agents, churches, nonprofits, restaurants, event organizers, and creators use GiveLive QR flows to capture leads, take payments, and automate follow-up.',
        path: '/use-cases',
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="bg-primary text-white pt-20 pb-16 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-accent-blue/10 rounded-full blur-[120px]" />
                <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
                    <p className="text-sm font-semibold text-accent-blue uppercase tracking-wider mb-4">
                        Use cases
                    </p>
                    <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-6">
                        QR flows for{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-secondary">
                            your industry
                        </span>
                    </h1>
                    <p className="text-lg text-gray-400 leading-relaxed">
                        Every industry has moments where a scan beats a form, a flyer, or a follow-up call.
                        Find yours below — each use case starts from a free template.
                    </p>
                </div>
            </section>

            {/* Audience sections */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-20">
                {audiences.map((audience) => {
                    const cases = getUseCasesByAudience(audience.slug);
                    if (cases.length === 0) return null;

                    return (
                        <section key={audience.slug} id={audience.slug} className="scroll-mt-24">
                            <div className="max-w-3xl mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-3">
                                    {audience.name}
                                </h2>
                                <p className="text-gray-500 leading-relaxed">{audience.blurb}</p>
                            </div>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cases.map((useCase) => (
                                    <Link
                                        key={useCase.slug}
                                        to={`/use-cases/${useCase.slug}`}
                                        className="group flex flex-col p-6 rounded-2xl border border-gray-100 bg-surface hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                                            <QrCode size={14} />
                                            {useCase.templateCategory}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                            {useCase.headline}
                                        </h3>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                                            {useCase.metaDescription}
                                        </p>
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                                            See how it works
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>

            {/* CTA */}
            <section className="py-20 bg-primary text-center">
                <div className="container mx-auto px-4 max-w-2xl">
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-4">
                        Don't see your exact use case?
                    </h2>
                    <p className="text-gray-400 mb-8">
                        Every flow is built from composable blocks — pages, forms, payments, SMS, email,
                        and integrations. If you can sketch it, you can build it.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/admin"
                            className="h-12 px-8 rounded-full bg-white text-primary font-bold hover:bg-gray-100 transition flex items-center gap-2"
                        >
                            Start building free <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/blog"
                            className="h-12 px-8 rounded-full border border-white/20 text-white font-bold hover:bg-white/10 transition flex items-center"
                        >
                            Browse all templates
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
