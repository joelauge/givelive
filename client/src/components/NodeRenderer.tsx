import { useState } from 'react';
import { CreditCard } from 'lucide-react';

interface NodeRendererProps {
    node: any;
    onNext: (action?: string) => void;
}

export default function NodeRenderer({ node, onNext }: NodeRendererProps) {
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

    if (type === 'sms') {
        return (
            <div className="w-full min-h-screen bg-background flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                    <p className="text-gray-600 mb-4">{data.message || 'Check your phone for a text message to continue.'}</p>
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
                                <div key={id} className="px-6 py-4 text-gray-600 leading-relaxed" style={{ textAlign: content.align as any }}>
                                    {content.text}
                                </div>
                            );
                        }

                        if (type === 'image') {
                            return (
                                <div key={id} className="w-full overflow-hidden">
                                    <img src={content.url || 'https://via.placeholder.com/400x200'} alt="Section" className="w-full h-auto object-cover" />
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
                                            className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                                            style={{ backgroundColor: content.buttonColor || '#000000' }}
                                        >
                                            {content.buttonText || 'Submit'}
                                        </button>
                                    </form>
                                </div>
                            );
                        }

                        if (type === 'payment') {
                            const [frequency, setFrequency] = useState('one-time');
                            const [amount, setAmount] = useState(content.defaultAmount || 50);

                            const handleDonate = () => {
                                // Check for payment gateway
                                const stripeConnected = localStorage.getItem('givelive_stripe_connected') === 'true';
                                const paypalConnected = localStorage.getItem('givelive_paypal_connected') === 'true';

                                if (!stripeConnected && !paypalConnected) {
                                    setFormState({ ...formState, amount, frequency });
                                    setShowMockCheckout(true);
                                    return;
                                }

                                onNext(`donate_${amount}_${frequency}`);
                            };

                            return (
                                <div key={id} className="p-6">
                                    {/* Frequency Toggle */}
                                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                                        {['one-time', 'monthly', 'yearly'].map(freq => (
                                            <button
                                                key={freq}
                                                onClick={() => setFrequency(freq)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition ${frequency === freq ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Amount Grid */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        {[10, 25, 50, 100, 250, 500].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setAmount(amt)}
                                                className={`py-3 rounded-xl border-2 font-bold transition ${amount === amt ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                            >
                                                ${amt}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleDonate}
                                        className="w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
                                        style={{ backgroundColor: content.buttonColor || '#000000' }}
                                    >
                                        {content.buttonText || 'Donate Now'}
                                    </button>

                                    <div className="mt-4 flex justify-center items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                                        <CreditCard size={12} /> Secure Payment
                                    </div>
                                </div>
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

    return <div>Unsupported node type</div>;
}
