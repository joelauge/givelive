import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type Props = {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
};

/** Full-screen mobile nav drawer portaled to document.body (avoids overflow/stacking issues). */
export default function MobileDrawer({ open, onClose, children }: Props) {
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <>
            <button
                type="button"
                className="fixed inset-0 bg-black/40 z-[200] lg:hidden"
                aria-label="Close menu"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 left-0 z-[210] w-64 max-w-[85vw] h-full lg:hidden">{children}</div>
        </>,
        document.body
    );
}
