import { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

interface SmsEditorProps {
    data: { message?: string;[key: string]: any };
    onUpdate: (data: any) => void;
}

export default function SmsEditor({ data, onUpdate }: SmsEditorProps) {
    const [message, setMessage] = useState(data.message || '');
    const [isEndNode, setIsEndNode] = useState<boolean>(data.isEndNode || false);

    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdateRef.current({ message, isEndNode });
        }, 500);
        return () => clearTimeout(timer);
    }, [message, isEndNode]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SMS Message</label>
                <div className="relative">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                        placeholder="Type your message here..."
                        maxLength={160}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {message.length}/160
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Standard SMS rates apply. Messages over 160 characters will be split.
                </p>
            </div>
            {/* End Journey Toggle */}
            <div className="mb-4 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 transition">
                <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition">End Journey Here</div>
                        <p className="text-xs text-gray-500 mt-0.5">Mark this message as the final step in the user journey</p>
                    </div>
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={isEndNode}
                            onChange={(e) => setIsEndNode(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                </label>
                {isEndNode && (
                    <div className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 -mx-3 -mb-3 px-3 py-2 rounded-b-xl">
                        <span className="text-base">✓</span>
                        <span className="font-medium">This message will end the journey - no next steps needed</span>
                    </div>
                )}
            </div>

            {/* Preview */}
            <div className="bg-gray-100 p-4 rounded-xl">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Preview</div>
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <MessageSquare size={16} />
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%]">
                        {message || <span className="text-gray-300 italic">Your message will appear here...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
