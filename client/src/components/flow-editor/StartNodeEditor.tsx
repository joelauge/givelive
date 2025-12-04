import { RefreshCw, FileCode, FileImage } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useParams } from 'react-router-dom';
import { useRef } from 'react';

interface StartNodeEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

export default function StartNodeEditor({ data, onUpdate }: StartNodeEditorProps) {
    const { eventId } = useParams();
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    const qrRef = useRef<HTMLDivElement>(null);

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
        <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                This is the entry point of your journey. Users will scan this QR code to start the flow.
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Flow Name</label>
                <input
                    value={data.label || 'Start'}
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                    placeholder="Flow Name"
                />
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
                            // In a real app, this would call an API to rotate the ID
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
        </div>
    );
}
