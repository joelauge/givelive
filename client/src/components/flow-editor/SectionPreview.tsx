import { Play, Trash2, MoveVertical } from 'lucide-react';

interface SectionPreviewProps {
    section: any;
    index: number;
    isSelected: boolean;
    isDragging: boolean;
    draggableId: string | null;
    onSectionClick: (section: any) => void;
    onRemove: (id: string, e?: React.MouseEvent) => void;
    onUpdateSection: (id: string, content: any) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onMouseEnterDrag: (id: string) => void;
    onMouseLeaveDrag: () => void;
}

export default function SectionPreview({
    section,
    index,
    isSelected,
    isDragging,
    draggableId,
    onSectionClick,
    onRemove,
    onUpdateSection,
    onDragStart,
    onDragOver,
    onDragEnd,
    onMouseEnterDrag,
    onMouseLeaveDrag
}: SectionPreviewProps) {
    return (
        <div
            onClick={() => onSectionClick(section)}
            draggable={draggableId === section.id}
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDragEnd={onDragEnd}
            className={`relative group transition-all cursor-pointer ${isSelected ? 'ring-2 ring-primary ring-inset' : 'hover:ring-1 hover:ring-primary/30 ring-inset'} ${isDragging ? 'opacity-50' : ''}`}
            style={{
                paddingTop: `${section.content.paddingTop || 0}px`,
                paddingBottom: `${section.content.paddingBottom || 0}px`,
                backgroundColor: section.content.backgroundColor || 'transparent'
            }}
        >
            {/* Edit Controls Overlay */}
            <div className={`absolute right-2 top-2 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    onClick={(e) => onRemove(section.id, e)}
                    className="p-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200"
                >
                    <Trash2 size={12} />
                </button>
                <button
                    className="p-1.5 bg-gray-100 text-gray-500 rounded-md hover:bg-gray-200 cursor-grab active:cursor-grabbing"
                    onMouseEnter={() => onMouseEnterDrag(section.id)}
                    onMouseLeave={onMouseLeaveDrag}
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
                        onChange={(e) => onUpdateSection(section.id, { text: e.target.value })}
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
                            <input type="number" placeholder="Amount" disabled className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm" />
                        )}

                        <button
                            className="w-full p-3 rounded-xl font-bold text-white shadow-lg shadow-primary/20"
                            style={{ backgroundColor: section.content.buttonColor || '#000000' }}
                        >
                            {section.content.buttonText || 'Donate'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
