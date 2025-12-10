import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Mail, Smartphone, Link as LinkIcon, Plus, AlertTriangle, LayoutTemplate, Globe, X, GitBranch, Trash2 } from 'lucide-react';

interface MessageNodeEditorProps {
    data: any;
    nodeId: string;
    nodes?: any[];
    edges?: any[];
    onUpdate: (data: any) => void;
}

type MessageType = 'sms' | 'email' | 'both';

export default function MessageNodeEditor({ data, nodeId, nodes = [], edges = [], onUpdate }: MessageNodeEditorProps) {
    const [messageType, setMessageType] = useState<MessageType>(data.messageType || 'sms');

    // Support multi-message sequence. Fallback to single smsMessage for backward compat.
    const [smsMessages, setSmsMessages] = useState<string[]>(data.smsMessages || (data.smsMessage ? [data.smsMessage] : ['']));
    const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);

    const [emailSubject, setEmailSubject] = useState(data.emailSubject || '');
    const [emailBody, setEmailBody] = useState(data.emailBody || '');

    const [linkType, setLinkType] = useState<'internal' | 'external'>('internal');
    const [selectedPageId, setSelectedPageId] = useState('');
    const [externalUrl, setExternalUrl] = useState('');

    // Expected Responses for Logic
    const [expectedResponses, setExpectedResponses] = useState<{ trigger: string, value: string }[]>(data.expectedResponses || []);
    const [newTrigger, setNewTrigger] = useState('');
    const [newValue, setNewValue] = useState('');

    const [showAddMenu, setShowAddMenu] = useState(false);

    // Determine available contact methods from the source node
    const sourceValidation = useMemo(() => {
        // Find the edge connected to this node
        const incomingEdge = edges.find(e => e.target === nodeId);
        if (!incomingEdge) return { hasPhone: true, hasEmail: true }; // Assume available if no connection (or independent)

        const sourceNode = nodes.find(n => n.id === incomingEdge.source);
        if (!sourceNode || sourceNode.data.type !== 'page') return { hasPhone: true, hasEmail: true };

        const formSection = sourceNode.data.sections?.find((s: any) => s.type === 'form');
        if (!formSection) return { hasPhone: false, hasEmail: false }; // No form means no contact info collected?

        const fields = formSection.content?.fields || [];
        return {
            hasPhone: fields.includes('phone'),
            hasEmail: fields.includes('email')
        };
    }, [nodes, edges, nodeId]);

    const warnings = useMemo(() => {
        const warns: string[] = [];
        if ((messageType === 'sms' || messageType === 'both') && !sourceValidation.hasPhone) {
            warns.push("The connected form does not collect a phone number.");
        }
        if ((messageType === 'email' || messageType === 'both') && !sourceValidation.hasEmail) {
            warns.push("The connected form does not collect an email address.");
        }
        return warns;
    }, [messageType, sourceValidation]);

    const addMessage = (type: 'text' | 'page' | 'url') => {
        let content = '';
        if (type === 'page') {
            // We'll just add an empty message that the user can pick a page for, or 
            // since we need to pick the page FIRST, maybe we just add a placeholder or scroll to the link tool?
            // The user wants to "select to send... a link". 
            // Let's add an empty message and focus it, then the user can use the "Insert Smart Link" tool below.
            // OR even better, we could open a mini picker here. 
            // For MVP: Add empty message, select it.
            content = '';
        } else if (type === 'url') {
            content = '';
        }

        const newMessages = [...smsMessages, content];
        setSmsMessages(newMessages);
        setSelectedMessageIndex(newMessages.length - 1);
        setShowAddMenu(false);
    };

    const updateCurrentMessage = (text: string) => {
        const newMessages = [...smsMessages];
        newMessages[selectedMessageIndex] = text;
        setSmsMessages(newMessages);
    };

    const deleteMessage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (smsMessages.length <= 1) {
            setSmsMessages(['']); // Reset to empty if last one
            return;
        }
        const newMessages = smsMessages.filter((_, i) => i !== index);
        setSmsMessages(newMessages);
        if (selectedMessageIndex >= index && selectedMessageIndex > 0) {
            setSelectedMessageIndex(selectedMessageIndex - 1);
        }
    };

    const insertLink = () => {
        let linkToInsert = '';

        if (linkType === 'internal') {
            const page = nodes.find(n => n.id === selectedPageId);
            if (page) {
                // In a real app, this would be a shortlink ID or placeholder
                // For now, we simulate a tracked link structure
                linkToInsert = ` {{Link:${page.data.label.replace(/\s+/g, '')}?src=sms&flow=current}} `;
            }
        } else {
            if (externalUrl) {
                const separator = externalUrl.includes('?') ? '&' : '?';
                linkToInsert = ` ${externalUrl}${separator}utm_source=givelive&utm_medium=sms `;
            }
        }

        if (linkToInsert) {
            if (messageType === 'sms' || messageType === 'both') {
                // Append to CURRENT SMS message
                const currentText = smsMessages[selectedMessageIndex] || '';
                updateCurrentMessage(currentText + linkToInsert);
            }
            if (messageType === 'email' || messageType === 'both') {
                setEmailBody((prev: string) => prev + linkToInsert);
            }

            // Reset fields
            setSelectedPageId('');
            setExternalUrl('');
        }
    };

    const addResponse = () => {
        if (newTrigger && newValue) {
            setExpectedResponses([...expectedResponses, { trigger: newTrigger, value: newValue }]);
            setNewTrigger('');
            setNewValue('');
        }
    };

    const removeResponse = (index: number) => {
        setExpectedResponses(expectedResponses.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onUpdate({
                messageType,
                smsMessages,
                smsMessage: smsMessages[0], // Maintain simple backward compat for simple viewers
                emailSubject,
                emailBody,
                expectedResponses // Data for logic trees
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [messageType, smsMessages, emailSubject, emailBody, expectedResponses]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Message Type</label>
                <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
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

                {warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            {warnings.map((w, i) => <div key={i}>{w}</div>)}
                        </div>
                    </div>
                )}
            </div>

            {(messageType === 'sms' || messageType === 'both') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/10 pb-2">
                        <Smartphone size={18} />
                        <h3>SMS Configuration</h3>
                    </div>

                    {/* Available Fields for Personalization */}
                    {sourceValidation.hasPhone || sourceValidation.hasEmail ? (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-xl border border-blue-100">
                            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Available Fields</div>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const incomingEdge = edges.find(e => e.target === nodeId);
                                    const sourceNode = incomingEdge ? nodes.find(n => n.id === incomingEdge.source) : null;
                                    const formSection = sourceNode?.data?.sections?.find((s: any) => s.type === 'form');
                                    const fields = formSection?.content?.fields || [];

                                    return fields.map((field: string) => (
                                        <button
                                            key={field}
                                            onClick={() => {
                                                const tag = `{{${field}}}`;
                                                const currentText = smsMessages[selectedMessageIndex] || '';
                                                updateCurrentMessage(currentText + tag);
                                            }}
                                            className="px-3 py-1.5 bg-white border-2 border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                                            title={`Click to insert {{${field}}}`}
                                        >
                                            <span className="text-xs">+</span>
                                            <span className="capitalize">{field}</span>
                                        </button>
                                    ));
                                })()}
                            </div>
                            <p className="text-[10px] text-blue-600/70 mt-2">Click a tag to insert it into your message. It will be replaced with actual user data when sent.</p>
                        </div>
                    ) : null}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">Message {selectedMessageIndex + 1} of {smsMessages.length}</label>
                            <div className="flex gap-1">
                                {smsMessages.map((_, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedMessageIndex(i)}
                                        className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === selectedMessageIndex ? 'bg-primary' : 'bg-gray-200 hover:bg-gray-300'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <textarea
                                value={smsMessages[selectedMessageIndex]}
                                onChange={(e) => updateCurrentMessage(e.target.value)}
                                rows={4}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                placeholder={`Type message ${selectedMessageIndex + 1} here...`}
                                maxLength={160}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                {smsMessages[selectedMessageIndex]?.length || 0}/160
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
                    <div className="space-y-2 mb-4">
                        {smsMessages.map((msg, index) => {
                            // Replace tags with sample data for preview
                            const previewText = msg
                                .replace(/\{\{name\}\}/g, 'John')
                                .replace(/\{\{phone\}\}/g, '(555) 123-4567')
                                .replace(/\{\{email\}\}/g, 'john@example.com')
                                .replace(/\{\{amount\}\}/g, '$50');

                            return (
                                <div key={index} className="flex gap-3 relative group" onClick={() => setSelectedMessageIndex(index)}>
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div
                                        className={`p-3 rounded-2xl rounded-tl-none shadow-sm text-sm max-w-[80%] border cursor-pointer transition-all 
                                            ${index === selectedMessageIndex ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-gray-100 ring-0 hover:border-blue-100'}
                                        `}
                                    >
                                        {previewText || <span className="text-gray-300 italic">Empty message...</span>}
                                    </div>

                                    {/* Delete Button for Preview Items */}
                                    {smsMessages.length > 1 && (
                                        <button
                                            onClick={(e) => deleteMessage(index, e)}
                                            className="absolute -right-2 -top-2 p-1 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Message Button */}
                        <div className="relative ml-11">
                            <button
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all shadow-sm border border-blue-100"
                                title="Add another message"
                            >
                                <Plus size={16} />
                            </button>

                            {/* Add Menu */}
                            {showAddMenu && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 min-w-[160px] z-50 flex flex-col gap-1 animate-in fade-in zoom-in duration-200">
                                    <button
                                        onClick={() => addMessage('text')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                                    >
                                        <MessageSquare size={14} className="text-blue-500" />
                                        <span>Text Message</span>
                                    </button>
                                    <button
                                        onClick={() => addMessage('page')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                                    >
                                        <LayoutTemplate size={14} className="text-purple-500" />
                                        <span>Page Link</span>
                                    </button>
                                    <button
                                        onClick={() => addMessage('url')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                                    >
                                        <Globe size={14} className="text-green-500" />
                                        <span>External URL</span>
                                    </button>
                                </div>
                            )}
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
            {/* Smart Link Insertion */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-3">
                    <LinkIcon size={16} />
                    <h3>Insert Smart Link</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex bg-white p-1 rounded-lg border border-blue-100">
                        <button
                            onClick={() => setLinkType('internal')}
                            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition ${linkType === 'internal' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Flow Page
                        </button>
                        <button
                            onClick={() => setLinkType('external')}
                            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition ${linkType === 'external' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            External URL
                        </button>
                    </div>

                    {linkType === 'internal' ? (
                        <select
                            value={selectedPageId}
                            onChange={(e) => setSelectedPageId(e.target.value)}
                            className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                        >
                            <option value="">Select a page...</option>
                            {nodes.filter(n => n.data.type === 'page').map(node => (
                                <option key={node.id} value={node.id}>
                                    {node.data.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="url"
                            value={externalUrl}
                            onChange={(e) => setExternalUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    )}

                    <button
                        onClick={insertLink}
                        disabled={linkType === 'internal' ? !selectedPageId : !externalUrl}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Plus size={14} />
                        Insert Link
                    </button>
                    <p className="text-[10px] text-blue-600/70 text-center">
                        Links are automatically tracked for clicks and conversions.
                    </p>
                </div>
            </div>

            {/* Response Handling Section */}
            {(messageType === 'sms' || messageType === 'both') && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 text-purple-700 font-medium mb-3">
                        <GitBranch size={16} />
                        <h3>Expected Responses</h3>
                    </div>

                    <p className="text-xs text-purple-600/80 mb-4">
                        Define expected replies (like &quot;1&quot; or &quot;Yes&quot;) to store data for future logic steps.
                    </p>

                    <div className="space-y-3">
                        {/* List of defined responses */}
                        {expectedResponses.map((resp, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-purple-100 shadow-sm">
                                <div className="flex-1 text-sm">
                                    <span className="text-gray-500 text-xs uppercase font-bold mr-2">If User Types:</span>
                                    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">{resp.trigger}</span>
                                </div>
                                <div className="text-gray-400">→</div>
                                <div className="flex-1 text-sm">
                                    <span className="text-gray-500 text-xs uppercase font-bold mr-2">Store As:</span>
                                    <span className="font-medium text-purple-700">{resp.value}</span>
                                </div>
                                <button
                                    onClick={() => removeResponse(i)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {/* Add New Response */}
                        <div className="flex items-end gap-2 bg-white/50 p-2 rounded-lg border border-purple-100/50">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500">User Types</label>
                                <input
                                    value={newTrigger}
                                    onChange={(e) => setNewTrigger(e.target.value)}
                                    placeholder="e.g. 1"
                                    className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500">Store Value</label>
                                <input
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    placeholder="e.g. Yes"
                                    className="w-full p-2 text-sm border border-purple-200 rounded-lg outline-none focus:border-purple-500"
                                />
                            </div>
                            <button
                                onClick={addResponse}
                                disabled={!newTrigger || !newValue}
                                className="h-[38px] px-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
