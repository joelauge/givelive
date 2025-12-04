import { Upload, AlignLeft, AlignCenter, AlignRight, Type, Image as ImageIcon, Video, Layout, Check } from 'lucide-react';
import { useState } from 'react';

interface PropertiesPanelProps {
    section: any;
    onUpdate: (data: any) => void;
    onDone: () => void;
    onCancel: () => void;
}

export default function PropertiesPanel({ section, onUpdate, onDone, onCancel }: PropertiesPanelProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.url) {
                const updates: any = { url: data.url };

                // If it's a video, detect aspect ratio
                if (section.type === 'video') {
                    const video = document.createElement('video');
                    video.src = data.url;
                    await new Promise((resolve) => {
                        video.onloadedmetadata = () => {
                            const ratio = video.videoWidth / video.videoHeight;
                            // Determine closest standard ratio
                            if (Math.abs(ratio - 16 / 9) < 0.1) updates.aspectRatio = '16/9';
                            else if (Math.abs(ratio - 9 / 16) < 0.1) updates.aspectRatio = '9/16';
                            else if (Math.abs(ratio - 1) < 0.1) updates.aspectRatio = '1/1';
                            else updates.aspectRatio = '16/9'; // Default fallback
                            resolve(null);
                        };
                        video.onerror = () => resolve(null);
                    });
                }

                onUpdate(updates);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        {section.type === 'header' && <Layout size={16} />}
                        {section.type === 'text' && <Type size={16} />}
                        {section.type === 'image' && <ImageIcon size={16} />}
                        {section.type === 'video' && <Video size={16} />}
                    </div>
                    <span className="font-bold text-gray-900 capitalize">{section.type} Settings</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDone}
                        className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-1"
                    >
                        <Check size={14} />
                        Done
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Common: Padding */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Spacing</label>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-400">Top</label>
                            <input
                                type="number"
                                value={section.content.paddingTop || 20}
                                onChange={(e) => onUpdate({ paddingTop: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400">Bottom</label>
                            <input
                                type="number"
                                value={section.content.paddingBottom || 20}
                                onChange={(e) => onUpdate({ paddingBottom: parseInt(e.target.value) })}
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {section.type === 'header' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content</label>
                            <input
                                value={section.content.title}
                                onChange={(e) => onUpdate({ title: e.target.value })}
                                className="input-field"
                                placeholder="Event Title"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Background</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={section.content.backgroundColor || '#ffffff'}
                                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                                <input
                                    value={section.content.backgroundColor || '#ffffff'}
                                    onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                                    className="input-field flex-1"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {section.type === 'text' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Typography</label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={section.content.fontFamily || 'sans'}
                                    onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                                    className="input-field"
                                >
                                    <optgroup label="Standard">
                                        <option value="sans">Sans Serif</option>
                                        <option value="serif">Serif</option>
                                        <option value="mono">Monospace</option>
                                    </optgroup>
                                    <optgroup label="Google Fonts">
                                        <option value="Inter">Inter</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Open Sans">Open Sans</option>
                                        <option value="Lato">Lato</option>
                                        <option value="Montserrat">Montserrat</option>
                                        <option value="Oswald">Oswald</option>
                                        <option value="Raleway">Raleway</option>
                                        <option value="Poppins">Poppins</option>
                                        <option value="Playfair Display">Playfair Display</option>
                                        <option value="Merriweather">Merriweather</option>
                                    </optgroup>
                                </select>
                                <select
                                    value={section.content.fontWeight || 'normal'}
                                    onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="bold">Bold</option>
                                    <option value="light">Light</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200 w-fit">
                                <button
                                    onClick={() => onUpdate({ textAlign: 'left' })}
                                    className={`p-1.5 rounded ${section.content.textAlign === 'left' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <AlignLeft size={16} />
                                </button>
                                <button
                                    onClick={() => onUpdate({ textAlign: 'center' })}
                                    className={`p-1.5 rounded ${section.content.textAlign === 'center' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <AlignCenter size={16} />
                                </button>
                                <button
                                    onClick={() => onUpdate({ textAlign: 'right' })}
                                    className={`p-1.5 rounded ${section.content.textAlign === 'right' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <AlignRight size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={section.content.color || '#000000'}
                                    onChange={(e) => onUpdate({ color: e.target.value })}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                                <input
                                    value={section.content.color || '#000000'}
                                    onChange={(e) => onUpdate({ color: e.target.value })}
                                    className="input-field flex-1"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {(section.type === 'image' || section.type === 'video') && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept={section.type === 'image' ? "image/*" : "video/*"}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition text-gray-500"
                                >
                                    {uploading ? (
                                        <span className="animate-pulse">Uploading...</span>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            <span className="text-sm font-medium">Upload File</span>
                                        </>
                                    )}
                                </label>
                            </div>
                            <div className="text-center text-xs text-gray-400 my-2">- OR -</div>
                            <input
                                value={section.content.url}
                                onChange={(e) => onUpdate({ url: e.target.value })}
                                className="input-field"
                                placeholder="Paste URL"
                            />
                        </div>

                        {section.type === 'image' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style</label>
                                <div>
                                    <label className="text-[10px] text-gray-400">Size Mode</label>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button
                                            onClick={() => onUpdate({ sizeMode: 'fit' })}
                                            className={`flex-1 py-1 text-xs font-medium rounded-md transition ${(!section.content.sizeMode || section.content.sizeMode === 'fit') ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Original
                                        </button>
                                        <button
                                            onClick={() => onUpdate({ sizeMode: 'original' })}
                                            className={`flex-1 py-1 text-xs font-medium rounded-md transition ${section.content.sizeMode === 'original' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Fit Container
                                        </button>
                                    </div>
                                </div>

                                {(!section.content.sizeMode || section.content.sizeMode === 'fit') && (
                                    <div>
                                        <label className="text-[10px] text-gray-400">Height</label>
                                        <input
                                            type="range"
                                            min="100"
                                            max="600"
                                            value={section.content.height || 200}
                                            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
                                            className="w-full accent-primary"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] text-gray-400">Border Radius</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="32"
                                        value={section.content.borderRadius || 0}
                                        onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
                                        className="w-full accent-primary"
                                    />
                                </div>
                            </div>
                        )}

                        {section.type === 'video' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Playback</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={section.content.loop || false}
                                            onChange={(e) => onUpdate({ loop: e.target.checked })}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        Loop Video
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={section.content.autoplay || false}
                                            onChange={(e) => onUpdate({ autoplay: e.target.checked })}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        Autoplay (Muted)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {section.type === 'form' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fields</label>
                            <div className="space-y-2">
                                {['name', 'email', 'phone', 'address'].map((field) => (
                                    <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer capitalize">
                                        <input
                                            type="checkbox"
                                            checked={section.content.fields?.includes(field) || false}
                                            onChange={(e) => {
                                                const current = section.content.fields || [];
                                                const next = e.target.checked
                                                    ? [...current, field]
                                                    : current.filter((f: string) => f !== field);
                                                onUpdate({ fields: next });
                                            }}
                                            className="rounded text-primary focus:ring-primary"
                                        />
                                        {field}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Button</label>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-[10px] text-gray-400">Text</label>
                                    <input
                                        value={section.content.buttonText || 'Submit'}
                                        onChange={(e) => onUpdate({ buttonText: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-400">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={section.content.buttonColor || '#000000'}
                                            onChange={(e) => onUpdate({ buttonColor: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            value={section.content.buttonColor || '#000000'}
                                            onChange={(e) => onUpdate({ buttonColor: e.target.value })}
                                            className="input-field flex-1"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {section.type === 'choice' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Choices</label>
                            <button
                                onClick={() => {
                                    const newChoices = [...(section.content.choices || [])];
                                    newChoices.push({ id: Math.random().toString(36).substr(2, 9), label: 'New Choice' });
                                    onUpdate({ choices: newChoices });
                                }}
                                className="text-xs text-primary font-medium hover:underline"
                            >
                                + Add Choice
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(section.content.choices || []).map((choice: any, idx: number) => (
                                <div key={choice.id || idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={choice.label}
                                        onChange={(e) => {
                                            const newChoices = [...(section.content.choices || [])];
                                            newChoices[idx] = { ...choice, label: e.target.value };
                                            onUpdate({ choices: newChoices });
                                        }}
                                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                                        placeholder="Choice Label"
                                    />
                                    <button
                                        onClick={() => {
                                            const newChoices = section.content.choices.filter((_: any, i: number) => i !== idx);
                                            onUpdate({ choices: newChoices });
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
