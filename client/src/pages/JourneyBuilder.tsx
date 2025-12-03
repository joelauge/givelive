import { useState, useCallback } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    type Edge,
    type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { Save, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const initialNodes = [
    { id: '1', position: { x: 250, y: 0 }, data: { label: 'Start (QR Scan)' }, type: 'input' },
];
const initialEdges: Edge[] = [];

export default function JourneyBuilder() {
    const { eventId } = useParams();
    console.log('Event ID:', eventId); // Use eventId to silence unused warning
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [saving, setSaving] = useState(false);

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
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Flow'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-surface border-r border-gray-100 flex flex-col">
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Toolbox</h3>
                        <div className="space-y-2">
                            <button onClick={() => addNode('page')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition text-sm font-medium border border-transparent hover:border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><Plus size={16} /></div>
                                Add Page
                            </button>
                            <button onClick={() => addNode('sms')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition text-sm font-medium border border-transparent hover:border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center"><Plus size={16} /></div>
                                Add SMS
                            </button>
                            <button onClick={() => addNode('donation')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 transition text-sm font-medium border border-transparent hover:border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center"><Plus size={16} /></div>
                                Add Donation
                            </button>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Menu</h3>
                        <div className="space-y-1">
                            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition text-sm">
                                <span>📋</span> Templates
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition text-sm">
                                <span>⚙️</span> Settings
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition text-sm">
                                <span>📊</span> Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-gray-50/50 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
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
