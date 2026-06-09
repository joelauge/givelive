import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    CreditCard,
    LayoutTemplate,
    Mail,
    MessageSquare,
    QrCode,
    Rocket,
    Settings,
    Smartphone,
    Workflow,
    Zap,
} from 'lucide-react';
import Logo from '../components/Logo';
import { usePageSeo } from '../lib/seo';

type Step = { title: string; body: string };

type Section = {
    id: string;
    icon: React.ReactNode;
    title: string;
    intro: string;
    steps: Step[];
    tip?: string;
};

const sections: Section[] = [
    {
        id: 'get-started',
        icon: <Rocket size={22} className="text-accent-blue" />,
        title: 'Get started',
        intro: 'GiveLive helps you turn real-world moments—real locations, signage, packaging, and on-site touchpoints—into automated lead capture and follow-up using QR-powered journeys.',
        steps: [
            {
                title: 'Create your account',
                body: 'Click Start Building Free on the homepage and sign in. You land on the dashboard where all your flows live.',
            },
            {
                title: 'Understand the pieces',
                body: 'A flow is a journey: a Start trigger (QR / link), one or more steps (mobile pages, SMS, email, delays, payments), and optional integrations that sync leads to your stack.',
            },
        ],
    },
    {
        id: 'create-flow',
        icon: <LayoutTemplate size={22} className="text-accent-purple" />,
        title: 'Create a new flow',
        intro: 'Each flow is tied to a unique URL and QR code. You can start blank or from a template.',
        steps: [
            {
                title: 'Start from the dashboard',
                body: 'Open the admin dashboard and click New Flow (or pick a template from the sidebar). Name your flow something you will recognize later—e.g. "Spring Gala Check-in" or "Open House Leads".',
            },
            {
                title: 'Use templates (optional)',
                body: 'Browse categories like Fundraising, Real Locations, Lead Magnets, and Real Estate. Templates pre-build pages and messages; you customize copy, images, and connections in the journey builder.',
            },
            {
                title: 'Open the journey builder',
                body: 'After creating a flow, you are taken to the visual builder: a canvas with a Start node and tools to add and connect steps.',
            },
        ],
    },
    {
        id: 'qr-start',
        icon: <QrCode size={22} className="text-primary" />,
        title: 'Configure the QR / Link start',
        intro: 'Every published flow begins when someone scans your QR code or opens your unique link. The Start node controls that entry experience.',
        steps: [
            {
                title: 'Select QR / Link as the trigger',
                body: 'Click the Start node on the canvas, then in the right panel confirm Trigger Source is QR / Link. This is the default for new flows.',
            },
            {
                title: 'Add a campaign image',
                body: 'Upload or choose a Campaign Image (recommended 1200×630px). It powers link previews when you share the flow URL in SMS, iMessage, or social posts.',
            },
            {
                title: 'Copy your flow URL and download QR assets',
                body: 'Use the unique flow URL to test in a browser. Download the QR as SVG or PNG for print, slides, or signage. The preview QR in the panel matches what scanners will use.',
            },
            {
                title: 'Simple redirect-only flows (optional)',
                body: 'If you only need to send people to an external site, set Auto-forward URL and enable End flow here on the Start node. You can publish without adding any other steps.',
            },
        ],
        tip: 'Test before you print: open the flow link on your phone and walk through every step you expect scanners to see.',
    },
    {
        id: 'build-journey',
        icon: <Workflow size={22} className="text-accent-blue" />,
        title: 'Build your journey on the canvas',
        intro: 'Connect nodes in order from Start to each next step. The builder saves drafts automatically; publishing makes the journey live.',
        steps: [
            {
                title: 'Connect the Start node',
                body: 'From the Start node, add your first step—typically a Page or Payment Page. Every path must eventually end at a node marked End Journey, a dedicated end step, or the Start auto-forward option.',
            },
            {
                title: 'Add pages',
                body: 'Page nodes are mobile-friendly landing steps. Use the page builder to add headers, text, images, forms (name, email, phone), choice buttons, links, and payment blocks.',
            },
            {
                title: 'Add payment pages',
                body: 'Payment Page nodes collect donations or purchases with Stripe. Configure amounts, one-time vs monthly, and which fields to collect before checkout.',
            },
            {
                title: 'Add delays',
                body: 'Delay nodes pause the journey (minutes, hours, or days) before the next step—useful for spaced follow-ups after a scan.',
            },
            {
                title: 'Add SMS and email messages',
                body: 'Message nodes send texts, emails, or both. Write the message body, optional email subject, and sequences with delays between texts. Mark a message as End Journey if it is the final touchpoint.',
            },
            {
                title: 'Mark endpoints',
                body: 'On any page or message, toggle End Journey Here so the flow can finish without another connection. Otherwise, connect each node to the next step or you will see publish warnings.',
            },
        ],
    },
    {
        id: 'integrations',
        icon: <Zap size={22} className="text-orange-500" />,
        title: 'Connect integrations',
        intro: 'Push captured leads into the tools you already use—without manual exports.',
        steps: [
            {
                title: 'Add an integration node',
                body: 'From the Start node menu (or downstream nodes), open Integrations and pick a connector: Follow Up Boss, HubSpot, Salesforce, Mailchimp, Constant Contact, Brevo, Zapier, Make, or n8n.',
            },
            {
                title: 'Configure credentials',
                body: 'Select the node and enter API keys, list IDs, or webhook URLs in the properties panel. Use Test Connection when available to verify before publishing.',
            },
            {
                title: 'Place integrations after capture',
                body: 'Best practice: put integration nodes after a form or payment step so name, email, and phone are already collected.',
            },
        ],
    },
    {
        id: 'publish',
        icon: <CheckCircle2 size={22} className="text-green-600" />,
        title: 'Publish your flow',
        intro: 'Publishing writes your canvas to the journey scanners experience when they scan or open your link.',
        steps: [
            {
                title: 'Save your draft',
                body: 'Use Save in the builder to store work in progress. Drafts are safe to edit; only published flows are live for scanners.',
            },
            {
                title: 'Run publish checks',
                body: 'Click Publish. GiveLive validates your flow: Start must use QR / Link, the Start node must connect to a first step (unless auto-forward end), nodes need content, and nothing should be orphaned or dead-ended without an explicit end.',
            },
            {
                title: 'Fix issues and publish again',
                body: 'If validation fails, read each message in the modal—switch social-only drafts to QR / Link, connect missing nodes, or complete empty pages and messages—then publish again.',
            },
        ],
        tip: 'Flows saved with unsupported trigger types cannot publish until you switch the Start node to QR / Link.',
    },
    {
        id: 'go-live',
        icon: <Smartphone size={22} className="text-accent-purple" />,
        title: 'Go live with your QR code',
        intro: 'Once published, your flow is ready for the real world.',
        steps: [
            {
                title: 'Distribute the QR',
                body: 'Print PNG/SVG on signage, badges, table tents, or slides. You can also paste the flow URL in SMS blasts, email signatures, or social bios.',
            },
            {
                title: 'What scanners experience',
                body: 'They scan → land on your first page (or auto-forward URL) → submit forms or pay → receive scheduled SMS/email → data syncs to integrations you configured.',
            },
            {
                title: 'Update without reprinting (when possible)',
                body: 'Editing and re-publishing changes the live journey behind the same URL/QR. Reprint only if you change domains or need a physically different code.',
            },
        ],
    },
    {
        id: 'analytics',
        icon: <BarChart3 size={22} className="text-primary" />,
        title: 'Track performance',
        intro: 'Measure how your acquisition funnel performs after launch.',
        steps: [
            {
                title: 'Open Analytics',
                body: 'From the dashboard or builder, open Analytics for a flow. View sends, click-through, replies, and revenue where payment steps exist.',
            },
            {
                title: 'Optimize the journey',
                body: 'Low CTR on a message? Shorten copy or move the link higher. Drop-off on a page? Simplify the form or reduce required fields.',
            },
        ],
    },
    {
        id: 'settings',
        icon: <Settings size={22} className="text-gray-700" />,
        title: 'Account and channel settings',
        intro: 'Configure the channels and payments that power your journeys.',
        steps: [
            {
                title: 'Payments',
                body: 'In Settings, connect Stripe (and PayPal if enabled) so Payment Page nodes can accept cards on published flows.',
            },
            {
                title: 'Email',
                body: 'Under Email Configurations, set your SMTP or provider details so message nodes can send mail from your domain.',
            },
            {
                title: 'SMS',
                body: 'SMS delivery uses your configured Twilio account on the server. Ensure your account is provisioned before relying on text steps in production.',
            },
        ],
    },
];

