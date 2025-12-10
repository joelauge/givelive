import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, Type, Video, LayoutTemplate, Trash2, Play, ListChecks, Layout, Columns, MoveVertical, DollarSign } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';

interface PageBuilderProps {
    data: any;
    onUpdate: (data: any) => void;
}

export type SectionType = 'header' | 'text' | 'image' | 'video' | 'columns' | 'form' | 'choice' | 'payment';

interface Section {
    id: string;
    type: SectionType;
    content: any;
}

export default function PageBuilder({ data, onUpdate }: PageBuilderProps) {
    const [sections, setSections] = useState<Section[]>(data.sections || []);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [editingSectionSnapshot, setEditingSectionSnapshot] = useState<Section | null>(null);
    const [draggableId, setDraggableId] = useState<string | null>(null);
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Use ref to break infinite loop with parent updates
    const onUpdateRef = useRef(onUpdate);
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    });

    useEffect(() => {
        onUpdateRef.current({ sections });

        // Load Google Fonts
        const fonts = new Set(sections.map(s => s.content.fontFamily).filter(f => f && !['sans', 'serif', 'mono'].includes(f)));
        if (fonts.size > 0) {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${Array.from(fonts).map(f => f?.replace(' ', '+')).join('&family=')}&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => {
                document.head.removeChild(link);
            };
        }
    }, [sections]);

    const addSection = (type: SectionType) => {
        const newSection: Section = {
            // eslint-disable-next-line
            id: Math.random().toString(36).slice(2, 11),
            type,
            content: getDefaultContent(type)
        };
        setSections([...sections, newSection]);
        setSelectedSectionId(newSection.id);
        setEditingSectionSnapshot(null); // New section has no snapshot (indicates it's new)
    };

    const removeSection = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSections(sections.filter(s => s.id !== id));
        if (selectedSectionId === id) setSelectedSectionId(null);
    };

    const updateSection = (id: string, content: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, content: { ...s.content, ...content } } : s));
    };

    const handleSectionClick = (section: Section) => {
        if (selectedSectionId === section.id) return;
        setSelectedSectionId(section.id);
        setEditingSectionSnapshot(JSON.parse(JSON.stringify(section))); // Deep copy
    };

    const handleDone = () => {
        setSelectedSectionId(null);
        setEditingSectionSnapshot(null);
    };

    const handleCancel = () => {
        if (selectedSectionId) {
            if (editingSectionSnapshot) {
                // Revert to snapshot
                setSections(sections.map(s => s.id === selectedSectionId ? editingSectionSnapshot : s));
            } else {
                // It was a new section, remove it
                setSections(sections.filter(s => s.id !== selectedSectionId));
            }
        }
        setSelectedSectionId(null);
        setEditingSectionSnapshot(null);
    };

    const getDefaultContent = (type: SectionType) => {
        switch (type) {
            case 'header': return { title: 'My Event', logo: '', paddingTop: 20, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' };
            case 'text': return { text: 'Welcome to our event! We are raising money for a great cause.', paddingTop: 10, paddingBottom: 10, textAlign: 'left', color: '#000000', fontSize: 16 };
            case 'image': return { url: 'https://placehold.co/600x400', alt: 'Event Image', paddingTop: 10, paddingBottom: 10, borderRadius: 8 };
            case 'video': return { url: '', paddingTop: 10, paddingBottom: 10, loop: false, autoplay: false };
            case 'columns': return { left: 'Left content', right: 'Right content', paddingTop: 10, paddingBottom: 10 };
            case 'form': return { fields: ['name', 'phone'], buttonText: 'Sign Up', buttonColor: '#000000', paddingTop: 20, paddingBottom: 20 };
            case 'choice': return { choices: [{ label: 'Yes' }, { label: 'No' }] };
            case 'payment': return { frequencies: ['one-time', 'monthly'], defaultAmount: 50, buttonText: 'Donate Now', buttonColor: '#000000' };
            default: return {};
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Firefox requires dataTransfer data to be set for drag to work
        e.dataTransfer.setData('text/plain', index.toString());
        // Hide the default drag image or style it if needed? Default is usually fine.
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        // Reorder immediately for live preview
        const newSections = [...sections];
        const [movedItem] = newSections.splice(draggedItemIndex, 1);
        newSections.splice(index, 0, movedItem);
        setSections(newSections);
        setDraggedItemIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedItemIndex(null);
        setDraggableId(null);
    };

    const selectedSection = sections.find(s => s.id === selectedSectionId);

    return (
        <div className="flex h-full flex-col">
            {/* Toolbar or Properties Panel */}
            <div className="border-b border-gray-100 bg-white sticky top-0 z-10 h-auto max-h-[60vh] overflow-y-auto transition-all custom-scrollbar">
                {selectedSection ? (
                    <PropertiesPanel
                        section={selectedSection}
                        onUpdate={(data) => updateSection(selectedSection.id, data)}
                        onDone={handleDone}
                        onCancel={handleCancel}
                    />
                ) : (
                    <div className="p-4 h-full flex flex-col">
                        <div className="mb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Page Name</label>
                            <input
                                value={data.label || 'New Page'}
                                onChange={(e) => onUpdate({ label: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                                placeholder="Page Name"
                            />
                        </div>

                        {/* End Journey Toggle */}
                        <div className="mb-4 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 transition">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition">End Journey Here</div>
                                    <p className="text-xs text-gray-500 mt-0.5">Mark this page as the final step in the user journey</p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={data.isEndNode || false}
                                        onChange={(e) => onUpdate({ isEndNode: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </div>
                            </label>
                            {data.isEndNode && (
                                <div className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2 text-xs text-purple-700 bg-purple-50 -mx-3 -mb-3 px-3 py-2 rounded-b-xl">
                                    <span className="text-base">✓</span>
                                    <span className="font-medium">This page will end the journey - no next steps needed</span>
                                </div>
                            )}
                        </div>

                        {data.type === 'donation' && (
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">GL Code (Internal)</label>
                                <input
                                    value={data.glCode || ''}
                                    onChange={(e) => onUpdate({ glCode: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition font-mono text-gray-600"
                                    placeholder="e.g. CAMP-2024-Q1"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Internal attribution code. Not visible to donors.</p>
                            </div>
                        )}

                        <h3 className="text-sm font-bold text-gray-900 mb-4">Add Section</h3>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => addSection('header')} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition group">
                                <Layout size={24} className="text-gray-400 group-hover:text-primary" />
                                <span className="text-xs font-medium text-gray-600">Header</span>
                            </button>
                            <button onClick={() => addSection('text')} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition group">
                                <Type size={24} className="text-gray-400 group-hover:text-primary" />
                                <span className="text-xs font-medium text-gray-600">Text</span>
                            </button>
                            <button onClick={() => addSection('image')} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition group">
                                <ImageIcon size={24} className="text-gray-400 group-hover:text-primary" />
                                <span className="text-xs font-medium text-gray-600">Image</span>
                            </button>
                            <button onClick={() => addSection('video')} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition group">
                                <Video size={24} className="text-gray-400 group-hover:text-primary" />
                                <span className="text-xs font-medium text-gray-600">Video</span>
                            </button>
                            <button onClick={() => addSection('columns')} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition group">
                                <Columns size={24} className="text-gray-400 group-hover:text-primary" />
                                <span className="text-xs font-medium text-gray-600">Columns</span>
                            </button>
                            <button onClick={() => addSection('form')} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col items-center gap-1 transition">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><LayoutTemplate size={18} /></div>
                                <span className="text-[10px] font-medium text-gray-600">Form</span>
                            </button>
                            <button onClick={() => addSection('choice')} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col items-center gap-1 transition">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><ListChecks size={18} /></div>
                                <span className="text-[10px] font-medium text-gray-600">Choice</span>
                            </button>

                            {data.type === 'donation' && (
                                <button onClick={() => {
                                    const stripeConnected = localStorage.getItem('givelive_stripe_connected') === 'true';
                                    const paypalConnected = localStorage.getItem('givelive_paypal_connected') === 'true';

                                    if (!stripeConnected && !paypalConnected) {
                                        setShowPaymentModal(true);
                                        return;
                                    }

                                    addSection('payment');
                                }} className="p-2 hover:bg-gray-50 rounded-lg flex flex-col items-center gap-1 transition">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={18} /></div>
                                    <span className="text-[10px] font-medium text-gray-600">Payment</span>
                                </button>
                            )}
                        </div>
                        <div className="mt-auto text-center text-xs text-gray-400">
                            Select a section in the preview to edit its properties.
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {/* Mobile Preview Container */}
                <div className="mx-auto w-[320px] bg-white rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden relative min-h-[600px]">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>

                    {/* Screen Content */}
                    <div className="h-full overflow-y-auto overflow-x-hidden pt-8 pb-4 bg-white min-h-full">
                        {sections.length === 0 && (
                            <div className="text-center text-gray-400 mt-20 text-sm px-8">
                                Tap a tool above to add your first section
                            </div>
                        )}

                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                onClick={() => handleSectionClick(section)}
                                draggable={draggableId === section.id}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`relative group transition-all cursor-pointer ${selectedSectionId === section.id ? 'ring-2 ring-primary ring-inset' : 'hover:ring-1 hover:ring-primary/30 ring-inset'} ${draggedItemIndex === index ? 'opacity-50' : ''}`}
                                style={{
                                    paddingTop: `${section.content.paddingTop || 0}px`,
                                    paddingBottom: `${section.content.paddingBottom || 0}px`,
                                    backgroundColor: section.content.backgroundColor || 'transparent'
                                }}
                            >
                                {/* Edit Controls Overlay */}
                                <div className={`absolute right-2 top-2 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100 z-10 ${selectedSectionId === section.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button
                                        onClick={(e) => removeSection(section.id, e)}
                                        className="p-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <button
                                        className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 cursor-grab active:cursor-grabbing"
                                        onMouseEnter={() => setDraggableId(section.id)}
                                        onMouseLeave={() => setDraggableId(null)}
                                    >
                                        <MoveVertical size={12} />
                                    </button>
                                </div>

                                {/* Section Content */}
                                <div className="px-4">
                                    {section.type === 'header' && (
                                        <div className="text-center">
                                            <h2
                                                className="text-xl font-bold outline-none"
                                                style={{ color: section.content.color }}
                                            >
                                                {section.content.title}
                                            </h2>
                                        </div>
                                    )}

                                    {section.type === 'text' && (
                                        <textarea
                                            value={section.content.text}
                                            onChange={(e) => updateSection(section.id, { text: e.target.value })}
                                            className="w-full bg-transparent outline-none resize-none overflow-hidden block"
                                            placeholder="Enter your text here..."
                                            rows={1}
                                            ref={(el) => {
                                                if (el) {
                                                    el.style.height = 'auto';
                                                    el.style.height = el.scrollHeight + 'px';
                                                }
                                            }}
                                            onInput={(e) => {
                                                e.currentTarget.style.height = 'auto';
                                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                            }}
                                            style={{
                                                textAlign: section.content.textAlign as any,
                                                color: section.content.color,
                                                fontFamily: section.content.fontFamily === 'serif' ? 'serif' : section.content.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
                                                fontWeight: section.content.fontWeight,
                                                fontSize: `${section.content.fontSize}px`,
                                                minHeight: '1.5em'
                                            }}
                                        />
                                    )}

                                    {section.type === 'image' && (
                                        <div
                                            className={`overflow-hidden bg-gray-100 relative ${(!section.content.sizeMode || section.content.sizeMode === 'fit') ? '' : ''}`}
                                            style={{
                                                borderRadius: `${section.content.borderRadius}px`,
                                                height: (!section.content.sizeMode || section.content.sizeMode === 'fit') ? `${section.content.height || 200}px` : 'auto',
                                                width: '100%'
                                            }}
                                        >
                                            <img
                                                src={section.content.url}
                                                alt={section.content.alt}
                                                className={`w-full h-full ${(!section.content.sizeMode || section.content.sizeMode === 'fit') ? 'object-cover' : 'object-contain'}`}
                                                style={{
                                                    maxHeight: (!section.content.sizeMode || section.content.sizeMode === 'fit') ? 'none' : 'none',
                                                    width: (!section.content.sizeMode || section.content.sizeMode === 'fit') ? '100%' : '100%'
                                                }}
                                            />
                                        </div>
                                    )}

                                    {section.type === 'video' && (
                                        <div
                                            className="bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden"
                                            style={{ aspectRatio: section.content.aspectRatio ? section.content.aspectRatio.replace('/', '/') : '16/9' }}
                                        >
                                            {section.content.url ? (
                                                <video
                                                    src={section.content.url}
                                                    className="w-full h-full object-cover"
                                                    controls={false}
                                                />
                                            ) : (
                                                <Play size={32} className="text-white opacity-50" />
                                            )}
                                        </div>
                                    )}

                                    {section.type === 'columns' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-100 p-2 rounded text-xs min-h-[50px]">{section.content.left}</div>
                                            <div className="bg-gray-100 p-2 rounded text-xs min-h-[50px]">{section.content.right}</div>
                                        </div>
                                    )}

                                    {section.type === 'form' && (
                                        <div className="space-y-3">
                                            {section.content.fields?.includes('name') && (
                                                <input disabled placeholder="Full Name" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" />
                                            )}
                                            {section.content.fields?.includes('email') && (
                                                <input disabled placeholder="Email Address" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" />
                                            )}
                                            {section.content.fields?.includes('phone') && (
                                                <input disabled placeholder="Phone Number" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" />
                                            )}
                                            {section.content.fields?.includes('address') && (
                                                <input disabled placeholder="Address" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" />
                                            )}
                                            <button
                                                className="w-full p-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20"
                                                style={{ backgroundColor: section.content.buttonColor || '#000000' }}
                                            >
                                                {section.content.buttonText || 'Submit'}
                                            </button>
                                        </div>
                                    )}

                                    {section.type === 'choice' && (
                                        <div className="space-y-2">
                                            {(section.content.choices || []).map((choice: any, idx: number) => (
                                                <button key={idx} className="w-full p-3 rounded-xl border-2 border-primary/20 text-primary font-bold text-sm bg-white hover:bg-primary/5 transition">
                                                    {choice.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {section.type === 'payment' && (
                                        <div className="space-y-4">
                                            {/* Frequency Toggles */}
                                            {section.content.frequencies?.length > 0 && (
                                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                                    {section.content.frequencies.map((freq: string) => (
                                                        <div key={freq} className={`flex-1 py-2 text-center text-xs font-bold rounded-lg capitalize ${freq === 'one-time' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>
                                                            {freq}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Giving Levels */}
                                            {section.content.givingLevels?.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {section.content.givingLevels.map((level: any, idx: number) => (
                                                        <div key={idx} className="bg-white border-2 border-primary/10 rounded-xl p-3 text-center active:border-primary cursor-pointer hover:border-primary/50 transition relative overflow-hidden">
                                                            <div className="text-xl font-black text-gray-900 mb-0.5">${level.amount}</div>
                                                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{level.label}</div>
                                                            {level.description && (
                                                                <div className="text-[10px] text-gray-400 leading-tight line-clamp-2">{level.description}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {/* Custom Amount Option */}
                                                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-center text-xs font-bold text-gray-400">
                                                        Custom
                                                    </div>
                                                </div>
                                            ) : (
                                                // Default Input
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">$</span>
                                                    <input
                                                        disabled
                                                        value={section.content.defaultAmount || 50}
                                                        className="w-full p-4 pl-8 rounded-2xl border border-gray-200 text-2xl font-bold text-gray-900 bg-white"
                                                    />
                                                </div>
                                            )}

                                            {/* Donate Button */}
                                            <button
                                                className="w-full p-4 rounded-xl font-bold text-white shadow-xl shadow-primary/20 text-lg flex items-center justify-center gap-2"
                                                style={{ backgroundColor: section.content.buttonColor || '#000000' }}
                                            >
                                                <span>{section.content.buttonText || 'Donate Now'}</span>
                                            </button>

                                            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                Secure Payment
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Payment Gateway Warning Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <DollarSign size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-gray-900">Accept Donations</h3>
                                <p className="text-gray-500 text-sm">
                                    To accept donations, you need to connect a payment gateway (Stripe or PayPal) in your account settings.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => window.location.href = '/settings'}
                                    className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                                >
                                    Go to Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
