import { useState, useEffect } from 'react';
import { DollarSign, CreditCard } from 'lucide-react';

interface DonationEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

export default function DonationEditor({ data, onUpdate }: DonationEditorProps) {
    const [settings, setSettings] = useState({
        currency: data.currency || 'USD',
        amounts: data.amounts || [10, 25, 50, 100],
        stripeKey: data.stripeKey || '',
        paypalClientId: data.paypalClientId || '',
        testMode: data.testMode ?? true
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdate(settings);
        }, 500);
        return () => clearTimeout(timer);
    }, [settings]);

    const handleAmountChange = (index: number, value: string) => {
        const newAmounts = [...settings.amounts];
        newAmounts[index] = parseInt(value) || 0;
        setSettings({ ...settings, amounts: newAmounts });
    };

    return (
        <div className="p-6 space-y-8">
            {/* General Settings */}
            <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={18} /> Donation Settings
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <select
                            value={settings.currency}
                            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                            className="input-field"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="CAD">CAD ($)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Preset Amounts</label>
                        <div className="grid grid-cols-4 gap-2">
                            {settings.amounts.map((amount: number, i: number) => (
                                <input
                                    key={i}
                                    type="number"
                                    value={amount}
                                    onChange={(e) => handleAmountChange(i, e.target.value)}
                                    className="px-2 py-2 border border-gray-200 rounded-lg text-center focus:border-primary outline-none"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-px bg-gray-100"></div>

            {/* Payment Gateways */}
            <section>
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} /> Payment Gateways
                </h4>

                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-700">Test Mode</span>
                        <button
                            onClick={() => setSettings({ ...settings, testMode: !settings.testMode })}
                            className={`w-12 h-6 rounded-full transition-colors relative ${settings.testMode ? 'bg-orange-500' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.testMode ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-4 h-4 bg-[#635BFF] rounded-sm"></div>
                            <span className="font-bold text-gray-800">Stripe</span>
                        </div>
                        <input
                            type="text"
                            value={settings.stripeKey}
                            onChange={(e) => setSettings({ ...settings, stripeKey: e.target.value })}
                            placeholder={settings.testMode ? "pk_test_..." : "pk_live_..."}
                            className="input-field text-sm font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">Enter your Publishable Key</p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-4 h-4 bg-[#003087] rounded-sm"></div>
                            <span className="font-bold text-gray-800">PayPal</span>
                        </div>
                        <input
                            type="text"
                            value={settings.paypalClientId}
                            onChange={(e) => setSettings({ ...settings, paypalClientId: e.target.value })}
                            placeholder="Client ID"
                            className="input-field text-sm font-mono"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
