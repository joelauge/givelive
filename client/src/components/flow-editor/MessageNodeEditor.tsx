import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, Mail, Smartphone, Link as LinkIcon, Plus, AlertTriangle, LayoutTemplate, Globe, X, GitBranch, Trash2, Timer, Shuffle, ShoppingBag, BarChart2, TrendingUp } from 'lucide-react';
import Modal from '../Modal';
import PageBuilder from './PageBuilder';
import { API_URL } from '../../api';
import { SHOW_SOCIAL_TRIGGERS } from '../../config/features';

interface MessageNodeEditorProps {
    data: any;
    nodeId: string;
    nodes?: any[];
    edges?: any[];
    onUpdate: (data: any) => void;
}

type MessageType = 'sms' | 'email' | 'both';
type SequenceItem = { type: 'text', content: string } | { type: 'delay', duration: number };

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

const SequenceItem = ({ item, isSelected, onSelect, onDelete, showDelete }: any) => {
    if (item.type === 'delay') {
        return (
            <div className="flex gap-3 relative group items-center z-10" onClick={onSelect}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors bg-white ${isSelected ? 'border-orange-500 text-orange-500' : 'border-gray-300 text-gray-400'}`}>
                    <Timer size={14} />
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all ${isSelected ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                    Wait {formatDuration(item.duration)}
                </div>

                {showDelete && (
                    <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"><X size={14} /></button>
                )}
            </div>
        );
    }

    // Text Message
    const previewText = item.content
        .replace(/\{\{name\}\}/g, 'John')
        .replace(/\{\{phone\}\}/g, '(555) 123-4567')
        .replace(/\{\{email\}\}/g, 'john@example.com')
        .replace(/\{\{amount\}\}/g, '$50');

    return (
        <div className="flex gap-3 relative group z-10" onClick={onSelect}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-blue-100 text-blue-600'}`}>
                <MessageSquare size={16} />
            </div>
            <div className={`p-3 rounded-2xl rounded-tl-none shadow-sm text-sm max-w-[85%] border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-100'}`}>
                {previewText || <span className="text-gray-300 italic">Empty message...</span>}
            </div>
            {showDelete && (
                <button onClick={onDelete} className="absolute -right-2 -top-2 p-1 bg-white rounded-full shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
            )}
        </div>
    );
};

