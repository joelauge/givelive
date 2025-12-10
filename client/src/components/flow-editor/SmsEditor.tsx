import { useState, useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

interface SmsEditorProps {
    data: { message?: string;[key: string]: any };
    onUpdate: (data: any) => void;
}

export default function SmsEditor({ data, onUpdate }: SmsEditorProps) {
    const [message, setMessage] = useState(data.message || '');

    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdateRef.current({ message });
        }, 500);
        return () => clearTimeout(timer);
    }, [message]);

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
