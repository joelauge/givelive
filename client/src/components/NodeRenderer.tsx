

interface NodeRendererProps {
    node: any;
    onNext: (action?: string) => void;
}

export default function NodeRenderer({ node, onNext }: NodeRendererProps) {
    const { type, config } = node;

    if (type === 'page') {
        return (
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                {config.mediaUrl && (
                    <div className="aspect-video bg-gray-200">
                        {/* Placeholder for video/image */}
                        <img src={config.mediaUrl} alt="Content" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-2">{config.title || 'Welcome'}</h2>
                    <p className="text-gray-600 mb-6">{config.content || 'Description goes here.'}</p>

                    <button
                        onClick={() => onNext('click')}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        {config.buttonText || 'Continue'}
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'donation') {
        return (
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
                <p className="mb-6">Support our cause!</p>
                <div className="space-y-3">
                    {[10, 25, 50, 100].map(amount => (
                        <button
                            key={amount}
                            onClick={() => onNext(`donate_${amount}`)}
                            className="block w-full border-2 border-blue-600 text-blue-600 py-2 rounded-lg font-semibold hover:bg-blue-50 transition active:scale-95"
                        >
                            Donate ${amount}
                        </button>
                    ))}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                    Secure payment via Stripe
                </div>
            </div>
        );
    }

    if (type === 'end') {
        return (
            <div className="text-center p-8">
                <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
                <p>Your journey is complete.</p>
            </div>
        );
    }

    return <div>Unsupported node type: {type}</div>;
}
