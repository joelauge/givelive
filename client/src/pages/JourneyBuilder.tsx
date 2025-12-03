import { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    type Edge,
    type Connection,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { Save, Plus, ArrowLeft, LayoutTemplate, Settings, Workflow, BarChart3, QrCode, Heart, MessageSquare, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

import QRCode from 'react-qr-code';

// Custom Start Node with QR Code
const StartNode = () => {
    const { eventId } = useParams();
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    const [showQr, setShowQr] = useState(false);

    return (
        <div className="relative group">
            <div className="bg-white rounded-full shadow-md border-2 border-primary/20 hover:border-primary transition-all p-2 px-4 flex items-center gap-3 min-w-[160px]">
                <button
                    onClick={() => setShowQr(!showQr)}
                    className={`p-1.5 rounded-full transition-colors ${showQr ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                >
                    <QrCode size={16} />
                </button>

                <div className="font-bold text-sm text-gray-700 select-none">Start</div>

                <div className="h-4 w-px bg-gray-200"></div>

                <a
                    href={eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-primary transition flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide"
                >
                    Link <ArrowLeft size={10} className="rotate-135" />
                </a>
            </div>

            {/* QR Popover */}
            {showQr && (
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-white p-3 rounded-xl shadow-xl border border-gray-100 z-50 w-48 flex flex-col items-center animate-in fade-in zoom-in duration-200">
                    <div className="w-full aspect-square bg-white rounded-lg overflow-hidden">
                        <QRCode
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            value={eventUrl}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2 text-center font-medium">Scan to test flow</div>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-6 !h-6 !bg-primary !border-4 !border-white !rounded-full !-bottom-3 shadow-sm flex items-center justify-center transition-transform hover:scale-110"
            >
                <Plus size={10} className="text-white stroke-[4]" />
            </Handle>
        </div>
    );
};

const initialNodes = [
    { id: '1', position: { x: 250, y: 0 }, data: { label: 'Start (QR Scan)' }, type: 'start' },
];
const initialEdges: Edge[] = [];

export default function JourneyBuilder() {
    const { eventId } = useParams();
    console.log('Event ID:', eventId);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [saving, setSaving] = useState(false);

    const nodeTypes = useMemo(() => ({ start: StartNode }), []);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

    const addNode = (type: string) => {
        const id = `${nodes.length + 1}`;
        const newNode = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: `${type} Node` },
            type: type === 'end' ? 'output' : 'default',
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const handleSave = async () => {
        setSaving(true);
        console.log('Saving flow:', { nodes, edges });
        // Here we would convert the flow to our backend format and save
        // For MVP, we just simulate a save
        setTimeout(() => {
            setSaving(false);
            alert('Journey saved!');
        }, 1000);
    };

    return (
        <div className="h-screen flex flex-col bg-background">
            <div className="bg-surface border-b border-gray-100 p-4 flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Logo size="small" />
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div>
                            <h1 className="text-lg font-bold text-primary">Journey Builder</h1>
                            <p className="text-xs text-gray-400">Editing Flow</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button onClick={() => addNode('page')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                            <Plus size={14} /> Page
                        </button>
                        <button onClick={() => addNode('sms')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                            <Plus size={14} /> SMS
                        </button>
                        <button onClick={() => addNode('donation')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                            <Plus size={14} /> Donation
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Flow'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 bg-surface border-r border-gray-100 flex flex-col p-4 gap-2 z-10 overflow-y-auto">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Menu</div>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary font-medium transition text-left">
                        <Workflow size={18} />
                        <span>Flow Editor</span>
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left">
                        <LayoutTemplate size={18} />
                        <span>Templates</span>
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left">
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Common Templates</div>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                        <div className="bg-green-100 text-green-600 p-1.5 rounded-lg group-hover:bg-green-200 transition">
                            <Heart size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Simple Donation</span>
                            <span className="text-[10px] text-gray-400">Scan → Donate → Thank You</span>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-200 transition">
                            <MessageSquare size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Feedback Survey</span>
                            <span className="text-[10px] text-gray-400">Scan → Poll → Results</span>
                        </div>
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                        <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg group-hover:bg-purple-200 transition">
                            <Ticket size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Raffle Entry</span>
                            <span className="text-[10px] text-gray-400">Scan → Form → Ticket</span>
                        </div>
                    </button>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Analytics</div>
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left">
                        <BarChart3 size={18} />
                        <span>Overview</span>
                    </button>
                </div>

                {/* Main Content (ReactFlow) */}
                <div className="flex-1 bg-gray-50/50 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gray-50"
                    >
                        <Controls className="bg-white border-gray-100 shadow-card rounded-xl overflow-hidden" />
                        <MiniMap className="bg-white border-gray-100 shadow-card rounded-xl" />
                        <Background gap={20} size={1} color="#E5E7EB" />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}