export default function MessageNodeEditor({ data, nodeId, nodes = [], edges = [], onUpdate }: MessageNodeEditorProps) {
    const [messageType, setMessageType] = useState<MessageType>(data.messageType || 'sms');
    const [isEndNode, setIsEndNode] = useState<boolean>(data.isEndNode || false);

    // Support multi-message sequence with delays
    const [sequence, setSequence] = useState<SequenceItem[]>(() => {
        if (data.messageSequence) return data.messageSequence;
        if (data.smsMessages) return data.smsMessages.map((msg: string) => ({ type: 'text', content: msg }));
        if (data.smsMessage) return [{ type: 'text', content: data.smsMessage }];
        return [{ type: 'text', content: '' }];
    });

    const [selectedIndex, setSelectedIndex] = useState(0);

    const [emailSubject, setEmailSubject] = useState(data.emailSubject || '');
    const [emailBody, setEmailBody] = useState(data.emailBody || '');
    const [emailSections, setEmailSections] = useState(data.emailSections || []);
    const [showEmailBuilder, setShowEmailBuilder] = useState(false);

    const [linkType, setLinkType] = useState<'internal' | 'external'>('internal');
    const [selectedPageId, setSelectedPageId] = useState('');
    const [externalUrl, setExternalUrl] = useState('');

    // Random Variations
    const [randomVariations, setRandomVariations] = useState<string[]>(data.randomVariations || []);

    // Product Picker
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Analytics
    const [analytics, setAnalytics] = useState<any>(null);

    // Expected Responses for Logic
    const [expectedResponses, setExpectedResponses] = useState<{ trigger: string, value: string }[]>(data.expectedResponses || []);
    const [newTrigger, setNewTrigger] = useState('');

    // Input Capture
    const [captureInput, setCaptureInput] = useState(data.captureInput || false);
    const [inputType, setInputType] = useState(data.inputType || 'email'); // email, phone, text
    const [variableName, setVariableName] = useState(data.variableName || 'email');
    const [invalidMessage, setInvalidMessage] = useState(data.invalidMessage || 'Please enter a valid email address.');
    const [newValue, setNewValue] = useState('');

    useEffect(() => {
        // Fetch Analytics
        fetch(`${API_URL}/analytics/node/${nodeId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && !data.error) {
                    setAnalytics(data);
                } else {
                    setAnalytics({ sent: 0, clicked: 0, replies: 0, revenue: 0 });
                }
            })
            .catch(err => {
                console.error('Failed to load analytics', err);
                setAnalytics({ sent: 0, clicked: 0, replies: 0, revenue: 0 });
            });
    }, [nodeId]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            // Mock fetching from Shopify integration
            // In real app: api.post('/integrations/products', { type: 'shopify', config: ... })
            // We'll simulate for now or call the real endpoint if context allows
            const res = await fetch(`${API_URL}/integrations/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'shopify', config: { shopUrl: 'demo.myshopify.com', accessToken: 'test' } })
            });
            const data = await res.json();
            setProducts(data.products || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProducts(false);
        }
    };

    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('Do you want to receive updates?');
    const [pollOptions, setPollOptions] = useState([
        { label: 'Yes', trigger: '1' },
        { label: 'No', trigger: '2' }
    ]);

    const addPollOption = () => {
        setPollOptions([...pollOptions, { label: '', trigger: `${pollOptions.length + 1}` }]);
    };

    const updatePollOption = (index: number, field: 'label' | 'trigger', value: string) => {
        const newOptions = [...pollOptions];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setPollOptions(newOptions);
    };

    const removePollOption = (index: number) => {
        setPollOptions(pollOptions.filter((_, i) => i !== index));
    };

    const insertPoll = () => {
        let textToInsert = `\n${pollQuestion}\n`;
        pollOptions.forEach(opt => {
            textToInsert += `Reply ${opt.trigger} for ${opt.label}, `;
        });
        textToInsert = textToInsert.slice(0, -2); // Remove trailing comma

        // Insert Text
        const currentItem = sequence[selectedIndex];
        if (currentItem.type === 'text') {
            updateCurrentMessage(currentItem.content + textToInsert);
        }

        // Add Responses
        const newResponses = [
            ...expectedResponses,
            ...pollOptions.map(o => ({ trigger: o.trigger, value: o.label }))
        ];
        setExpectedResponses(newResponses);

        setShowPollModal(false);
    };

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

    const addMessage = (type: 'text' | 'page' | 'url' | 'delay') => {
        const newSequence = [...sequence];

        if (type === 'delay') {
            newSequence.push({ type: 'delay', duration: 5 }); // Default 5s
        } else {
            // Text based
            newSequence.push({ type: 'text', content: '' });
        }

        setSequence(newSequence);
        setSelectedIndex(newSequence.length - 1);
        setShowAddMenu(false);
    };

    const updateCurrentMessage = (text: string) => {
        const newSequence = [...sequence];
        const item = newSequence[selectedIndex];
        if (item.type === 'text') {
            item.content = text;
            setSequence(newSequence);
        }
    };

    const updateDelay = (duration: number) => {
        const newSequence = [...sequence];
        const item = newSequence[selectedIndex];
        if (item.type === 'delay') {
            item.duration = duration;
            setSequence(newSequence);
        }
    }

    const deleteMessage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (sequence.length <= 1) {
            // If deleting last item, just reset it to empty text
            setSequence([{ type: 'text', content: '' }]);
            return;
        }
        const newSequence = sequence.filter((_, i) => i !== index);
        setSequence(newSequence);
        if (selectedIndex >= index && selectedIndex > 0) {
            setSelectedIndex(selectedIndex - 1);
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
                // Append to CURRENT SMS message if it's a text node
                const currentItem = sequence[selectedIndex];
                if (currentItem.type === 'text') {
                    updateCurrentMessage(currentItem.content + linkToInsert);
                }
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
            // Legacy backward compat:
            const textMessages = sequence.filter(i => i.type === 'text').map(i => (i as any).content);

            onUpdate({
                messageType,
                messageSequence: sequence,
                smsMessages: textMessages, // Legacy
                smsMessage: textMessages[0] || '', // Legacy
                emailSubject,
                emailBody, // Keep for backward compat?
                emailSections,
                expectedResponses,
                isEndNode,
                randomVariations,
                // New Capture Fields
                captureInput,
                inputType,
                variableName,
                invalidMessage
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [messageType, sequence, emailSubject, emailBody, emailSections, expectedResponses, isEndNode, randomVariations, captureInput, inputType, variableName, invalidMessage]);

    // Check if Social Flow
    const isSocialFlow = useMemo(() => {
        if (!SHOW_SOCIAL_TRIGGERS) return false;
        const startNode = nodes?.find(n => n.id === 'start');
        return startNode?.data?.triggerType === 'social';
    }, [nodes]);



    return (
        <div className="p-6 space-y-6">
            {/* Analytics Overlay */}
            {analytics && (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 text-white shadow-lg mb-4">
                    <div className="flex items-center gap-2 mb-3 text-gray-300 text-xs font-bold uppercase tracking-wider">
                        <BarChart2 size={14} className="text-emerald-400" />
                        Performance Last 30 Days
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <div className="text-2xl font-bold">{analytics.sent}</div>
                            <div className="text-[10px] text-gray-400">Sent</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold flex items-center gap-1">
                                {analytics.sent > 0 ? Math.round((analytics.clicked / analytics.sent) * 100) : 0}%
                                <TrendingUp size={12} className="text-emerald-400" />
                            </div>
                            <div className="text-[10px] text-gray-400">CTR</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{analytics.replies}</div>
                            <div className="text-[10px] text-gray-400">Replies</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-emerald-400">${analytics.revenue}</div>
                            <div className="text-[10px] text-gray-400">Revenue</div>
                        </div>
                    </div>
                </div>
            )}

            {!isSocialFlow && (
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
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2 mt-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                {warnings.map((w, i) => <div key={i}>{w}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            )}

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

            {(messageType === 'sms' || messageType === 'both' || isSocialFlow) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 text-primary font-medium border-b border-primary/10 pb-2">
                        {isSocialFlow ? <MessageSquare size={18} /> : <Smartphone size={18} />}
                        <h3>{isSocialFlow ? 'Social Message' : 'SMS Configuration'}</h3>
                    </div>

                    {/* Available Fields for Personalization - ONLY SHOW IF TEXT SELECTED */}
                    {(sequence[selectedIndex]?.type === 'text') && (sourceValidation.hasPhone || sourceValidation.hasEmail || isSocialFlow) ? (
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
                                                const currentItem = sequence[selectedIndex];
                                                if (currentItem.type === 'text') {
                                                    updateCurrentMessage(currentItem.content + tag);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-white border-2 border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                                            title={`Click to insert {{${field}}}`}
                                        >
                                            <span className="text-xs">+</span>
                                            <span className="capitalize">{field}</span>
                                        </button>
                                    ));

                                })()}

                                <div className="w-px h-6 bg-blue-200 mx-1"></div>

                                <button
                                    onClick={() => setShowPollModal(true)}
                                    className="px-3 py-1.5 bg-white border-2 border-purple-200 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <GitBranch size={12} />
                                    <span>Insert Poll</span>
                                </button>

                                <button
                                    onClick={() => {
                                        fetchProducts();
                                        setShowProductPicker(true);
                                    }}
                                    className="px-3 py-1.5 bg-white border-2 border-emerald-200 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <ShoppingBag size={12} />
                                    <span>Insert Product</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-blue-600/70 mt-2">Click a tag to insert it into your message.</p>
                        </div>
                    ) : null}

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                {sequence[selectedIndex]?.type === 'delay' ? 'Delay Settings' : `Message ${selectedIndex + 1} of ${sequence.length}`}
                            </label>

                            <div className="flex gap-1" >
                                {sequence.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedIndex(i)}
                                        className={`w-2 h-2 rounded-full cursor-pointer transition-colors ${i === selectedIndex ? 'bg-primary' : 'bg-gray-200 hover:bg-gray-300'}`}
                                        title={item.type}
                                    />
                                ))}
                            </div>
                        </div>

                        {sequence[selectedIndex]?.type === 'delay' ? (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-4 animate-in fade-in duration-200">
                                <div>
                                    <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Duration (Seconds)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={(sequence[selectedIndex] as any).duration}
                                            onChange={(e) => updateDelay(parseInt(e.target.value) || 0)}
                                            min={1}
                                            max={86400} // 24 hours
                                            className="flex-1 p-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 outline-none text-lg font-bold text-orange-900"
                                        />
                                        <div className="bg-white px-3 py-2 rounded-lg border border-orange-200 text-sm text-orange-700 font-bold min-w-[80px] text-center">
                                            {formatDuration((sequence[selectedIndex] as any).duration)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-orange-600/70 mt-2">Max 24 hours (86400 seconds)</p>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    value={(sequence[selectedIndex] as any)?.content || ''}
                                    onChange={(e) => updateCurrentMessage(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                    placeholder="Type your message..."
                                    maxLength={160}
                                />

                                {/* Random Variations Tabs */}
                                {sequence[selectedIndex]?.type === 'text' && (
                                    <div className="mt-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                                <Shuffle size={12} />
                                                Random Variations
                                            </label>
                                            <button
                                                onClick={() => setRandomVariations([...randomVariations, ''])}
                                                className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 transition"
                                            >
                                                + Add Variation
                                            </button>
                                        </div>

                                        {randomVariations.length > 0 ? (
                                            <div className="space-y-2">
                                                {randomVariations.map((v, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input
                                                            value={v}
                                                            onChange={(e) => {
                                                                const newVars = [...randomVariations];
                                                                newVars[idx] = e.target.value;
                                                                setRandomVariations(newVars);
                                                            }}
                                                            placeholder={`Variation ${idx + 1}`}
                                                            className="flex-1 p-2 text-xs border border-gray-200 rounded bg-white outline-none focus:border-primary"
                                                        />
                                                        <button
                                                            onClick={() => setRandomVariations(randomVariations.filter((_, i) => i !== idx))}
                                                            className="text-gray-400 hover:text-red-500 p-1"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-gray-400 italic">Add variations to prevent spam filters and increase engagement.</p>
                                        )}
                                    </div>
                                )}

                                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                    {((sequence[selectedIndex] as any)?.content?.length || 0)}/160
                                </div>
                            </div>
                        )}
                        {sequence[selectedIndex]?.type === 'text' && (
                            <p className="text-xs text-gray-500 mt-2">
                                Standard SMS rates apply. Messages over 160 characters will be split.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Input Capture Section */}
            {(isSocialFlow || messageType === 'sms' || messageType === 'both') && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-indigo-700 font-medium">
                            <MessageSquare size={16} />
                            <h3>Capture User Input</h3>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={captureInput}
                                onChange={(e) => setCaptureInput(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {captureInput && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Input Type</label>
                                <select
                                    value={inputType}
                                    onChange={(e) => {
                                        setInputType(e.target.value);
                                        if (e.target.value === 'email' && variableName === 'email') setVariableName('email');
                                        if (e.target.value === 'phone' && variableName === 'email') setVariableName('phone');
                                    }}
                                    className="w-full p-2 border border-indigo-200 rounded-lg text-sm"
                                >
                                    <option value="email">Email Address</option>
                                    <option value="phone">Phone Number</option>
                                    <option value="text">Any Text</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Save to Variable</label>
                                <input
                                    value={variableName}
                                    onChange={(e) => setVariableName(e.target.value)}
                                    placeholder="e.g. email"
                                    className="w-full p-2 border border-indigo-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Invalid Format Message</label>
                                <input
                                    value={invalidMessage}
                                    onChange={(e) => setInvalidMessage(e.target.value)}
                                    placeholder="Please enter a valid email."
                                    className="w-full p-2 border border-indigo-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary">
                                <LayoutTemplate size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Visual Email Builder</h4>
                                <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Drag and drop sections to create beautiful emails.</p>
                            </div>
                            <button
                                onClick={() => setShowEmailBuilder(true)}
                                className="px-4 py-2 bg-white border border-gray-300 shadow-sm rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition"
                            >
                                Open Email Editor
                            </button>
                            {emailSections.length > 0 && (
                                <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {emailSections.length} sections configured
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showEmailBuilder}
                onClose={() => setShowEmailBuilder(false)}
                title="Email Template Editor"
                maxWidth="max-w-6xl"
            >
                <div className="h-[70vh]">
                    <PageBuilder
                        data={{ sections: emailSections, label: 'Email Template' }}
                        onUpdate={(d) => {
                            if (d.sections) {
                                setEmailSections(d.sections);
                            }
                        }}
                    />
                </div>
            </Modal>

            {/* Preview Section */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Preview Sequence</div>

                {(messageType === 'sms' || messageType === 'both') && (
                    <div className="space-y-4 mb-4 relative">
                        {/* Vertical line connecting bubbles */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 -z-0"></div>

                        {sequence.map((item, index) => (
                            <SequenceItem
                                key={index}
                                item={item}
                                index={index}
                                isSelected={index === selectedIndex}
                                onSelect={() => setSelectedIndex(index)}
                                onDelete={(e: React.MouseEvent) => deleteMessage(index, e)}
                                showDelete={sequence.length > 1}
                            />
                        ))}

                        {/* Add Button */}
                        <div className="relative ml-11 z-10">
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
                                        onClick={() => addMessage('delay')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                                    >
                                        <Timer size={14} className="text-orange-500" />
                                        <span>Delay / Wait</span>
                                    </button>
                                    <div className="h-px bg-gray-100 my-1"></div>
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
                            {nodes.filter(n => {
                                const type = n.data?.type || n.type;
                                return ['page', 'donation'].includes(type) && n.id !== nodeId;
                            }).map(node => (
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
            {/* Poll Modal */}
            {showPollModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <GitBranch size={18} className="text-purple-600" />
                                Insert Logic Poll
                            </h3>
                            <button onClick={() => setShowPollModal(false)} className="p-1 hover:bg-gray-200 rounded-full transition">
                                <X size={16} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Poll Question</label>
                                <input
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none"
                                    placeholder="e.g. Do you approve?"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Options</label>
                                <div className="space-y-2">
                                    {pollOptions.map((opt, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input
                                                value={opt.trigger}
                                                onChange={(e) => updatePollOption(i, 'trigger', e.target.value)}
                                                placeholder="Trigger (e.g. 1)"
                                                className="w-1/3 p-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                            <input
                                                value={opt.label}
                                                onChange={(e) => updatePollOption(i, 'label', e.target.value)}
                                                placeholder="Label (e.g. Yes)"
                                                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                            <button onClick={() => removePollOption(i)} className="p-2 text-gray-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addPollOption}
                                        className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-2"
                                    >
                                        <Plus size={12} /> Add Option
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                                This will add the question to your message and create logic branches for each option.
                            </p>

                            <button
                                onClick={insertPoll}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                            >
                                Insert Poll & Create Branches
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Modal
                isOpen={showProductPicker}
                onClose={() => setShowProductPicker(false)}
                title="Select a Product"
                maxWidth="max-w-xl"
            >
                <div className="p-4 h-[50vh] overflow-y-auto">
                    {loadingProducts ? (
                        <div className="flex justify-center items-center h-full text-gray-400">Loading products...</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {products.length > 0 ? products.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        const currentItem = sequence[selectedIndex];
                                        if (currentItem.type === 'text') {
                                            updateCurrentMessage(currentItem.content + ` Check this out: ${p.title} - ${p.url} `);
                                        }
                                        setShowProductPicker(false);
                                    }}
                                    className="border border-gray-200 rounded-xl p-3 hover:border-emerald-500 hover:shadow-md transition cursor-pointer group"
                                >
                                    {p.image && <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-2 bg-gray-100" />}
                                    <div className="font-bold text-sm text-gray-800 group-hover:text-emerald-600 truncate">{p.title}</div>
                                    <div className="text-xs text-gray-500">${p.price}</div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center text-gray-400 italic mt-10">
                                    No products found. Check your Shopify integration.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div >
    );
}
