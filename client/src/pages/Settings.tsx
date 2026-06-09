import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Check, AlertCircle, ShoppingBag, MessageCircle, Instagram, Facebook, Video, Sparkles } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { API_URL, api } from '../api';
import { SHOW_SOCIAL_TRIGGERS } from '../config/features';
import { isPlatformStripeConfigured } from '../config/stripe';

const PLAN_LABELS: Record<string, string> = {
    free: 'Free',
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

export default function Settings() {
    const { user } = useUser();
    const [searchParams] = useSearchParams();
    const [billing, setBilling] = useState<{
        planId: string;
        aiFollowUpAddon: boolean;
        hasSubscription: boolean;
    } | null>(null);
    const [billingLoading, setBillingLoading] = useState(false);

    const [status, setStatus] = useState<any>({
        facebook: false,
        instagram: false,
        tiktok: false,
        whatsapp: false,
        shopify: false,
        stripe: isPlatformStripeConfigured,
        paypal: localStorage.getItem('givelive_paypal_connected') === 'true',
        metadata: {}
    });
    const [loading, setLoading] = useState(false);

    const [showSuccess, setShowSuccess] = useState<string | null>(null);
    const [igMissing, setIgMissing] = useState(false);

    // Meta Onboarding State
    const [showMetaModal, setShowMetaModal] = useState(false);
    const [metaPages, setMetaPages] = useState<any[]>([]);
    const [loadingPages, setLoadingPages] = useState(false);

    const fetchStatus = () => {
        fetch(`${API_URL}/integrations/status`)
            .then(res => res.json())
            .then(data => {
                setStatus((prev: any) => ({
                    ...prev,
                    ...data,
                    // keep local storage mocks for now to avoid breaking existing flow
                    stripe: isPlatformStripeConfigured,
                    paypal: prev.paypal
                }));
            })
            .catch(err => console.error('Failed to fetch integration status', err));
    };

    useEffect(() => {
        // Handle Meta Redirect Hash
        if (window.location.hash === '#_=_') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        // Handle Success Query Params
        const params = new URLSearchParams(window.location.search);
        const connected = params.get('connected');
        const metaOnboarding = params.get('meta_onboarding') === 'true';
        const isIgMissing = params.get('ig_missing') === 'true';
        const isDeletion = params.get('deletion_id');

        if (metaOnboarding && SHOW_SOCIAL_TRIGGERS) {
            setShowMetaModal(true);
            setLoadingPages(true);
            fetch(`${API_URL}/integrations/meta/pages`)
                .then(res => res.json())
                .then(data => {
                    if (data.pages) {
                        setMetaPages(data.pages);
                    }
                })
                .catch(err => console.error('Failed to fetch meta pages', err))
                .finally(() => setLoadingPages(false));

            // Clean up URL
            params.delete('meta_onboarding');
            const newSearch = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
        }

        if (connected === 'facebook') {
            setShowSuccess(isIgMissing ? 'Connected to Facebook, but no Instagram account found.' : 'Meta Integration successfully connected!');
            setIgMissing(isIgMissing);
            // Clean up URL
            params.delete('connected');
            params.delete('ig_missing');
            const newSearch = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));

            // Clear success message after delay
            setTimeout(() => setShowSuccess(null), 5000);

            // Re-fetch status immediately
            fetchStatus();
        }
        if (connected === 'tiktok') {
            setShowSuccess('TikTok Integration successfully connected!');
            params.delete('connected');
            const newSearch = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));
            setTimeout(() => setShowSuccess(null), 5000);
            fetchStatus();
        }

        if (isDeletion) {
            setShowSuccess(`Data deletion request received (ID: ${isDeletion}). We are processing your request and will notify you once complete.`);
            params.delete('deletion_id');
            const newSearch = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''));

            // Re-fetch status to show any immediate changes
            fetchStatus();
        }

        fetchStatus();
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        const billingResult = searchParams.get('billing');
        const sessionId = searchParams.get('session_id');

        const userEmail = user.primaryEmailAddress?.emailAddress;

        const loadBilling = async () => {
            const data = await api.getBillingStatus(user.id, userEmail);
            setBilling({
                planId: data.planId,
                aiFollowUpAddon: data.aiFollowUpAddon,
                hasSubscription: data.hasSubscription,
            });
        };

        const syncAfterCheckout = async () => {
            if (sessionId) {
                await api.confirmBillingCheckout(user.id, sessionId);
                return;
            }
            await api.syncBilling(user.id, userEmail);
            const status = await api.getBillingStatus(user.id, userEmail);
            if (status.planId === 'free') {
                await new Promise((resolve) => setTimeout(resolve, 1500));
                await api.syncBilling(user.id, userEmail);
            }
        };

        const run = async () => {
            if (billingResult === 'success') {
                setShowSuccess('Subscription updated successfully!');
                setTimeout(() => setShowSuccess(null), 6000);
                try {
                    await syncAfterCheckout();
                } catch (err) {
                    console.error('Post-checkout billing sync failed', err);
                    try {
                        await api.syncBilling(user.id, userEmail);
                    } catch (retryErr) {
                        console.error(retryErr);
                    }
                }
                await loadBilling();
                window.history.replaceState(null, '', '/settings');
                return;
            }
            await loadBilling();
        };

        run().catch(console.error);
    }, [user?.id, searchParams]);

    const handleManageBilling = async () => {
        if (!user?.id) return;
        setBillingLoading(true);
        try {
            const { url } = await api.createBillingPortal(user.id);
            window.location.href = url;
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Could not open billing portal');
        } finally {
            setBillingLoading(false);
        }
    };

    const handleConnectMeta = () => {
        window.location.href = `${API_URL}/auth/facebook`;
    };

    const handleConnectTikTok = () => {
        window.location.href = `${API_URL}/auth/tiktok`;
    };

    const handleConnectPayment = () => {
        setLoading(true);
        setTimeout(() => {
            localStorage.setItem('givelive_paypal_connected', 'true');
            setStatus((prev: any) => ({ ...prev, paypal: true }));
            setLoading(false);
        }, 1500);
    };

    const handleDisconnect = () => {
        if (window.confirm('Are you sure you want to disconnect PayPal? This will disable PayPal payments.')) {
            localStorage.removeItem('givelive_paypal_connected');
            setStatus((prev: any) => ({ ...prev, paypal: false }));
        }
    };

    const handleDisconnectIntegration = async (platform: string) => {
        if (window.confirm(`Are you sure you want to disconnect ${platform}?`)) {
            setLoading(true);
            try {
                await fetch(`${API_URL}/integrations/${platform}`, { method: 'DELETE' });
                fetchStatus();
                // Clear success message
                setShowSuccess(null);
            } catch (err) {
                console.error(err);
                alert(`Failed to disconnect ${platform}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSelectMetaPage = async (pageId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/integrations/meta/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageId })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setShowMetaModal(false);
                setShowSuccess('Meta accounts successfully connected!');
                fetchStatus();
                setTimeout(() => setShowSuccess(null), 5000);
            } else {
                alert(data.error || 'Failed to connect page. Wait a minute and try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Encountered an error while connecting the accounts.');
        } finally {
            setLoading(false);
        }
    };

    if (SHOW_SOCIAL_TRIGGERS && showMetaModal) {
        return (
            <div className="flex-1 w-full bg-[#f8f9fa] flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <Facebook size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 text-center">Select your Page</h2>
                        <p className="text-gray-500 text-center mt-2">Which Facebook Page do you want to automate with give.live?</p>
                    </div>

                    {loadingPages ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : metaPages.length > 0 ? (
                        <div className="space-y-3">
                            {metaPages.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => handleSelectMetaPage(page.id)}
                                    disabled={loading}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-green-50/30 transition-all text-left group"
                                >
                                    <div>
                                        <h3 className="font-bold text-gray-900">{page.name}</h3>
                                        {page.hasInstagram ? (
                                            <p className="text-sm text-green-600 flex items-center gap-1 mt-1 font-medium">
                                                <Instagram size={14} /> @{page.igUsername}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                                                No linked Instagram
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-gray-300 group-hover:text-primary transition-colors">
                                        <ArrowLeft className="rotate-180" size={20} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-red-50 rounded-xl text-red-800 border border-red-100 mb-6">
                            We couldn't find any Facebook Pages that you have admin access to.
                        </div>
                    )}

                    {metaPages.some(p => !p.hasInstagram) && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                            <div className="text-xs text-amber-900 leading-relaxed">
                                <p className="font-bold mb-1">Missing your Instagram account?</p>
                                <p>Meta requires Instagram accounts to be <strong>Professional</strong> (Business or Creator) and linked to your Facebook Page. If it still doesn't show up, click Cancel, reconnect, and click <strong>"Edit Settings"</strong> during the Meta popup to explicitly grant access to that specific Instagram account.</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setShowMetaModal(false)}
                        className="mt-6 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            {showSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-green-500">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Check size={20} />
                        </div>
                        <span className="font-bold">{showSuccess}</span>
                    </div>
                </div>
            )}
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center gap-4">
                    <Link to="/admin" className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition text-gray-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500">Manage your organization settings and integrations</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="text-accent-purple" />
                            Your GiveLive plan
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Platform subscription for campaigns, leads, and features.
                        </p>
                    </div>
                    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 capitalize">
                                {PLAN_LABELS[billing?.planId || 'free'] || billing?.planId || 'Free'}
                            </p>
                            {billing?.aiFollowUpAddon && (
                                <p className="text-sm text-accent-purple font-medium mt-1">
                                    + AI Follow-Up Assistant
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                {billing?.hasSubscription
                                    ? 'Manage payment method, invoices, or cancel in Stripe.'
                                    : 'Free plans show a “Made with GiveLive.app” badge on pages, texts, and emails. Upgrade to remove it and unlock more campaigns.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                to="/pricing"
                                className="px-4 py-2 rounded-lg border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                View plans
                            </Link>
                            {billing?.hasSubscription && (
                                <button
                                    onClick={handleManageBilling}
                                    disabled={billingLoading}
                                    className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition disabled:opacity-50"
                                >
                                    {billingLoading ? 'Opening…' : 'Manage billing'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="text-primary" />
                            Flow payments (Stripe)
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Donations on published flows are processed through the same GiveLive Stripe account as your
                            platform subscription. Configure keys once on the server; the publishable key enables checkout in the browser.
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Stripe */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#635BFF] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                    S
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Stripe (platform)</h3>
                                    <p className="text-xs text-gray-500">
                                        Flow donations → your GiveLive Stripe account
                                    </p>
                                </div>
                            </div>
                            <div>
                                {status.stripe ? (
                                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                        <Check size={14} /> Active
                                    </span>
                                ) : (
                                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg max-w-[200px] text-right leading-snug">
                                        Set VITE_STRIPE_PUBLISHABLE_KEY (client) and STRIPE_SECRET_KEY (server / Vercel)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* PayPal */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#003087] rounded-lg flex items-center justify-center text-white font-bold text-xl italic">
                                    P
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">PayPal</h3>
                                    <p className="text-xs text-gray-500">Accept PayPal and Venmo</p>
                                </div>
                            </div>
                            <div>
                                {status.paypal ? (
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                        <button
                                            onClick={() => handleDisconnect()}
                                            className="text-sm text-gray-400 hover:text-red-500 underline"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConnectPayment()}
                                        disabled={loading}
                                        className="px-4 py-2 bg-[#003087] text-white rounded-lg font-medium hover:bg-[#002569] transition shadow-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Connecting...' : 'Connect PayPal'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border-t border-blue-100 flex gap-3">
                        <AlertCircle className="text-blue-600 shrink-0" size={20} />
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Connecting a payment gateway is required to accept payments. You only need to do this once for your organization.
                        </p>
                    </div>
                </div>

                {/* Ecommerce Integrations */}
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="text-primary" />
                            Ecommerce Integrations
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Connect your online store to sync products and orders.</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#95BF47] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Shopify</h3>
                                    <p className="text-xs text-gray-500">Sync products and automate order updates</p>
                                </div>
                            </div>
                            {status.shopify ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                        {status.metadata?.shopify?.shop && (
                                            <span className="text-xs text-gray-500 mt-1">{status.metadata.shopify.shop}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDisconnectIntegration('shopify')}
                                        className="text-sm text-gray-400 hover:text-red-500 underline"
                                        disabled={loading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button className="px-4 py-2 bg-[#95BF47] text-white rounded-lg font-medium hover:bg-[#82a83d] transition shadow-sm">
                                    Connect Shopify
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {SHOW_SOCIAL_TRIGGERS && (
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageCircle className="text-primary" />
                            Social Media Integrations
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Connect your social accounts to automate interactions.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Instagram */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                                    <Instagram size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Instagram</h3>
                                    <p className="text-xs text-gray-500">Automate DM replies and comment tracking</p>
                                </div>
                            </div>
                            {status.instagram ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                        {status.metadata?.instagram?.ig_username && (
                                            <span className="text-xs text-gray-500 mt-1">@{status.metadata.instagram.ig_username}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDisconnectIntegration('instagram')}
                                        className="text-sm text-gray-400 hover:text-red-500 underline"
                                        disabled={loading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-end gap-1">
                                    <button
                                        onClick={handleConnectMeta}
                                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm whitespace-nowrap"
                                    >
                                        Connect via Meta
                                    </button>
                                    <span className="text-[10px] text-gray-400 max-w-[160px] text-right leading-tight">
                                        Requires linked Facebook Page
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Facebook */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#1877F2] rounded-lg flex items-center justify-center text-white">
                                    <Facebook size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Facebook</h3>
                                    <p className="text-xs text-gray-500">Manage Messenger and page comments</p>
                                </div>
                            </div>
                            {status.facebook ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                        {status.metadata?.facebook?.page_name && (
                                            <span className="text-xs text-gray-500 mt-1">{status.metadata.facebook.page_name}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDisconnectIntegration('facebook')}
                                        className="text-sm text-gray-400 hover:text-red-500 underline"
                                        disabled={loading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectMeta}
                                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                                >
                                    Connect
                                </button>
                            )}
                        </div>

                        {igMissing && (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                                <div className="text-sm text-amber-900">
                                    <p className="font-bold mb-1 text-amber-700">Instagram Account Not Found</p>
                                    <p className="mb-2">We connected to your Facebook Pages, but couldn't find a linked Instagram Professional account.</p>
                                    <ul className="list-disc ml-4 space-y-1 text-amber-800/80">
                                        <li>Ensure your Instagram is a <strong>Professional (Business or Creator)</strong> account.</li>
                                        <li>Standard personal accounts <strong>cannot</strong> be automated due to Meta API restrictions.</li>
                                        <li>Ensure your Instagram is <strong>linked</strong> to your Facebook Page in Page Settings.</li>
                                        <li>When connecting, click <strong>"Edit Previous Settings"</strong> and make sure the Instagram account is checked.</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* TikTok */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white">
                                    <Video size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-gray-900">TikTok</h3>
                                    <p className="text-xs text-gray-500">Automate replies for TikTok interactions</p>
                                </div>
                            </div>
                            {status.tiktok ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium flex items-center gap-2 border border-green-100 italic transition-all duration-300">
                                            <Check size={16} className="text-green-600" />
                                            <span>Connected</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDisconnectIntegration('tiktok')}
                                        className="text-sm text-gray-400 hover:text-red-500 underline"
                                        disabled={loading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectTikTok}
                                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                                >
                                    Connect
                                </button>
                            )}
                        </div>

                        {/* WhatsApp */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#25D366] rounded-lg flex items-center justify-center text-white">
                                    <MessageCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">WhatsApp</h3>
                                    <p className="text-xs text-gray-500">Send automated WhatsApp messages</p>
                                </div>
                            </div>
                            {status.whatsapp ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDisconnectIntegration('whatsapp')}
                                        className="text-sm text-gray-400 hover:text-red-500 underline"
                                        disabled={loading}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm">
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                )}

                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="text-primary" />
                            Email Configurations
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Configure your email provider for sending campaign emails.</p>
                    </div>

                    <EmailSettings />
                </div>
            </div>
        </div>
    );
}

function EmailSettings() {
    const [config, setConfig] = useState({
        provider: 'nodemailer',
        host: '',
        port: '587',
        user: '',
        pass: '',
        fromName: '',
        fromEmail: ''
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load settings on mount
    useEffect(() => {
        fetch(`${API_URL}/settings/email_config`)
            .then(res => res.json())
            .then(data => {
                if (data && Object.keys(data).length > 0) {
                    setConfig(data);
                }
            })
            .catch(console.error);
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await fetch(`${API_URL}/settings/email_config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error(e);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <select
                        value={config.provider}
                        onChange={e => setConfig({ ...config, provider: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    >
                        <option value="nodemailer">SMTP (NodeMailer)</option>
                        <option value="sendgrid" disabled>SendGrid (Coming Soon)</option>
                        <option value="mailgun" disabled>Mailgun (Coming Soon)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                    <input
                        value={config.host}
                        onChange={e => setConfig({ ...config, host: e.target.value })}
                        placeholder="smtp.example.com"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                    <input
                        value={config.port}
                        onChange={e => setConfig({ ...config, port: e.target.value })}
                        placeholder="587"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP User</label>
                    <input
                        value={config.user}
                        onChange={e => setConfig({ ...config, user: e.target.value })}
                        placeholder="user@example.com"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                    <input
                        type="password"
                        value={config.pass}
                        onChange={e => setConfig({ ...config, pass: e.target.value })}
                        placeholder="••••••••"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                    <input
                        value={config.fromName}
                        onChange={e => setConfig({ ...config, fromName: e.target.value })}
                        placeholder="My Organization"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                    <input
                        value={config.fromEmail}
                        onChange={e => setConfig({ ...config, fromEmail: e.target.value })}
                        placeholder="noreply@example.com"
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-black'}`}
                >
                    {saved ? <><Check size={16} /> Saved!</> : (loading ? 'Saving...' : 'Save Settings')}
                </button>
            </div>
        </div>
    );
}
