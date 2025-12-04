import { useState, useEffect } from 'react';
import { Layout, Type, Image as ImageIcon, Video, Columns, Trash2, MoveVertical } from 'lucide-react';
import PropertiesPanel from './PropertiesPanel';

interface PageBuilderProps {
    data: any;
    onUpdate: (data: any) => void;
}

type SectionType = 'header' | 'text' | 'image' | 'video' | 'columns';

interface Section {
    id: string;
    type: SectionType;
    content: any;
}

export default function PageBuilder({ data, onUpdate }: PageBuilderProps) {
    const [sections, setSections] = useState<Section[]>(data.sections || []);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    // const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor'); // Removed unused state

    useEffect(() => {
        onUpdate({ sections });
    }, [sections]);

    const addSection = (type: SectionType) => {
        const newSection: Section = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: getDefaultContent(type)
        };
        setSections([...sections, newSection]);
        setSelectedSectionId(newSection.id); // Auto-select new section
    };

    const removeSection = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSections(sections.filter(s => s.id !== id));
        if (selectedSectionId === id) setSelectedSectionId(null);
    };

    const updateSection = (id: string, content: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, content: { ...s.content, ...content } } : s));
    };

    const getDefaultContent = (type: SectionType) => {
        switch (type) {
            case 'header': return { title: 'My Event', logo: '', paddingTop: 20, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' };
            case 'text': return { text: 'Welcome to our event! We are raising money for a great cause.', paddingTop: 10, paddingBottom: 10, textAlign: 'left', color: '#000000', fontSize: 16 };
            case 'image': return { url: 'https://placehold.co/600x400', alt: 'Event Image', paddingTop: 10, paddingBottom: 10, borderRadius: 8 };
            case 'video': return { url: '', paddingTop: 10, paddingBottom: 10, loop: false, autoplay: false };
            case 'columns': return { left: 'Left content', right: 'Right content', paddingTop: 10, paddingBottom: 10 };
            default: return {};
        }
    };

    const selectedSection = sections.find(s => s.id === selectedSectionId);

    return (
        <div className="flex h-full flex-col">
            {/* Toolbar or Properties Panel */}
            <div className="border-b border-gray-100 bg-white sticky top-0 z-10 h-[300px] overflow-hidden transition-all">
                {selectedSection ? (
                    <PropertiesPanel
                        section={selectedSection}
                        onUpdate={(data) => updateSection(selectedSection.id, data)}
                        onClose={() => setSelectedSectionId(null)}
                    />
                ) : (
                    <div className="p-4 h-full flex flex-col">
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

                        {sections.map((section) => (
                            <div
                                key={section.id}
                                onClick={() => setSelectedSectionId(section.id)}
                                className={`relative group transition-all cursor-pointer ${selectedSectionId === section.id ? 'ring-2 ring-primary ring-inset' : 'hover:ring-1 hover:ring-primary/30 ring-inset'}`}
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
                                    <button className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 cursor-move">
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
                                        <p
                                            className="w-full bg-transparent outline-none resize-none whitespace-pre-wrap"
                                            style={{
                                                textAlign: section.content.textAlign as any,
                                                color: section.content.color,
                                                fontFamily: section.content.fontFamily === 'serif' ? 'serif' : section.content.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
                                                fontWeight: section.content.fontWeight,
                                                fontSize: `${section.content.fontSize}px`
                                            }}
                                        >
                                            {section.content.text}
                                        </p>
                                    )}

                                    {section.type === 'image' && (
                                        <div
                                            className="overflow-hidden bg-gray-100 aspect-video relative"
                                            style={{ borderRadius: `${section.content.borderRadius}px` }}
                                        >
                                            <img src={section.content.url} alt={section.content.alt} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {section.type === 'video' && (
                                        <div
                                            className="overflow-hidden bg-gray-900 flex items-center justify-center text-white/50 text-xs relative transition-all duration-300"
                                            style={{
                                                borderRadius: `${section.content.borderRadius || 8}px`,
                                                aspectRatio: section.content.aspectRatio ? section.content.aspectRatio.replace(':', '/') : '16/9'
                                            }}
                                        >
                                            {section.content.url ? (
                                                <video
                                                    src={section.content.url}
                                                    className="w-full h-full object-cover"
                                                    loop={section.content.loop}
                                                    autoPlay={section.content.autoplay}
                                                    muted={section.content.autoplay} // Autoplay usually requires mute
                                                    controls={!section.content.autoplay}
                                                />
                                            ) : (
                                                <span>Video Placeholder</span>
                                            )}
                                        </div>
                                    )}

                                    {section.type === 'columns' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-gray-100 p-2 rounded text-xs min-h-[50px]">{section.content.left}</div>
                                            <div className="bg-gray-100 p-2 rounded text-xs min-h-[50px]">{section.content.right}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
