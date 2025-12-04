import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
    const [stripeConnected, setStripeConnected] = useState(false);
    const [paypalConnected, setPaypalConnected] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedStripe = localStorage.getItem('givelive_stripe_connected');
        const savedPaypal = localStorage.getItem('givelive_paypal_connected');
        if (savedStripe === 'true') setStripeConnected(true);
        if (savedPaypal === 'true') setPaypalConnected(true);
    }, []);

    const handleConnect = (gateway: 'stripe' | 'paypal') => {
        setLoading(true);
        // Mock API call
        setTimeout(() => {
            if (gateway === 'stripe') {
                setStripeConnected(true);
                localStorage.setItem('givelive_stripe_connected', 'true');
            } else {
                setPaypalConnected(true);
                localStorage.setItem('givelive_paypal_connected', 'true');
            }
            setLoading(false);
        }, 1500);
    };

    const handleDisconnect = (gateway: 'stripe' | 'paypal') => {
        if (window.confirm(`Are you sure you want to disconnect ${gateway === 'stripe' ? 'Stripe' : 'PayPal'}? This will disable donations.`)) {
            if (gateway === 'stripe') {
                setStripeConnected(false);
                localStorage.removeItem('givelive_stripe_connected');
            } else {
                setPaypalConnected(false);
                localStorage.removeItem('givelive_paypal_connected');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="text-primary" />
                            Payment Gateways
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Connect your payment providers to accept donations.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Stripe */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#635BFF] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                    S
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Stripe</h3>
                                    <p className="text-xs text-gray-500">Accept credit cards and Apple Pay</p>
                                </div>
                            </div>
                            <div>
                                {stripeConnected ? (
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                        <button
                                            onClick={() => handleDisconnect('stripe')}
                                            className="text-sm text-gray-400 hover:text-red-500 underline"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConnect('stripe')}
                                        disabled={loading}
                                        className="px-4 py-2 bg-[#635BFF] text-white rounded-lg font-medium hover:bg-[#544DCB] transition shadow-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Connecting...' : 'Connect Stripe'}
                                    </button>
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
                                {paypalConnected ? (
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                            <Check size={14} /> Connected
                                        </span>
                                        <button
                                            onClick={() => handleDisconnect('paypal')}
                                            className="text-sm text-gray-400 hover:text-red-500 underline"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConnect('paypal')}
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
                            <strong>Note:</strong> Connecting a payment gateway is required to accept donations. You only need to do this once for your organization.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
