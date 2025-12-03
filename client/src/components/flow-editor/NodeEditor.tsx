import { X, Trash2 } from 'lucide-react';
import type { Node } from 'reactflow';
import PageBuilder from './PageBuilder';
import SmsEditor from './SmsEditor';
import DonationEditor from './DonationEditor';
import StartNodeEditor from './StartNodeEditor';

interface NodeEditorProps {
    node: Node | null;
    onClose: () => void;
    onUpdate: (nodeId: string, data: any) => void;
    onDelete: (nodeId: string) => void;
}

export default function NodeEditor({ node, onClose, onUpdate, onDelete }: NodeEditorProps) {
    if (!node) return null;

    const handleUpdate = (newData: any) => {
        onUpdate(node.id, { ...node.data, ...newData });
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this node?')) {
            onDelete(node.id);
            onClose();
        }
    };

    const renderEditor = () => {
        // Determine type based on node.type or node.data.label/type
        // In JourneyBuilder we used 'default' type but passed 'page', 'sms', 'donation' to addNode
        // But addNode set data.label. We might need to adjust addNode to store a specific type in data
        // For now, let's infer from label or check if we can use node.type if we update addNode

        // Let's assume we will update addNode to set data.type or use specific node types
        // For now, let's look at data.label or a new data.type field

        // Check for start node type first
        if (node.type === 'start') {
            return <StartNodeEditor data={node.data} onUpdate={handleUpdate} />;
        }

        const type = node.data.type || (node.data.label?.toLowerCase().includes('sms') ? 'sms' :
            node.data.label?.toLowerCase().includes('donation') ? 'donation' : 'page');

        switch (type) {
            case 'page':
                return <PageBuilder data={node.data} onUpdate={handleUpdate} />;
            case 'sms':
                return <SmsEditor data={node.data} onUpdate={handleUpdate} />;
            case 'donation':
                return <DonationEditor data={node.data} onUpdate={handleUpdate} />;
            default:
                return (
                    <div className="p-6 text-center text-gray-500">
                        Select a specific node type to edit.
                    </div>
                );
        }
    };

    const isStartNode = node.type === 'start';

    return (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                <div>
                    <h3 className="font-bold text-gray-900">{node.data.label || 'Edit Node'}</h3>
                    <p className="text-xs text-gray-500">ID: {node.id}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!isStartNode && (
                        <button
                            onClick={handleDelete}
                            className="p-2 hover:bg-red-100 text-red-500 rounded-full transition"
                            title="Delete Node"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {renderEditor()}
            </div>
        </div>
    );
}
