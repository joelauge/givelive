import { useState } from 'react';
import { Sparkles, Wand2, Loader2, AlertCircle } from 'lucide-react';
import Modal from '../Modal';

interface AIBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
}

export default function AIBuilder({ isOpen, onClose, onGenerate }: AIBuilderProps) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        try {
            await onGenerate(prompt);
            onClose();
            setPrompt('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate journey. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const suggestions = [
        "A simple donation flow with a thank you SMS",
        "A conference check-in with a follow-up survey after 2 hours",
        "A multi-day welcome sequence for new church members",
        "A product feedback loop with a discount code for participants"
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Journey Builder"
            maxWidth="max-w-xl"
        >
            <div className="p-6 space-y-6">
                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-4 rounded-2xl border border-primary/20 flex gap-4 items-start">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Build with Magic</h3>
                        <p className="text-sm text-gray-600">Describe the journey you want to create, and our AI will build the nodes and edges for you.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Your Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. A fundraising flow that starts with a donation page, waits 1 day, and then sends a thank you email with a video link."
                            className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none text-gray-700 min-h-[120px] transition-all bg-gray-50/50 hover:bg-white focus:bg-white"
                            disabled={isGenerating}
                        />
                    </div>

                    {!isGenerating && (
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Try a suggestion</label>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(s)}
                                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full transition-colors text-gray-600 border border-transparent hover:border-primary/20"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={18} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                        disabled={isGenerating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Generating Magic...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 size={18} />
                                <span>Generate Journey</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
