import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import GiveLiveWatermark from './GiveLiveWatermark';

type Props = {
    children: ReactNode;
    showBanner: boolean;
    eventId?: string;
    overlay?: ReactNode;
    embedUrl?: string | null;
};

export default function GiveLiveScannerShell({
    children,
    showBanner,
    eventId,
    overlay,
    embedUrl,
}: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [showOpenDirectly, setShowOpenDirectly] = useState(false);

    useEffect(() => {
        if (!embedUrl) {
            setShowOpenDirectly(false);
            return;
        }

        const timer = window.setTimeout(() => setShowOpenDirectly(true), 2500);
        return () => window.clearTimeout(timer);
    }, [embedUrl]);

    const openDirectly = () => {
        if (embedUrl) {
            window.location.assign(embedUrl);
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
            <div className="flex-1 min-h-0 w-full relative">
                {embedUrl ? (
                    <>
                        <iframe
                            ref={iframeRef}
                            src={embedUrl}
                            title="Destination"
                            className="absolute inset-0 w-full h-full border-0 bg-white"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation allow-presentation"
                            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        />
                        {showOpenDirectly && (
                            <div className="absolute top-3 left-0 right-0 z-20 flex justify-center px-4 pointer-events-none">
                                <button
                                    type="button"
                                    onClick={openDirectly}
                                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-md px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-primary transition"
                                >
                                    <ExternalLink size={12} />
                                    Open site directly
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full overflow-auto">{children}</div>
                )}
            </div>
            {showBanner && <GiveLiveWatermark eventId={eventId} />}
            {overlay}
        </div>
    );
}
