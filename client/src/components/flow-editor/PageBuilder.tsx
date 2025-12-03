import { useState, useEffect } from 'react';
import { Layout, Type, Image as ImageIcon, Video, Columns, Trash2, MoveVertical } from 'lucide-react';

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
    };

    const removeSection = (id: string) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const updateSection = (id: string, content: any) => {
        setSections(sections.map(s => s.id === id ? { ...s, content: { ...s.content, ...content } } : s));
    };

    const getDefaultContent = (type: SectionType) => {
        switch (type) {
            case 'header': return { title: 'My Event', logo: '' };
            case 'text': return { text: 'Welcome to our event! We are raising money for a great cause.' };
            case 'image': return { url: 'https://placehold.co/600x400', alt: 'Event Image' };
            case 'video': return { url: '' };
            case 'columns': return { left: 'Left content', right: 'Right content' };
            default: return {};
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <button onClick={() => addSection('header')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 min-w-[60px]">
                        <Layout size={20} className="text-gray-600" />
                        <span className="text-[10px] font-medium text-gray-500">Header</span>
                    </button>
                    <button onClick={() => addSection('text')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 min-w-[60px]">
                        <Type size={20} className="text-gray-600" />
                        <span className="text-[10px] font-medium text-gray-500">Text</span>
                    </button>
                    <button onClick={() => addSection('image')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 min-w-[60px]">
                        <ImageIcon size={20} className="text-gray-600" />
                        <span className="text-[10px] font-medium text-gray-500">Image</span>
                    </button>
                    <button onClick={() => addSection('video')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 min-w-[60px]">
                        <Video size={20} className="text-gray-600" />
                        <span className="text-[10px] font-medium text-gray-500">Video</span>
                    </button>
                    <button onClick={() => addSection('columns')} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 min-w-[60px]">
                        <Columns size={20} className="text-gray-600" />
                        <span className="text-[10px] font-medium text-gray-500">Cols</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {/* Mobile Preview Container */}
                <div className="mx-auto w-[320px] bg-white rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden relative min-h-[600px]">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>

                    {/* Screen Content */}
                    <div className="h-full overflow-y-auto overflow-x-hidden pt-8 pb-4 px-4 space-y-4">
                        {sections.length === 0 && (
                            <div className="text-center text-gray-400 mt-20 text-sm">
                                Add sections to build your page
                            </div>
                        )}

                        {sections.map((section) => (
                            <div key={section.id} className="relative group border border-transparent hover:border-primary/20 rounded-lg transition-all">
                                {/* Edit Controls Overlay */}
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100 z-10">
                                    <button onClick={() => removeSection(section.id)} className="p-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200">
                                        <Trash2 size={12} />
                                    </button>
                                    <button className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 cursor-move">
                                        <MoveVertical size={12} />
                                    </button>
                                </div>

                                {/* Section Content */}
                                {section.type === 'header' && (
                                    <div className="text-center py-4">
                                        <input
                                            value={section.content.title}
                                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                            className="text-xl font-bold text-center bg-transparent w-full outline-none placeholder-gray-300"
                                            placeholder="Event Title"
                                        />
                                    </div>
                                )}

                                {section.type === 'text' && (
                                    <textarea
                                        value={section.content.text}
                                        onChange={(e) => updateSection(section.id, { text: e.target.value })}
                                        className="w-full bg-transparent outline-none resize-none text-sm text-gray-600"
                                        rows={3}
                                    />
                                )}

                                {section.type === 'image' && (
                                    <div className="rounded-lg overflow-hidden bg-gray-100 aspect-video relative group/image">
                                        <img src={section.content.url} alt={section.content.alt} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                            <input
                                                type="text"
                                                value={section.content.url}
                                                onChange={(e) => updateSection(section.id, { url: e.target.value })}
                                                className="bg-white/90 px-2 py-1 rounded text-xs w-3/4"
                                                placeholder="Image URL"
                                            />
                                        </div>
                                    </div>
                                )}

                                {section.type === 'video' && (
                                    <div className="rounded-lg overflow-hidden bg-gray-900 aspect-video flex items-center justify-center text-white/50 text-xs">
                                        Video Placeholder
                                    </div>
                                )}

                                {section.type === 'columns' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-gray-100 p-2 rounded text-xs min-h-[50px]">{section.content.left}</div>
                                        <div className="bg-gray-100 p-2 rounded text-xs min-h-[50px]">{section.content.right}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
