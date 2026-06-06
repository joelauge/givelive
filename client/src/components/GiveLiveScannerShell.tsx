import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import logoBlue from '../assets/givelive_logo_blue.png';
import GiveLiveWatermark from './GiveLiveWatermark';
import {
    BLOCKED_REDIRECT_DWELL_MS,
    IFRAME_DETECT_DELAY_MS,
    IFRAME_LOAD_TIMEOUT_MS,
    isIframeEmbedBlocked,
} from '../lib/iframeEmbed';

export type EmbedMode = 'iframe' | 'redirect-only';

type Props = {
    children: ReactNode;
    showBanner: boolean;
    eventId?: string;
    overlay?: ReactNode;
    embedUrl?: string | null;
    embedMode?: EmbedMode;
};

type EmbedState = 'loading' | 'embedded' | 'blocked';

export default function GiveLiveScannerShell({
    children,
    showBanner,
    eventId,
    overlay,
    embedUrl,
    embedMode = 'iframe',
}: Props) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const embedStartedAt = useRef<number>(0);
    const redirectTimerRef = useRef<number | null>(null);
    const loadTimeoutRef = useRef<number | null>(null);
    const resolvedRef = useRef(false);
    const [embedState, setEmbedState] = useState<EmbedState>('loading');
    const [secondsLeft, setSecondsLeft] = useState(
        Math.ceil(BLOCKED_REDIRECT_DWELL_MS / 1000)
    );

    const clearRedirectTimer = useCallback(() => {
        if (redirectTimerRef.current !== null) {
            window.clearTimeout(redirectTimerRef.current);
            redirectTimerRef.current = null;
        }
    }, []);

    const clearLoadTimeout = useCallback(() => {
        if (loadTimeoutRef.current !== null) {
            window.clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }
    }, []);

    const redirectToDestination = useCallback(() => {
        if (!embedUrl) return;
        clearRedirectTimer();
        window.location.replace(embedUrl);
    }, [embedUrl, clearRedirectTimer]);

    const scheduleBlockedRedirect = useCallback(() => {
        setEmbedState('blocked');
        const elapsed = Date.now() - embedStartedAt.current;
        const remaining = Math.max(0, BLOCKED_REDIRECT_DWELL_MS - elapsed);
        setSecondsLeft(Math.max(1, Math.ceil(remaining / 1000)));

        clearRedirectTimer();
        redirectTimerRef.current = window.setTimeout(redirectToDestination, remaining);
    }, [clearRedirectTimer, redirectToDestination]);

    const resolveEmbed = useCallback(
        (state: 'embedded' | 'blocked') => {
            if (resolvedRef.current) return;
            resolvedRef.current = true;
            clearLoadTimeout();

            if (state === 'blocked') {
                scheduleBlockedRedirect();
            } else {
                setEmbedState('embedded');
            }
        },
        [clearLoadTimeout, scheduleBlockedRedirect]
    );

    const checkEmbedStatus = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe || !embedUrl || resolvedRef.current) return;

        window.setTimeout(() => {
            if (resolvedRef.current) return;
            resolveEmbed(isIframeEmbedBlocked(iframe, embedUrl) ? 'blocked' : 'embedded');
        }, IFRAME_DETECT_DELAY_MS);
    }, [embedUrl, resolveEmbed]);

    useEffect(() => {
        if (!embedUrl) {
            setEmbedState('loading');
            resolvedRef.current = false;
            clearRedirectTimer();
            clearLoadTimeout();
            return;
        }

        embedStartedAt.current = Date.now();
        resolvedRef.current = false;
        setSecondsLeft(Math.ceil(BLOCKED_REDIRECT_DWELL_MS / 1000));

        if (embedMode === 'redirect-only') {
            resolvedRef.current = true;
            scheduleBlockedRedirect();
            return () => clearRedirectTimer();
        }

        setEmbedState('loading');

        loadTimeoutRef.current = window.setTimeout(() => {
            resolveEmbed('blocked');
        }, IFRAME_LOAD_TIMEOUT_MS);

        return () => {
            clearLoadTimeout();
            clearRedirectTimer();
        };
    }, [
        embedUrl,
        embedMode,
        clearRedirectTimer,
        clearLoadTimeout,
        resolveEmbed,
        scheduleBlockedRedirect,
    ]);

    useEffect(() => {
        if (embedState !== 'blocked') return;

        const interval = window.setInterval(() => {
            setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => window.clearInterval(interval);
    }, [embedState]);

    const handleIframeLoad = () => {
        if (resolvedRef.current || embedMode === 'redirect-only') return;
        checkEmbedStatus();
    };

    const showBlockedUi = embedState === 'blocked';
    const showLoadingUi = embedMode === 'iframe' && embedState === 'loading';

    return (
        <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
            <div className="flex-1 min-h-0 w-full relative">
                {embedUrl ? (
                    <>
                        {embedMode === 'iframe' && (
                            <iframe
                                ref={iframeRef}
                                src={embedUrl}
                                title="Destination"
                                onLoad={handleIframeLoad}
                                className={`absolute inset-0 w-full h-full border-0 bg-white ${
                                    showBlockedUi ? 'opacity-0 pointer-events-none' : ''
                                }`}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation allow-presentation"
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                            />
                        )}

                        {showLoadingUi && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        )}

                        {showBlockedUi && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-white">
                                <img src={logoBlue} alt="GiveLive" className="h-12 w-auto mb-6" />
                                <p className="text-gray-600 text-sm leading-relaxed max-w-xs mb-6">
                                    Opening your destination…
                                </p>
                                <button
                                    type="button"
                                    onClick={redirectToDestination}
                                    className="py-3 px-6 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                                >
                                    {secondsLeft > 0
                                        ? `Continue (${secondsLeft}s)`
                                        : 'Continue…'}
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
