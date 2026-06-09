import { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { API_URL } from '../api';

type Props = {
    /** Where the signup happened, for attribution (e.g. "home", "blog:simple-donation") */
    source: string;
    /** Visual style: dark for the homepage band, light for in-article cards */
    variant?: 'dark' | 'light';
    className?: string;
};

export default function NewsletterSignup({ source, variant = 'light', className = '' }: Props) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setStatus('submitting');

        try {
            const res = await fetch(`${API_URL}/marketing/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), source }),
            });
            if (!res.ok) throw new Error('subscribe failed');
            setStatus('success');
        } catch (err) {
            console.error('Newsletter signup failed:', err);
            setStatus('error');
        }
    };

    const isDark = variant === 'dark';

    if (status === 'success') {
        return (
            <div
                className={`flex items-center justify-center gap-3 rounded-2xl px-6 py-5 ${
                    isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-green-50 border border-green-100 text-green-800'
                } ${className}`}
            >
                <Check size={20} className={isDark ? 'text-accent-blue' : 'text-green-600'} />
                <p className="font-medium">You're in! Watch your inbox for QR marketing playbooks.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={className}>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Mail
                        size={18}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                    />
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={`w-full pl-11 pr-4 py-3.5 rounded-full text-base focus:outline-none focus:ring-2 transition ${
                            isDark
                                ? 'bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:ring-accent-blue/50'
                                : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-primary/20 focus:border-primary'
                        }`}
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className={`px-8 py-3.5 rounded-full font-bold transition disabled:opacity-60 ${
                        isDark
                            ? 'bg-white text-primary hover:bg-gray-100'
                            : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                >
                    {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
                </button>
            </div>
            {status === 'error' && (
                <p className={`mt-2 text-sm ${isDark ? 'text-red-300' : 'text-red-500'}`}>
                    Something went wrong — please try again.
                </p>
            )}
            <p className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Weekly QR marketing playbooks. No spam, unsubscribe anytime.
            </p>
        </form>
    );
}
