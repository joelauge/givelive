import { ArrowRight, FileDown } from 'lucide-react';
import { marketingFlows } from '../data/marketingFlows';

type Props = {
    className?: string;
};

/**
 * Lead-magnet banner for the Free QR Marketing Guide. The CTA opens our
 * live GiveLive flow, so readers experience the product while opting in.
 */
export default function GuidePromo({ className = '' }: Props) {
    return (
        <div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-primary to-slate-900 p-8 text-white ${className}`}
        >
            <div className="absolute top-0 right-0 w-56 h-56 bg-accent-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <FileDown size={26} className="text-accent-blue" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-accent-blue mb-1">
                        Free download
                    </p>
                    <h3 className="text-xl md:text-2xl font-bold font-display mb-1">
                        The QR Marketing Guide
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Strategy, placement, and follow-up playbooks for turning physical touchpoints
                        into automated pipelines. Delivered through a live GiveLive flow — so you
                        experience the product while you grab the guide.
                    </p>
                </div>
                <a
                    href={marketingFlows.qrMarketingGuideUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary font-bold text-sm hover:bg-gray-100 transition"
                >
                    Get the free guide
                    <ArrowRight size={16} />
                </a>
            </div>
        </div>
    );
}
