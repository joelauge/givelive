import { ChevronRight } from 'lucide-react';
import logoBlue from '../assets/givelive_logo_blue.png';
import { watermarkUrl } from '../lib/watermark';

type Props = {
    eventId?: string;
    preview?: boolean;
    className?: string;
};

export default function GiveLiveWatermark({
    eventId,
    preview = false,
    className = '',
}: Props) {
    const href = watermarkUrl('page', eventId);

    return (
        <div
            className={`shrink-0 w-full border-t border-gray-200/80 bg-white backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)] z-50 ${className}`}
            style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
        >
            <div className="px-3 sm:px-4 py-2.5 flex items-center justify-center gap-2 text-center max-w-lg mx-auto">
                <img src={logoBlue} alt="" className="h-4 sm:h-5 w-auto shrink-0" aria-hidden />
                <p className="text-[11px] sm:text-xs text-gray-600 leading-snug">
                    {preview && (
                        <span className="block text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-0.5">
                            Free plan preview
                        </span>
                    )}
                    <span className="whitespace-nowrap">
                        QR Provided by{' '}
                        <span className="font-semibold text-gray-800">GiveLive.app</span>
                    </span>
                    <ChevronRight size={12} className="inline-block mx-0.5 -mt-px text-gray-400 align-middle" aria-hidden />
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary hover:underline whitespace-nowrap"
                    >
                        Get Yours Free
                    </a>
                </p>
            </div>
        </div>
    );
}
