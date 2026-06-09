import { useState } from 'react';
import Modal from './Modal';
import { API_URL } from '../api';

type Props = {
    isOpen: boolean;
    onClose: () => void;
};

export default function DemoRequestModal({ isOpen, onClose }: Props) {
    const [form, setForm] = useState({ name: '', email: '', organization: '' });
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch(`${API_URL}/request-demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                    setForm({ name: '', email: '', organization: '' });
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Demo request failed:', error);
            setStatus('error');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Request a Demo">
            {status === 'success' ? (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                    <p className="text-gray-600">We'll be in touch shortly to schedule your demo.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="input-field"
                            placeholder="Jane Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="input-field"
                            placeholder="jane@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                        <input
                            type="text"
                            value={form.organization}
                            onChange={(e) => setForm({ ...form, organization: e.target.value })}
                            className="input-field"
                            placeholder="Acme Non-Profit"
                        />
                    </div>

                    {status === 'error' && (
                        <div className="text-red-500 text-sm text-center">
                            Something went wrong. Please try again or email{' '}
                            <a href="mailto:hello@givelive.app" className="underline">hello@givelive.app</a>.
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                        >
                            {status === 'submitting' ? 'Sending...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