const quickLinks = [
    { label: 'Dashboard & new flows', href: '#create-flow' },
    { label: 'QR start setup', href: '#qr-start' },
    { label: 'Build the journey', href: '#build-journey' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Publish', href: '#publish' },
    { label: 'Go live', href: '#go-live' },
    { label: 'Analytics', href: '#analytics' },
    { label: 'Settings', href: '#settings' },
];

export default function HowTo() {
    usePageSeo({
        title: 'How to use GiveLive',
        description:
            'Step-by-step guides for building QR-powered acquisition flows—from your first scan to automated follow-up and CRM sync.',
        path: '/how-to',
    });

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
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
                        Open dashboard <ArrowRight size={16} />
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
                <p className="text-sm font-semibold text-accent-blue uppercase tracking-wider mb-3">Documentation</p>
                <h1 className="text-4xl md:text-5xl font-bold font-display text-gray-900 mb-4">How to use GiveLive</h1>
                <p className="text-lg text-gray-600 leading-relaxed mb-10 max-w-2xl">
                    Step-by-step guides for building QR-powered acquisition flows—from your first scan to automated
                    follow-up and CRM sync.
                </p>

                <nav className="mb-12 p-6 rounded-2xl bg-surface border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">On this page</h2>
                    <ul className="grid sm:grid-cols-2 gap-2">
                        {quickLinks.map((link) => (
                            <li key={link.href}>
                                <a
                                    href={link.href}
                                    className="text-sm text-gray-600 hover:text-primary transition flex items-center gap-2"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent-blue shrink-0" />
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="space-y-14">
                    {sections.map((section, sectionIndex) => (
                        <section key={section.id} id={section.id} className="scroll-mt-24">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-11 h-11 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    {section.icon}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Step {sectionIndex + 1}
                                    </p>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{section.title}</h2>
                                </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-6 ml-0 md:ml-[3.75rem]">{section.intro}</p>

                            <ol className="space-y-5 ml-0 md:ml-[3.75rem]">
                                {section.steps.map((step, i) => (
                                    <li
                                        key={step.title}
                                        className="relative pl-8 border-l-2 border-gray-100 last:border-transparent"
                                    >
                                        <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                                            {i + 1}
                                        </span>
                                        <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">{step.body}</p>
                                    </li>
                                ))}
                            </ol>

                            {section.tip && (
                                <div className="mt-6 ml-0 md:ml-[3.75rem] p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-900">
                                    <strong className="font-semibold">Tip: </strong>
                                    {section.tip}
                                </div>
                            )}
                        </section>
                    ))}
                </div>

                <section className="mt-16 p-8 rounded-3xl bg-primary text-white text-center">
                    <h2 className="text-2xl font-bold font-display mb-3">Ready to build your first flow?</h2>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                        Sign in, create a flow, configure your QR start, and publish in minutes.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            to="/admin"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-primary font-bold hover:bg-gray-100 transition"
                        >
                            Go to dashboard <ArrowRight size={18} />
                        </Link>
                        <Link
                            to="/blog"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/10 border border-white/20 font-bold hover:bg-white/15 transition"
                        >
                            Browse templates
                        </Link>
                    </div>
                </section>

                <div className="mt-10 flex flex-wrap gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-green-600" /> SMS sequences
                    </span>
                    <span className="flex items-center gap-2">
                        <Mail size={16} className="text-green-600" /> Email steps
                    </span>
                    <span className="flex items-center gap-2">
                        <CreditCard size={16} className="text-blue-600" /> Stripe payments
                    </span>
                    <span className="flex items-center gap-2">
                        <QrCode size={16} className="text-primary" /> QR / link entry
                    </span>
                </div>
            </div>
        </div>
    );
}
