import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Smartphone } from 'lucide-react';

interface MessageNodeEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

type MessageType = 'sms' | 'email' | 'both';

export default function MessageNodeEditor({ data, onUpdate }: MessageNodeEditorProps) {
    const [messageType, setMessageType] = useState<MessageType>(data.messageType || 'sms');
    const [smsMessage, setSmsMessage] = useState(data.smsMessage || '');
    const [emailSubject, setEmailSubject] = useState(data.emailSubject || '');
    const [emailBody, setEmailBody] = useState(data.emailBody || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdate({
                messageType,
                smsMessage,
                emailSubject,
                emailBody
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [messageType, smsMessage, emailSubject, emailBody]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Message Type</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setMessageType('sms')}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${messageType === 'sms' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Smartphone size={16} /> SMS
                    </button>
                    <button
                        onClick={() => setMessageType('email')}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${messageType === 'email' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Mail size={16} /> Email
                    </button>
                    <button
                        onClick={() => setMessageType('both')}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 ${messageType === 'both' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Both
                    </button>
                </div>
            </div>

            {(messageType === 'sms' || messageType === 'both') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/10 pb-2">
                        <Smartphone size={18} />
                        <h3>SMS Configuration</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Content</label>
                        <div className="relative">
                            <textarea
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                placeholder="Type your SMS message here..."
                                maxLength={160}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {smsMessage.length}/160
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Standard SMS rates apply. Messages over 160 characters will be split.
                        </p>
                    </div>
                </div>
            )}

            {(messageType === 'email' || messageType === 'both') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/10 pb-2">
                        <Mail size={18} />
                        <h3>Email Configuration</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                        <input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Welcome to our community!"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
                        <textarea
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            rows={8}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                            placeholder="Type your email content here..."
                        />
                    </div>
                </div>
            )}

            {/* Preview Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Preview</div>

                {(messageType === 'sms' || messageType === 'both') && (
                    <div className="flex gap-3 mb-4 last:mb-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <MessageSquare size={16} />
                        </div>
                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-700 max-w-[80%] border border-gray-100">
                            {smsMessage || <span className="text-gray-300 italic">SMS message preview...</span>}
                        </div>
                    </div>
                )}

                {(messageType === 'email' || messageType === 'both') && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="border-b border-gray-100 pb-2 mb-2">
                            <div className="text-xs text-gray-500">Subject: <span className="text-gray-900 font-medium">{emailSubject || '...'}</span></div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {emailBody || <span className="text-gray-300 italic">Email body preview...</span>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
