import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import PaymentSection from './PaymentSection';

interface NodeRendererProps {
    node: any;
    onNext: (action?: string) => void;
    isSubmitting?: boolean;
    eventId?: string;
    userId?: string;
}

export default function NodeRenderer({ node, onNext, isSubmitting = false, eventId, userId }: NodeRendererProps) {

    const { data } = node;
    const type = data?.type || node.type; // Robust type detection

    const [formState, setFormState] = useState<any>({});
    const [showMockCheckout, setShowMockCheckout] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!data) return <div>Loading...</div>;

    // Handle different node types
    // Handle different node types
    if (type === 'start') {
        return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    const isSms = type === 'sms' || (type === 'message' && data?.messageType === 'sms');

    if (isSms) {
        return (
            <div className="w-full min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                    <p className="text-gray-600 mb-4">
                        {data.smsMessage || data.smsMessages?.[0] || data.message || 'Check your phone for a text message to continue.'}
                    </p>
                    <div className="text-sm text-gray-400">Waiting for your response...</div>
                </div>
            </div>
        );
    }

    if (['page', 'donation'].includes(type)) {
        return (
            <div className="w-full min-h-screen bg-white">
                {/* Render Sections */}
                <div className="flex flex-col">
                    {data.sections?.map((section: any) => {
                        const { type, content, id } = section;

                        // ... (same section rendering logic as before: header, text, image, video, form, payment, choice) ...
                        if (type === 'header') {
                            return (
                                <div key={id} className="p-6 text-center" style={{ backgroundColor: content.backgroundColor || 'transparent' }}>
                                    <h1 className="text-2xl font-bold text-gray-900" style={{ color: content.textColor }}>{content.title}</h1>
                                    {content.subtitle && <p className="text-gray-500 mt-2">{content.subtitle}</p>}
                                </div>
                            );
                        }

                        if (type === 'text') {
                            return (
                                <div key={id} className="px-6 py-4 leading-relaxed" style={{
                                    textAlign: content.textAlign || content.align as any,
                                    color: content.color || '#4B5563',
                                    fontFamily: content.fontFamily === 'serif' ? 'serif' : content.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
                                    fontWeight: content.fontWeight || 'normal',
                                    fontSize: content.fontSize ? `${content.fontSize}px` : 'inherit',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {content.text}
                                </div>
                            );
                        }

                        if (type === 'image') {
                            return (
                                <div key={id} className="w-full px-6 py-4 flex justify-center">
                                    <div
                                        className={`overflow-hidden flex justify-center`}
                                        style={{
                                            borderRadius: `${content.borderRadius || 0}px`,
                                            height: (!content.sizeMode || content.sizeMode === 'fit') ? `${content.height || 200}px` : 'auto',
                                            width: '100%',
                                            maxWidth: '100%'
                                        }}
                                    >
                                        <img
                                            src={content.url || 'https://via.placeholder.com/400x200'}
                                            alt={content.alt || "Section"}
                                            className={`w-full h-full ${(!content.sizeMode || content.sizeMode === 'fit') ? 'object-cover' : 'object-contain'}`}
                                            style={{
                                                maxHeight: (!content.sizeMode || content.sizeMode === 'fit') ? 'none' : 'none',
                                                width: (!content.sizeMode || content.sizeMode === 'fit') ? '100%' : '100%'
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        if (type === 'columns') {
                            return (
                                <div key={id} className="grid grid-cols-2 gap-4 px-6 py-4">
                                    <div className="text-sm whitespace-pre-wrap">{content.left}</div>
                                    <div className="text-sm whitespace-pre-wrap">{content.right}</div>
                                </div>
                            );
                        }

                        if (type === 'link') {
                            return (
                                <div key={id} className="px-6 py-4 flex justify-center" style={{ textAlign: content.textAlign || 'center' }}>
                                    {content.style === 'button' ? (
                                        <a
                                            href={content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-6 py-3 rounded-xl font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                                            style={{ backgroundColor: content.buttonColor || '#000000' }}
                                        >
                                            {content.label}
                                        </a>
                                    ) : (
                                        <a
                                            href={content.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block hover:underline"
                                            style={{ color: content.textColor || '#000000', fontWeight: 'bold' }}
                                        >
                                            {content.label}
                                        </a>
                                    )}
                                </div>
                            );
                        }

                        if (type === 'download') {
                            return (
                                <div key={id} className="px-6 py-4 flex justify-center">
                                    <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg transition hover:scale-[1.02] active:scale-[0.98] w-full max-w-[280px]"
                                        style={{ backgroundColor: content.buttonColor || '#000000', color: '#ffffff' }}
                                    >
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{content.buttonText || 'Download File'}</div>
                                            <div className="text-[10px] opacity-80 truncate">{content.fileName || 'File'}</div>
                                        </div>
                                    </a>
                                </div>
                            );
                        }

                        if (type === 'video') {
                            return (
                                <div key={id} className="w-full bg-black">
                                    <iframe
                                        src={content.url?.replace('watch?v=', 'embed/')}
                                        className="w-full h-screen"
                                        allowFullScreen
                                    />
                                </div>
                            );
                        }

                        if (type === 'form') {
                            const isDonation = content.fields?.includes('amount');

                            const handleSubmit = (e: React.FormEvent) => {
                                e.preventDefault();

                                if (isDonation) {
                                    // Check for payment gateway
                                    const stripeConnected = localStorage.getItem('givelive_stripe_connected') === 'true';
                                    const paypalConnected = localStorage.getItem('givelive_paypal_connected') === 'true';

                                    if (!stripeConnected && !paypalConnected) {
                                        // Show Mock Checkout
                                        setShowMockCheckout(true);
                                        return;
                                    }
                                }

                                // Pass form data to next handler
                                onNext(formState);
                            };

                            return (
                                <div key={id} className="p-6" style={{ paddingTop: content.paddingTop, paddingBottom: content.paddingBottom }}>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {content.fields?.map((field: string) => (
                                            <div key={field}>
                                                {field === 'amount' ? (
                                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                                        {[10, 25, 50].map(amt => (
                                                            <button
                                                                key={amt}
                                                                type="button"
                                                                onClick={() => setFormState({ ...formState, amount: amt })}
                                                                className={`py-2 rounded-lg border font-medium transition ${formState.amount === amt ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-primary'}`}
                                                            >
                                                                ${amt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={field === 'email' ? 'email' : 'text'}
                                                        placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                                        required
                                                        onChange={e => setFormState({ ...formState, [field]: e.target.value })}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                            style={{ backgroundColor: content.buttonColor || '#000000' }}
                                        >
                                            {isSubmitting ? 'Processing...' : (content.buttonText || 'Submit')}
                                        </button>
                                    </form>
                                </div>
                            );
                        }


                        if (type === 'payment') {
                            return (
                                <PaymentSection
                                    key={id}
                                    id={id}
                                    content={content}
                                    formState={formState}
                                    setFormState={setFormState}
                                    eventId={eventId || ''}
                                    userId={userId || ''}
                                />
                            );
                        }

                        if (type === 'choice') {
                            return (
                                <div key={id} className="p-6 grid gap-3">
                                    {content.choices?.map((choice: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => onNext(choice.label)}
                                            className="w-full p-4 rounded-xl border-2 border-gray-100 font-bold text-gray-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition text-left flex justify-between items-center group"
                                        >
                                            <span>{choice.label}</span>
                                            <span className="text-gray-300 group-hover:text-primary transition">→</span>
                                        </button>
                                    ))}
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>

                {/* Mock Checkout Modal */}
                {showMockCheckout && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                        <CreditCard size={16} />
                                    </div>
                                    <span className="font-bold text-gray-900">Secure Checkout</span>
                                </div>
                                <div className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded">TEST MODE</div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                                    <p className="font-bold mb-1">Demo Donation</p>
                                    <p>This is a mock checkout because no payment gateway is connected.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                                    <div className="flex gap-3">
                                        <div className="h-12 bg-gray-100 rounded-lg flex-1 animate-pulse"></div>
                                        <div className="h-12 bg-gray-100 rounded-lg w-20 animate-pulse"></div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setProcessing(true);
                                        setTimeout(() => {
                                            setProcessing(false);
                                            setShowMockCheckout(false);
                                            onNext('donate_success');
                                        }, 1500);
                                    }}
                                    disabled={processing}
                                    className="w-full py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2"
                                >
                                    {processing ? 'Processing...' : `Pay $${formState.amount || 0}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 bg-red-50 text-red-700">
            <h3 className="font-bold">Unsupported node type: {type}</h3>
            <pre className="text-xs mt-2 overflow-auto bg-white p-2 border border-red-200 rounded">
                {JSON.stringify(node, null, 2)}
            </pre>
        </div>
    );
}
