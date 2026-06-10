import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Inbox,
    Mail,
    MailOpen,
    Paperclip,
    RefreshCw,
    Reply,
    Send,
    ShieldOff,
    Trash2,
} from 'lucide-react';
import { api } from '../api';

interface MailListItem {
    id: string;
    from_address: string;
    subject: string | null;
    is_read: boolean;
    received_at: string | null;
    created_at: string;
    snippet: string;
    attachments: { filename?: string }[];
}

interface MailDetail extends MailListItem {
    text_body: string | null;
    html_body: string | null;
    to_addresses: string[];
}

function formatTime(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    return sameDay
        ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MailInbox() {
    const [messages, setMessages] = useState<MailListItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selected, setSelected] = useState<MailDetail | null>(null);
    const [replies, setReplies] = useState<MailDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [replyStatus, setReplyStatus] = useState<'idle' | 'sent' | 'error'>('idle');

    const loadInbox = useCallback(async () => {
        try {
            setError(null);
            const data = await api.getMailMessages();
            setMessages(data.messages || []);
            setUnreadCount(data.unreadCount || 0);
            setForbidden(false);
        } catch (err: any) {
            if (err?.message === 'Forbidden') {
                setForbidden(true);
            } else {
                setError('Could not load the inbox. Try refreshing.');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInbox();
        const interval = setInterval(loadInbox, 60_000);
        return () => clearInterval(interval);
    }, [loadInbox]);

    const openMessage = async (id: string) => {
        setReplyText('');
        setReplyStatus('idle');
        try {
            const data = await api.getMailMessage(id);
            setSelected(data.message);
            setReplies(data.replies || []);
            setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
            setUnreadCount((prev) => Math.max(0, prev - (messages.find((m) => m.id === id)?.is_read ? 0 : 1)));
        } catch {
            setError('Could not open that message.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this message permanently?')) return;
        try {
            await api.deleteMailMessage(id);
            setMessages((prev) => prev.filter((m) => m.id !== id));
            if (selected?.id === id) {
                setSelected(null);
                setReplies([]);
            }
        } catch {
            setError('Could not delete that message.');
        }
    };

    const handleReply = async () => {
        if (!selected || !replyText.trim()) return;
        setSending(true);
        setReplyStatus('idle');
        try {
            const result = await api.replyToMailMessage(selected.id, replyText.trim());
            setReplies((prev) => [...prev, result.reply]);
            setReplyText('');
            setReplyStatus('sent');
        } catch {
            setReplyStatus('error');
        } finally {
            setSending(false);
        }
    };

    if (forbidden) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md text-center">
                    <ShieldOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Not authorized</h1>
                    <p className="text-gray-500 mb-6">This inbox is only available to platform operators.</p>
                    <Link to="/admin" className="text-primary font-semibold hover:underline">
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center gap-4 shrink-0">
                <Link
                    to="/admin"
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Inbox size={20} className="text-primary" />
                    <h1 className="font-bold text-gray-900">Mail</h1>
                    {unreadCount > 0 && (
                        <span className="bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <span className="hidden md:inline text-sm text-gray-400">hello@givelive.app</span>
                <button
                    type="button"
                    onClick={() => { setLoading(true); loadInbox(); }}
                    className="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    <span className="hidden sm:inline">Refresh</span>
                </button>
            </header>

            {error && (
                <div className="bg-red-50 border-b border-red-100 text-red-600 text-sm px-6 py-2">{error}</div>
            )}

            <div className="flex flex-1 min-h-0">
                {/* Message list */}
                <aside
                    className={`w-full md:w-96 md:shrink-0 border-r border-gray-100 bg-white overflow-y-auto ${selected ? 'hidden md:block' : ''}`}
                >
                    {loading && messages.length === 0 ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">No messages yet</p>
                            <p className="text-gray-400 text-sm mt-1">
                                Email sent to hello@givelive.app will appear here.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <button
                                key={msg.id}
                                type="button"
                                onClick={() => openMessage(msg.id)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition flex flex-col gap-0.5 ${selected?.id === msg.id ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    {!msg.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>}
                                    <span className={`truncate text-sm ${msg.is_read ? 'text-gray-600' : 'font-bold text-gray-900'}`}>
                                        {msg.from_address}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400 shrink-0">
                                        {formatTime(msg.received_at || msg.created_at)}
                                    </span>
                                </div>
                                <div className={`truncate text-sm ${msg.is_read ? 'text-gray-500' : 'font-semibold text-gray-800'}`}>
                                    {msg.subject || '(no subject)'}
                                </div>
                                <div className="truncate text-xs text-gray-400 flex items-center gap-1">
                                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                        <Paperclip size={12} className="shrink-0" />
                                    )}
                                    {msg.snippet}
                                </div>
                            </button>
                        ))
                    )}
                </aside>

                {/* Reading pane */}
                <main className={`flex-1 min-w-0 flex-col bg-gray-50 ${selected ? 'flex' : 'hidden md:flex'}`}>
                    {!selected ? (
                        <div className="flex-1 flex items-center justify-center text-gray-300">
                            <div className="text-center">
                                <MailOpen className="w-12 h-12 mx-auto mb-3" />
                                <p className="text-sm">Select a message to read it</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-start gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    className="md:hidden text-gray-400 hover:text-primary transition mt-1"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-bold text-gray-900 truncate">{selected.subject || '(no subject)'}</h2>
                                    <p className="text-sm text-gray-500 truncate">
                                        {selected.from_address}
                                        <span className="text-gray-300 mx-1">·</span>
                                        {new Date(selected.received_at || selected.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(selected.id)}
                                    className="text-gray-300 hover:text-red-500 transition shrink-0"
                                    title="Delete message"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {selected.html_body ? (
                                        <iframe
                                            title="Email content"
                                            sandbox=""
                                            srcDoc={selected.html_body}
                                            className="w-full min-h-[420px] bg-white"
                                        />
                                    ) : (
                                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 p-6">
                                            {selected.text_body || '(empty message)'}
                                        </pre>
                                    )}
                                </div>

                                {replies.map((r) => (
                                    <div key={r.id} className="bg-primary/5 border border-primary/10 rounded-2xl p-4 ml-6">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <Reply size={12} />
                                            You replied · {new Date(r.created_at).toLocaleString()}
                                        </div>
                                        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{r.text_body}</pre>
                                    </div>
                                ))}
                            </div>

                            {/* Reply box */}
                            <div className="bg-white border-t border-gray-100 p-4 md:px-6 shrink-0">
                                {replyStatus === 'sent' && (
                                    <p className="text-sm text-green-600 mb-2 font-medium">Reply sent.</p>
                                )}
                                {replyStatus === 'error' && (
                                    <p className="text-sm text-red-500 mb-2 font-medium">Failed to send — try again.</p>
                                )}
                                <div className="flex items-end gap-3">
                                    <textarea
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={`Reply to ${selected.from_address}…`}
                                        rows={3}
                                        className="flex-1 p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition text-sm resize-y"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleReply}
                                        disabled={sending || !replyText.trim()}
                                        className="h-11 px-5 rounded-xl bg-primary text-white font-bold text-sm flex items-center gap-2 hover:bg-primary-light transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    >
                                        <Send size={15} />
                                        {sending ? 'Sending…' : 'Send'}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Sends as hello@givelive.app via Resend.</p>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
