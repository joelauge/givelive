import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Bot,
    Check,
    Mail,
    Sparkles,
    Zap,
} from 'lucide-react';
import Logo from '../components/Logo';
import PlanCheckoutButton from '../components/PlanCheckoutButton';
import { aiFollowUpAddon, pricingPlans } from '../data/pricingPlans';
import { usePageSeo } from '../lib/seo';

export default function Pricing() {
    usePageSeo({
        title: 'Pricing',
        description:
            'Start free, upgrade when you are ready. Every GiveLive plan includes the journey builder, QR entry, and lead capture — you only pay as volume and automation needs grow.',
        path: '/pricing',
    });

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <Logo size="small" />
                    </div>
                    <Link
                        to="/admin"
                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition"
                    >
                        Start building <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Hero */}
            <section className="relative pt-16 pb-12 overflow-hidden bg-primary text-white">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[100px]" />
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
                    <p className="text-sm font-semibold text-accent-blue uppercase tracking-wider mb-4">
                        Simple, scalable pricing
                    </p>
                    <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-6">
                        Grow with QR flows that{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-purple to-secondary">
                            pay for themselves
                        </span>
                    </h1>
                    <p className="text-lg text-gray-400 leading-relaxed">
                        Start free, upgrade when you are ready. Every plan includes the journey builder,
                        QR entry, and lead capture — you only pay as volume and automation needs grow.
                    </p>
                </div>
            </section>

            {/* Plans */}
            <section className="py-16 md:py-20 bg-surface">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative flex flex-col rounded-3xl border bg-white p-8 transition-all duration-300 ${
                                    plan.highlighted
                                        ? 'border-accent-blue shadow-xl shadow-accent-blue/10 ring-2 ring-accent-blue/20 scale-[1.02] z-10'
                                        : 'border-gray-100 shadow-card hover:shadow-soft hover:-translate-y-1'
                                }`}
                            >
                                {plan.badge && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent-blue text-white text-xs font-bold uppercase tracking-wide">
                                        {plan.badge}
                                    </span>
                                )}
                                <div className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                                        {plan.priceDetail && (
                                            <span className="text-gray-500 font-medium">{plan.priceDetail}</span>
                                        )}
                                    </div>
                                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{plan.description}</p>
                                    {plan.audience && (
                                        <p className="mt-2 text-xs font-medium text-accent-purple">{plan.audience}</p>
                                    )}
                                    {plan.goal && (
                                        <p className="mt-2 text-xs text-gray-500 italic">{plan.goal}</p>
                                    )}
                                </div>

                                <ul className="flex-1 space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                                            <Check
                                                size={18}
                                                className={`shrink-0 mt-0.5 ${
                                                    plan.highlighted ? 'text-accent-blue' : 'text-green-600'
                                                }`}
                                            />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <PlanCheckoutButton plan={plan} highlighted={plan.highlighted} />
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-10 max-w-xl mx-auto">
                        All paid plans billed monthly. Limits apply per organization.{' '}
                        <Link to="/how-to" className="text-accent-blue font-medium hover:underline">
                            See how campaigns and leads work
                        </Link>
                        .
                    </p>
                </div>
            </section>

            {/* AI add-on */}
            <section className="py-16 bg-white border-y border-gray-100">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-primary to-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-accent-blue text-sm font-bold uppercase tracking-wider mb-4">
                                <Sparkles size={16} />
                                Revenue multiplier
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-display mb-2">
                                {aiFollowUpAddon.name}
                            </h2>
                            <p className="text-gray-400 text-sm mb-1">{aiFollowUpAddon.tagline}</p>
                            <div className="flex items-baseline gap-2 mt-4 mb-6">
                                <span className="text-4xl font-black">{aiFollowUpAddon.price}</span>
                                <span className="text-gray-400">{aiFollowUpAddon.priceDetail}</span>
                                <span className="text-sm text-gray-500 ml-2">add-on to any paid plan</span>
                            </div>
                            <p className="text-gray-300 leading-relaxed mb-8 max-w-2xl">
                                {aiFollowUpAddon.description}
                            </p>
                            <ul className="grid sm:grid-cols-2 gap-4 mb-8">
                                {aiFollowUpAddon.features.map((feature) => (
                                    <li
                                        key={feature}
                                        className="flex items-center gap-3 text-sm bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                                    >
                                        <Bot size={18} className="text-accent-blue shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={aiFollowUpAddon.ctaHref}
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-primary font-bold hover:bg-gray-100 transition"
                            >
                                {aiFollowUpAddon.cta}
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison highlights */}
            <section className="py-16 md:py-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-2xl md:text-3xl font-bold font-display text-gray-900 text-center mb-10">
                        Does this sound familiar?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-surface border border-gray-100">
                            <Zap className="text-accent-blue mb-4" size={28} />
                            <h3 className="font-bold text-gray-900 mb-2">Looking for proof this works?</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Start free with one campaign and 100 leads — enough real scans at your location to
                                see if it fits your team before you spend anything.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-surface border border-gray-100">
                            <Check className="text-green-600 mb-4" size={28} />
                            <h3 className="font-bold text-gray-900 mb-2">Lead gen tech too hard?</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Starter keeps it simple: your branding, CSV export, and flat pricing — no juggling
                                tools or paying again every time someone scans a code.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-surface border border-gray-100">
                            <Bot className="text-accent-purple mb-4" size={28} />
                            <h3 className="font-bold text-gray-900 mb-2">No time to follow up after the event?</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Add the Follow-Up Assistant when you need it — optional and separate from your plan,
                                so you only pay when help nurturing leads actually matters.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap note */}
            <section className="pb-20">
                <div className="container mx-auto px-4 max-w-2xl text-center">
                    <p className="text-sm text-gray-500 mb-6">
                        Paid plans use secure Stripe checkout. Plan limits are enforced progressively — see{' '}
                        <Link to="/how-to" className="text-accent-blue hover:underline">
                            How To
                        </Link>{' '}
                        for setup help.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/admin"
                            className="h-12 px-8 rounded-full bg-primary text-white font-bold hover:bg-primary-light transition flex items-center gap-2"
                        >
                            Start building free <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/how-to"
                            className="h-12 px-8 rounded-full border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
                        >
                            Read How To
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
