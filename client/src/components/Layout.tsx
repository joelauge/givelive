import { Outlet, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import Logo from './Logo';
import { useState } from 'react';
import Modal from './Modal';

export default function Layout() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [demoForm, setDemoForm] = useState({ name: '', email: '', organization: '' });
    const [demoStatus, setDemoStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDemoStatus('submitting');

        try {
            const response = await fetch('http://localhost:3000/api/request-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoForm)
            });

            if (response.ok) {
                setDemoStatus('success');
                setTimeout(() => {
                    setIsDemoModalOpen(false);
                    setDemoStatus('idle');
                    setDemoForm({ name: '', email: '', organization: '' });
                }, 2000);
            } else {
                setDemoStatus('error');
            }
        } catch (error) {
            console.error('Demo request failed:', error);
            setDemoStatus('error');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans text-primary">
            {/* Header */}
            <header className="bg-surface border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo />
                    <div className="flex items-center gap-4">
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="px-5 py-2.5 rounded-full font-bold text-primary border-2 border-primary/10 hover:border-primary hover:bg-gray-50 transition">
                                    Log In
                                </button>
                            </SignInButton>
                            {isHomePage && (
                                <button
                                    onClick={() => setIsDemoModalOpen(true)}
                                    className="btn-secondary py-2.5 px-5 text-sm shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/30 hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Request A Demo
                                </button>
                            )}
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-surface border-t border-gray-100 py-8 mt-auto">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 opacity-80">
                        <Logo size="small" />
                        <span className="text-sm text-gray-400 ml-2">© 2024 GiveLive</span>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-primary transition">Privacy</a>
                        <a href="#" className="hover:text-primary transition">Terms</a>
                        <a href="#" className="hover:text-primary transition">Support</a>
                    </div>
                </div>
            </footer>

            {/* Demo Request Modal */}
            <Modal
                isOpen={isDemoModalOpen}
                onClose={() => setIsDemoModalOpen(false)}
                title="Request a Demo"
            >
                {demoStatus === 'success' ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h3>
                        <p className="text-gray-600">We'll be in touch shortly to schedule your demo.</p>
                    </div>
                ) : (
                    <form onSubmit={handleDemoSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={demoForm.name}
                                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                                className="input-field"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={demoForm.email}
                                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                                className="input-field"
                                placeholder="jane@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                            <input
                                type="text"
                                value={demoForm.organization}
                                onChange={(e) => setDemoForm({ ...demoForm, organization: e.target.value })}
                                className="input-field"
                                placeholder="Acme Non-Profit"
                            />
                        </div>

                        {demoStatus === 'error' && (
                            <div className="text-red-500 text-sm text-center">
                                Something went wrong. Please try again.
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={demoStatus === 'submitting'}
                                className="w-full btn-primary py-3 flex justify-center items-center gap-2"
                            >
                                {demoStatus === 'submitting' ? 'Sending...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
