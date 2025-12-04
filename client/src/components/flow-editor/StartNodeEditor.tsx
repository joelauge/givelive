import { QrCode, RefreshCw, Palette } from 'lucide-react';

interface StartNodeEditorProps {
    data: any;
    onUpdate: (data: any) => void;
}

export default function StartNodeEditor({ data, onUpdate }: StartNodeEditorProps) {
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
                <h4 className="font-bold text-gray-900">QR Code Actions</h4>

                <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-sm transition group">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition">
                            <RefreshCw size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-700">Regenerate QR Code</div>
                            <div className="text-xs text-gray-500">Get a new code for this flow</div>
                        </div>
                    </div>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-primary hover:shadow-sm transition group">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition">
                            <Palette size={20} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-gray-700">Customize Design</div>
                            <div className="text-xs text-gray-500">Change colors and style</div>
                        </div>
                    </div>
                </button>
            </div>

            <div className="flex justify-center mt-8">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                    <QrCode size={200} className="opacity-20" />
                    <p className="text-center text-xs text-gray-400 mt-2">Preview</p>
                </div>
            </div>
        </div>
    );
}
