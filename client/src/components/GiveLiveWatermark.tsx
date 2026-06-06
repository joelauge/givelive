import { watermarkUrl } from '../lib/watermark';

type Props = {
    eventId?: string;
    preview?: boolean;
    className?: string;
};

export default function GiveLiveWatermark({ eventId, preview = false, className = '' }: Props) {
    const href = watermarkUrl('page', eventId);

    return (
        <div
            className={`w-full border-t border-gray-100 bg-gray-50/90 backdrop-blur-sm ${className}`}
            style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
            <div className="px-4 py-3 flex flex-col items-center justify-center gap-1 text-center">
                {preview && (
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">
                        Free plan preview
                    </p>
                )}
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition group"
                >
                    <span className="font-semibold text-gray-700 group-hover:text-primary">
                        Made with GiveLive.app
                    </span>
                </a>
            </div>
        </div>
    );
}
