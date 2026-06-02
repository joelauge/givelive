import { Upload, AlignLeft, AlignCenter, AlignRight, Type, Image as ImageIcon, Video, Layout, Check, Trash2, Plus, Grid, X, Loader2, Link as LinkIcon, FileDown } from 'lucide-react';
import { useState } from 'react';
import { API_URL } from '../../api';

interface PropertiesPanelProps {
    section: any;
    onUpdate: (data: any) => void;
    onDone: () => void;
    onCancel: () => void;
}

export default function PropertiesPanel({ section, onUpdate, onDone, onCancel }: PropertiesPanelProps) {
    const [uploading, setUploading] = useState(false);
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<any[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    const openMediaLibrary = async () => {
        setShowMediaLibrary(true);
        setLoadingMedia(true);
        try {
            const res = await fetch(`${API_URL}/upload/list`);
            if (res.ok) {
                const data = await res.json();
                setMediaFiles(data.files || []);
            }
        } catch (e) {
            console.error('Failed to load media library', e);
        } finally {
            setLoadingMedia(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            // 1. Get Signed URL from Backend
            const signRes = await fetch(`${API_URL}/upload/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type
                }),
            });

            if (!signRes.ok) throw new Error('Failed to get upload signature');
            const { signedUrl, publicUrl } = await signRes.json();

            // 2. Upload to Supabase Storage using Signed URL
            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

            // 3. Update State with Public URL
            const updates: any = { url: publicUrl };

            // If it's a video, detect aspect ratio
            if (section.type === 'video') {
                const video = document.createElement('video');
                video.src = publicUrl;
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

            if (section.type === 'download') {
                updates.fileUrl = publicUrl;
                updates.fileName = file.name;
                updates.fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            }

            onUpdate(updates);

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
                        {section.type === 'link' && <LinkIcon size={16} />}
                        {section.type === 'download' && <FileDown size={16} />}
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
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Content</label>
                            <textarea
                                value={section.content.text}
                                onChange={(e) => onUpdate({ text: e.target.value })}
                                className="input-field min-h-[100px]"
                                placeholder="Enter text..."
                            />
                        </div>
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

                {(section.type === 'image' || section.type === 'video' || section.type === 'download') && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {section.type === 'download' ? 'File Asset' : 'Source'}
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept={section.type === 'image' ? "image/*" : section.type === 'video' ? "video/*" : "*/*"}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition text-gray-500 group"
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 size={24} className="animate-spin text-primary" />
                                            <span className="text-xs font-medium">Uploading...</span>
                                        </div>
                                    ) : section.type === 'download' && section.content.fileUrl ? (
                                        <div className="flex flex-col items-center gap-2 text-primary">
                                            <div className="p-2 bg-primary/10 rounded-full">
                                                <FileDown size={24} />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-bold text-gray-900 line-clamp-1 break-all px-4">{section.content.fileName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{section.content.fileSize || 'Ready to download'}</div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm group-hover:border-primary/20">
                                                Click to Replace
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload size={20} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-sm font-medium">Upload File (Max 50MB)</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {section.type !== 'download' && (
                                <>
                                    <button
                                        onClick={openMediaLibrary}
                                        className="w-full py-2 mt-2 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition border border-gray-200"
                                    >
                                        <Grid size={14} />
                                        Select from Library
                                    </button>
                                    <div className="text-center text-xs text-gray-400 my-2">- OR -</div>
                                    <input
                                        value={section.content.url || ''}
                                        onChange={(e) => onUpdate({ url: e.target.value })}
                                        className="input-field"
                                        placeholder="Paste URL"
                                    />
                                </>
                            )}
                        </div>

                        {section.type === 'download' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Button Configuration</label>
                                    <div>
                                        <label className="text-[10px] text-gray-400">Button Text</label>
                                        <input
                                            value={section.content.buttonText || ''}
                                            onChange={(e) => onUpdate({ buttonText: e.target.value })}
                                            className="input-field"
                                            placeholder="Download Now"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400">Button Color</label>
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
                                    <div>
                                        <label className="text-[10px] text-gray-400">File Name Label (Optional)</label>
                                        <input
                                            value={section.content.fileName || ''}
                                            onChange={(e) => onUpdate({ fileName: e.target.value })}
                                            className="input-field"
                                            placeholder="e.g. 2024 Impact Report"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

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

                {section.type === 'payment' && (
                    <div className="space-y-4">
                        {!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-6">
                                <p className="font-medium">Stripe not configured</p>
                                <p className="mt-1 text-amber-800/90">
                                    Payment pages require <code className="text-xs">VITE_STRIPE_PUBLISHABLE_KEY</code> (client)
                                    and <code className="text-xs">STRIPE_SECRET_KEY</code> (server). Both use the same GiveLive Stripe account.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Settings</label>

                                    {/* Frequencies */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] text-gray-400">Accepted Frequencies</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['one-time', 'monthly', 'yearly'].map((freq) => (
                                                <label key={freq} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer capitalize bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        checked={section.content.frequencies?.includes(freq) || false}
                                                        onChange={(e) => {
                                                            const current = section.content.frequencies || [];
                                                            const next = e.target.checked
                                                                ? [...current, freq]
                                                                : current.filter((f: string) => f !== freq);
                                                            onUpdate({ frequencies: next });
                                                        }}
                                                        className="rounded text-primary focus:ring-primary"
                                                    />
                                                    {freq}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Default Amount */}
                                    <div>
                                        <label className="text-[10px] text-gray-400">Default Amount ($)</label>
                                        <input
                                            type="number"
                                            value={section.content.defaultAmount || 50}
                                            onChange={(e) => onUpdate({ defaultAmount: parseInt(e.target.value) })}
                                            className="input-field"
                                            placeholder="50"
                                        />
                                    </div>

                                    {/* Giving Levels (Tiers) */}
                                    <div className="space-y-2 pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giving Levels</label>
                                            <button
                                                onClick={() => {
                                                    const newLevels = [...(section.content.givingLevels || [])];
                                                    newLevels.push({ amount: 25, label: 'Supporter', description: 'Helps us keep the lights on.' });
                                                    onUpdate({ givingLevels: newLevels });
                                                }}
                                                className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add Level
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {(section.content.givingLevels || []).map((level: any, idx: number) => (
                                                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2 relative group">
                                                    <button
                                                        onClick={() => {
                                                            const newLevels = section.content.givingLevels.filter((_: any, i: number) => i !== idx);
                                                            onUpdate({ givingLevels: newLevels });
                                                        }}
                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>

                                                    <div className="flex gap-2">
                                                        <div className="w-1/3">
                                                            <label className="text-[10px] text-gray-400">Amount</label>
                                                            <div className="relative">
                                                                <span className="absolute left-2 top-1.5 text-gray-400 text-xs">$</span>
                                                                <input
                                                                    type="number"
                                                                    value={level.amount}
                                                                    onChange={(e) => {
                                                                        const newLevels = [...section.content.givingLevels];
                                                                        newLevels[idx] = { ...level, amount: parseInt(e.target.value) };
                                                                        onUpdate({ givingLevels: newLevels });
                                                                    }}
                                                                    className="w-full pl-5 p-1.5 text-sm border border-gray-200 rounded outline-none focus:border-primary"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="w-2/3">
                                                            <label className="text-[10px] text-gray-400">Label</label>
                                                            <input
                                                                type="text"
                                                                value={level.label}
                                                                onChange={(e) => {
                                                                    const newLevels = [...section.content.givingLevels];
                                                                    newLevels[idx] = { ...level, label: e.target.value };
                                                                    onUpdate({ givingLevels: newLevels });
                                                                }}
                                                                className="w-full p-1.5 text-sm border border-gray-200 rounded outline-none focus:border-primary"
                                                                placeholder="e.g. Bronze"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-400">Description</label>
                                                        <textarea
                                                            value={level.description}
                                                            onChange={(e) => {
                                                                const newLevels = [...section.content.givingLevels];
                                                                newLevels[idx] = { ...level, description: e.target.value };
                                                                onUpdate({ givingLevels: newLevels });
                                                            }}
                                                            rows={2}
                                                            className="w-full p-1.5 text-sm border border-gray-200 rounded outline-none focus:border-primary resize-none"
                                                            placeholder="What does this donation provide?"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            {(section.content.givingLevels?.length === 0 || !section.content.givingLevels) && (
                                                <div className="text-xs text-gray-400 text-center py-2 italic">
                                                    No levels defined. Standard input will be shown.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Button Styling */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Button</label>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400">Text</label>
                                            <input
                                                value={section.content.buttonText || 'Donate Now'}
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

                                <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700">
                                    <p><strong>Receipts:</strong> We automatically collect the user&apos;s email during payment to send them a receipt.</p>
                                </div>

                                {/* Thank You Page Reminder */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-purple-600 text-lg">💜</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-purple-900 mb-1">Don't Forget: Thank You Page!</h4>
                                            <p className="text-xs text-purple-700 mb-3">
                                                After someone completes their donation, they need to see a confirmation.
                                                Connect a "Thank You" page after this payment page.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    // This would trigger adding a thank you page node
                                                    // For now, just show an alert
                                                    alert('To add a Thank You page:\n\n1. Click the "+" button on this Payment node\n2. Select "Page"\n3. Customize with your thank you message!\n\nTip: Include their donation details and next steps.');
                                                }}
                                                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-purple-700 transition shadow-sm"
                                            >
                                                How to Add Thank You Page
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {section.type === 'link' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuration</label>

                            {/* URL */}
                            <div>
                                <label className="text-[10px] text-gray-400">URL</label>
                                <input
                                    value={section.content.url}
                                    onChange={(e) => onUpdate({ url: e.target.value })}
                                    className="input-field"
                                    placeholder="https://"
                                />
                            </div>

                            {/* Label */}
                            <div>
                                <label className="text-[10px] text-gray-400">Label (Text)</label>
                                <input
                                    value={section.content.label}
                                    onChange={(e) => onUpdate({ label: e.target.value })}
                                    className="input-field"
                                    placeholder="Click Here"
                                />
                            </div>
                        </div>

                        {/* Style Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => onUpdate({ style: 'button' })}
                                    className={`flex-1 py-1 text-xs font-medium rounded-md transition ${section.content.style === 'button' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Button
                                </button>
                                <button
                                    onClick={() => onUpdate({ style: 'text' })}
                                    className={`flex-1 py-1 text-xs font-medium rounded-md transition ${section.content.style === 'text' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Text Link
                                </button>
                            </div>
                        </div>

                        {/* Colors based on style */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appearance</label>

                            {section.content.style === 'button' ? (
                                <div>
                                    <label className="text-[10px] text-gray-400">Button Color</label>
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
                            ) : (
                                <div>
                                    <label className="text-[10px] text-gray-400">Text Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={section.content.textColor || '#000000'}
                                            onChange={(e) => onUpdate({ textColor: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input
                                            value={section.content.textColor || '#000000'}
                                            onChange={(e) => onUpdate({ textColor: e.target.value })}
                                            className="input-field flex-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Alignment */}
                            <div className="pt-2">
                                <label className="text-[10px] text-gray-400 block mb-1">Alignment</label>
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
                        </div>
                    </div>
                )}
            </div>
            {/* Media Library Modal */}
            {
                showMediaLibrary && (
                    <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Grid size={18} /> Media Library
                            </h3>
                            <button
                                onClick={() => setShowMediaLibrary(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {loadingMedia ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <span className="text-xs">Loading files...</span>
                                </div>
                            ) : mediaFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <ImageIcon size={32} className="opacity-20" />
                                    <span className="text-sm">No files uploaded yet</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {mediaFiles
                                        .filter(f => section.type === 'video' ? f.type?.startsWith('video') : f.type?.startsWith('image'))
                                        .map((file) => (
                                            <button
                                                key={file.name}
                                                onClick={() => {
                                                    onUpdate({ url: file.url });
                                                    // Auto-detect aspect ratio for video if needed (reuse existing logic if possible, or simple close)
                                                    // Since the existing logic is inside handleFileUpload, we skip detailed detection here for now,
                                                    // or we could extract it.
                                                    setShowMediaLibrary(false);
                                                }}
                                                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary hover:ring-2 hover:ring-primary/20 transition text-left"
                                            >
                                                {file.type?.startsWith('video') ? (
                                                    <video src={file.url} className="w-full h-full object-cover" />
                                                ) : (
                                                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition">
                                                    {file.name.split('-').slice(1).join('-')}
                                                </div>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
