import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface DelayNodeEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export default function DelayNodeEditor({ data, onUpdate }: DelayNodeEditorProps) {
    const [amount, setAmount] = useState<number>(data.amount || 1);
    const [unit, setUnit] = useState<TimeUnit>(data.unit || 'days');

    useEffect(() => {
        const timer = setTimeout(() => {
            let label = `Wait ${amount} ${unit}`;
            if (amount === 1) {
                label = `Wait ${amount} ${unit.slice(0, -1)}`; // Remove 's' for singular
            }

            onUpdate({
                amount,
                unit,
                label // Update the node label on the graph
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [amount, unit]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/10 pb-2">
                <Clock size={18} />
                <h3>Delay Configuration</h3>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wait For</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        min="1"
                        max={unit === 'months' ? 12 : 365}
                        value={amount}
                        onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as TimeUnit)}
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                    >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                    </select>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                <div className="text-blue-500 mt-0.5">
                    <Calendar size={16} />
                </div>
                <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How this works</p>
                    <p className="opacity-90">
                        The flow will pause here for <strong>{amount} {unit}</strong> before continuing to the next step.
                    </p>
                </div>
            </div>
        </div>
    );
}
