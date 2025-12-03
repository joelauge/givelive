

interface NodeRendererProps {
    node: any;
    onNext: (action?: string) => void;
}

export default function NodeRenderer({ node, onNext }: NodeRendererProps) {
    const { type, config } = node;

    if (type === 'page') {
        return (
            <div className="card overflow-hidden">
                {config.mediaUrl && (
                    <div className="aspect-video bg-gray-100 rounded-2xl mb-6 overflow-hidden">
                        {/* Placeholder for video/image */}
                        <img src={config.mediaUrl} alt="Content" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="">
                    <h2 className="text-3xl font-bold mb-3 text-primary">{config.title || 'Welcome'}</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">{config.content || 'Description goes here.'}</p>

                    <button
                        onClick={() => onNext('click')}
                        className="btn-primary w-full"
                    >
                        {config.buttonText || 'Continue'}
                    </button>
                </div>
            </div>
        );
    }

    if (type === 'donation') {
        return (
            <div className="card text-center">
                <div className="w-16 h-16 bg-accent-green/20 text-accent-green rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold">$</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Make a Donation</h2>
                <p className="mb-8 text-gray-500">Support our cause!</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {[10, 25, 50, 100].map(amount => (
                        <button
                            key={amount}
                            onClick={() => onNext(`donate_${amount}`)}
                            className="py-4 rounded-2xl border-2 border-gray-100 font-bold text-lg hover:border-secondary hover:bg-secondary/10 transition active:scale-95"
                        >
                            ${amount}
                        </button>
                    ))}
                </div>
                <div className="mt-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Secure payment via Stripe
                </div>
            </div>
        );
    }

    if (type === 'end') {
        return (
            <div className="card text-center py-12">
                <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                    <span className="text-3xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
                <p className="text-gray-500">Your journey is complete.</p>
            </div>
        );
    }

    return <div>Unsupported node type: {type}</div>;
}
