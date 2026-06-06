import type { ReactNode } from 'react';
import GiveLiveWatermark from './GiveLiveWatermark';

type Props = {
    children: ReactNode;
    showBanner: boolean;
    eventId?: string;
    overlay?: ReactNode;
};

/**
 * Shell that keeps scanner flow content in a scrollable viewport with a
 * persistent bottom banner — same UX as an invisible frame + branded chrome.
 */
export default function GiveLiveScannerShell({ children, showBanner, eventId, overlay }: Props) {
    return (
        <div className={`min-h-screen bg-background flex flex-col ${showBanner ? 'pb-[52px]' : ''}`}>
            <div className="flex-1 min-h-0 w-full">{children}</div>
            {showBanner && <GiveLiveWatermark eventId={eventId} fixed />}
            {overlay}
        </div>
    );
}
