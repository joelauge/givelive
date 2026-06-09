import { X } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
};

/** Lightweight full-page overlay for Stripe Embedded Checkout — scrollable, minimal chrome. */
export default function CheckoutOverlay({ isOpen, onClose, title, children }: Props) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
            <div className="min-h-full flex justify-center p-4 py-8">
                <div className="w-full max-w-2xl bg-surface rounded-3xl shadow-2xl">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-surface z-10 rounded-t-3xl">
                        <h3 className="text-xl font-bold text-primary">{title}</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-700"
                            aria-label="Close checkout"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="px-2 pb-4">{children}</div>
                </div>
            </div>
        </div>
    );
}
