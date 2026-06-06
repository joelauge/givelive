import { RefreshCw, FileCode, FileImage, Image as ImageIcon, Grid, X, Loader2, Upload, MessageCircle, ShoppingBag, QrCode, AlertTriangle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useParams } from 'react-router-dom';
import { useRef, useMemo, useState, useEffect } from 'react';
import { API_URL } from '../../api';
import { SHOW_SOCIAL_TRIGGERS } from '../../config/features';

interface StartNodeEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

export default function StartNodeEditor({ data, onUpdate }: StartNodeEditorProps) {
    const { eventId } = useParams();
    const eventUrl = useMemo(() => {
        if (!eventId) return '';
        return `${window.location.origin}/event/${eventId}`;
    }, [eventId]);
    const qrRef = useRef<HTMLDivElement>(null);

    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<any[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);
    const [uploading, setUploading] = useState(false);

    const isSocialTrigger = SHOW_SOCIAL_TRIGGERS && data.triggerType === 'social';
    const isShopifyTrigger = SHOW_SOCIAL_TRIGGERS && data.triggerType === 'shopify';
    const isQrTrigger = !data.triggerType || data.triggerType === 'qr' || !SHOW_SOCIAL_TRIGGERS;

    // Social Verification
    const [socialStatus, setSocialStatus] = useState<any>(null);
    useEffect(() => {
        if (isSocialTrigger) {
            fetch(`${API_URL}/integrations/status`)
                .then(res => res.json())
                .then(setSocialStatus)
                .catch(err => console.error("Failed to check social status", err));
        }
    }, [isSocialTrigger]);

    const isConnected = useMemo(() => {
        if (!socialStatus) return true; // Assume true while loading or if not checking
        return socialStatus.facebook || socialStatus.instagram || socialStatus.tiktok;
    }, [socialStatus]);

    const openMediaLibrary = async () => {
        setShowMediaLibrary(true);
        setLoadingMedia(true);
        try {
            const res = await fetch(`${API_URL}/upload/list`);
            if (res.ok) {
                const responseData = await res.json();
                setMediaFiles(responseData.files || []);
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

            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadRes.ok) throw new Error('Failed to upload file to storage');

            onUpdate({ ...data, campaignImage: publicUrl });
            alert('Image uploaded successfully!');

        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const downloadSvg = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `event-${eventId}-qr.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPng = () => {
        const svg = qrRef.current?.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `event-${eventId}-qr.png`;
            link.href = pngFile;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <div className="p-6 space-y-6 relative">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                {isSocialTrigger
                    ? "This flow will start when a user interacts with your social account (DM or Comment)."
                    : isShopifyTrigger
                        ? "This flow will start when a specific event occurs in your Shopify store."
                        : "This is the entry point of your journey. Users will scan this QR code or visit the link to start the flow."}
            </div>

            {!SHOW_SOCIAL_TRIGGERS && (data.triggerType === 'social' || data.triggerType === 'shopify') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <p>
                        This flow was saved with a {data.triggerType === 'social' ? 'social' : 'Shopify'} trigger.
                        Social triggers are not available in this release — switch to <strong>QR / Link</strong> below to publish.
                    </p>
                </div>
            )}

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Flow Name</label>
                <input
                    value={data.label || 'Start'}
                    onChange={(e) => onUpdate({ ...data, label: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="Flow Name"
                />
            </div>

            {!isSocialTrigger && (
                <>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Auto-forward URL (Optional)</label>
                        <input
                            value={data.autoForwardUrl || ''}
                            onChange={(e) => onUpdate({ ...data, autoForwardUrl: e.target.value })}
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                            placeholder="https://example.com"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">If provided, visitors will be automatically redirected to this URL upon landing.</p>
                    </div>

                    {data.autoForwardUrl && (
                        <div className="p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 transition">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition">End flow here</div>
                                    <p className="text-xs text-gray-500 mt-0.5">Publish without connecting any additional nodes</p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={data.isEndNode || false}
                                        onChange={(e) => onUpdate({ ...data, isEndNode: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </div>
                            </label>
                        </div>
                    )}
                </>
            )}

            {/* Trigger Configuration */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Trigger Source</label>
                <div className={`grid gap-2 mb-4 ${SHOW_SOCIAL_TRIGGERS ? 'grid-cols-3' : 'grid-cols-1'}`}>
                    <button
                        onClick={() => onUpdate({ ...data, triggerType: 'qr' })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${isQrTrigger
                            ? 'bg-primary/5 border-primary text-primary'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                    >
                        <QrCode size={20} className="mb-1" />
                        <span className="text-[10px] font-bold">QR / Link</span>
                    </button>
                    {SHOW_SOCIAL_TRIGGERS && (
                        <>
                            <button
                                onClick={() => onUpdate({ ...data, triggerType: 'social' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${data.triggerType === 'social'
                                    ? 'bg-primary/5 border-primary text-primary'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <MessageCircle size={20} className="mb-1" />
                                <span className="text-[10px] font-bold">Social</span>
                            </button>
                            <button
                                onClick={() => onUpdate({ ...data, triggerType: 'shopify' })}
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${data.triggerType === 'shopify'
                                    ? 'bg-primary/5 border-primary text-primary'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <ShoppingBag size={20} className="mb-1" />
                                <span className="text-[10px] font-bold">Shopify</span>
                            </button>
                        </>
                    )}
                </div>

                {isSocialTrigger && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Social Platform</label>
                            <select
                                value={(data.triggerConfig?.platform) || 'instagram'}
                                onChange={(e) => onUpdate({
                                    ...data,
                                    triggerConfig: { ...data.triggerConfig, platform: e.target.value }
                                })}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium"
                            >
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Trigger Event</label>
                            <select
                                value={(data.triggerConfig?.event) || 'dm'}
                                onChange={(e) => onUpdate({
                                    ...data,
                                    triggerConfig: { ...data.triggerConfig, event: e.target.value }
                                })}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none bg-white font-medium"
                            >
                                <option value="dm">Direct Message Received</option>
                                <option value="comment">Comment on Post</option>
                                <option value="mention">Story Mention (Coming Soon)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Trigger Keyword</label>
                            <div className="relative">
                                <input
                                    value={(data.triggerConfig?.keyword) || ''}
                                    onChange={(e) => onUpdate({
                                        ...data,
                                        triggerConfig: { ...data.triggerConfig, keyword: e.target.value.toUpperCase() }
                                    })}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none pr-12 focus:border-primary transition font-mono"
                                    placeholder="e.g. 'LIVE'"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    OPTIONAL
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {data.triggerConfig?.event === 'comment'
                                    ? "Only users who comment this specific keyword will trigger the flow."
                                    : "Only messages containing this keyword will trigger the flow."}
                            </p>
                        </div>

                        {!isConnected && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-800">No Account Connected</p>
                                    <p className="text-[10px] text-amber-700 mt-0.5">
                                        You haven't connected a social account. You won't be able to publish this flow until you connect an account in Settings.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isShopifyTrigger && (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="text-xs text-gray-500 italic">
                            This flow will start when a Shopify webhook fires (e.g. Order Created).
                        </div>
                    </div>
                )}

            </div>

            {isQrTrigger && (
                <>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                            Campaign Image (Link Preview)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            This image appears when sharing links in SMS, iMessage, and social media. Recommended: 1200x630px
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={openMediaLibrary}
                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
                            >
                                <Grid size={16} />
                                Media Library
                            </button>
                            <label className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium cursor-pointer flex items-center justify-center gap-2">
                                <Upload size={16} />
                                {uploading ? 'Uploading...' : 'Upload New'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        {data.campaignImage && (
                            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                                <img
                                    src={data.campaignImage}
                                    alt="Campaign preview"
                                    className="w-full h-40 object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <button
                                    onClick={() => onUpdate({ ...data, campaignImage: '' })}
                                    className="w-full p-2 text-xs text-red-600 hover:bg-red-50 transition"
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-gray-900">Unique Flow URL</h4>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono truncate">
                                {eventUrl}
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(eventUrl);
                                    alert('URL copied to clipboard!');
                                }}
                                className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition"
                                title="Copy URL"
                            >
                                <FileCode size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-gray-900">QR Code Assets</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={downloadSvg}
                                className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-sm transition group gap-2"
                            >
                                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition">
                                    <FileCode size={20} />
                                </div>
                                <span className="text-xs font-medium text-gray-700">Download SVG</span>
                            </button>

                            <button
                                onClick={downloadPng}
                                className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-sm transition group gap-2"
                            >
                                <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition">
                                    <FileImage size={20} />
                                </div>
                                <span className="text-xs font-medium text-gray-700">Download PNG</span>
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                if (window.confirm('Are you sure? This will invalidate the old QR code.')) {
                                    alert('New QR Code generated!');
                                }
                            }}
                            className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} />
                            Request New QR Code
                        </button>
                    </div>

                    <div className="flex justify-center mt-8">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100" ref={qrRef}>
                            <QRCode
                                size={200}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={eventUrl}
                                viewBox={`0 0 256 256`}
                            />
                            <p className="text-center text-xs text-gray-400 mt-2">Preview</p>
                        </div>
                    </div>
                </>
            )}

            {/* Media Library Modal */}
            {showMediaLibrary && (
                <div className="absolute inset-0 z-50 bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200 rounded-xl">
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
                                    .filter(f => f.type?.startsWith('image'))
                                    .map((file) => (
                                        <button
                                            key={file.name}
                                            onClick={() => {
                                                onUpdate({ ...data, campaignImage: file.url });
                                                setShowMediaLibrary(false);
                                            }}
                                            className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary hover:ring-2 hover:ring-primary/20 transition"
                                        >
                                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition">
                                                {file.name.split('-').slice(1).join('-')}
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
