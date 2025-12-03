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
        <div className="h-screen flex flex-col">
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <Link to="/admin" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold">Journey Builder</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => addNode('page')} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-2">
                        <Plus size={16} /> Page
                    </button>
                    <button onClick={() => addNode('sms')} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-2">
                        <Plus size={16} /> SMS
                    </button>
                    <button onClick={() => addNode('donation')} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-2">
                        <Plus size={16} /> Donation
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Flow'}
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <Controls />
                    <MiniMap />
                    <Background gap={12} size={1} />
                </ReactFlow>
            </div>
        </div>
    );
}
