import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, CreditCard, Lock } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutFormProps {
    amount: number;
    frequency: string;
    eventId: string;
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

function CheckoutForm({ amount, frequency, onSuccess, onCancel }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment/success`,
                },
                redirect: 'if_required'
            });

            if (error) {
                setErrorMessage(error.message || 'An error occurred');
                setIsProcessing(false);
            } else {
                // Payment succeeded
                onSuccess();
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Payment failed');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-900 text-sm font-medium mb-2">
                    <Lock size={16} />
                    <span>Secure Payment</span>
                </div>
                <div className="text-3xl font-black text-blue-900">
                    ${amount.toFixed(2)}
                    {frequency !== 'once' && frequency !== 'one-time' && (
                        <span className="text-lg font-medium text-blue-700 ml-2">
                            / {frequency}
                        </span>
                    )}
                </div>
            </div>

            <PaymentElement />

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition"
                    disabled={isProcessing}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 py-3 rounded-xl bg-primary font-bold text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-primary/20"
                >
                    {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                </button>
            </div>

            <div className="text-center text-xs text-gray-500">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <CreditCard size={14} />
                    <span>Powered by Stripe</span>
                </div>
                <p>Your payment information is encrypted and secure</p>
            </div>
        </form>
    );
}

interface StripeCheckoutModalProps {
    isOpen: boolean;
    amount: number;
    frequency: string;
    eventId: string;
    userId: string;
    donorInfo?: {
        email?: string;
        name?: string;
        phone?: string;
    };
    onSuccess: () => void;
    onClose: () => void;
}

export default function StripeCheckoutModal({
    isOpen,
    amount,
    frequency,
    eventId,
    userId,
    donorInfo,
    onSuccess,
    onClose
}: StripeCheckoutModalProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            createPaymentIntent();
        }
    }, [isOpen, amount, frequency]);

    const createPaymentIntent = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/donations/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: eventId,
                    user_id: userId,
                    amount,
                    recurring: frequency !== 'once' && frequency !== 'one-time',
                    frequency,
                    donorInfo
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            const data = await response.json();
            setClientSecret(data.clientSecret);
            setIsTestMode(data.isTestMode || false);
        } catch (err: any) {
            setError(err.message || 'Failed to initialize payment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccess = () => {
        // Show success message
        alert('Payment successful! Thank you for your donation.');
        onSuccess();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <CreditCard size={24} className="text-primary" />
                        <h2 className="text-xl font-bold text-gray-900">Secure Checkout</h2>
                    </div>
                    {isTestMode && (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                            TEST MODE
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="py-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Setting up secure payment...</p>
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <p className="text-red-700 font-medium">{error}</p>
                        </div>
                        <button
                            onClick={createPaymentIntent}
                            className="btn-primary"
                        >
                            Try Again
                        </button>
                    </div>
                ) : isTestMode ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                            <h3 className="font-bold text-blue-900 mb-2">Demo Donation</h3>
                            <p className="text-sm text-blue-700 mb-4">
                                This is a mock checkout because no payment gateway is connected.
                            </p>
                            <div className="text-3xl font-black text-blue-900 mb-4">
                                ${amount.toFixed(2)}
                            </div>
                            <button
                                onClick={handleSuccess}
                                className="w-full py-3 rounded-xl bg-primary font-bold text-white hover:bg-primary-dark transition"
                            >
                                Complete Demo Donation
                            </button>
                        </div>
                    </div>
                ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CheckoutForm
                            amount={amount}
                            frequency={frequency}
                            eventId={eventId}
                            userId={userId}
                            onSuccess={handleSuccess}
                            onCancel={onClose}
                        />
                    </Elements>
                ) : null}
            </div>
        </div>
    );
}
