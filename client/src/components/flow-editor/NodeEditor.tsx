import { X, Trash2 } from 'lucide-react';
import type { Node } from 'reactflow';
import PageBuilder from './PageBuilder';
import StartNodeEditor from './StartNodeEditor';
import MessageNodeEditor from './MessageNodeEditor';
import DelayNodeEditor from './DelayNodeEditor';

interface NodeEditorProps {
    node: Node | null;
    nodes: Node[];
    onClose: () => void;
    onUpdate: (nodeId: string, data: any) => void;
    onDelete: (nodeId: string) => void;
}

export default function NodeEditor({ node, nodes, onClose, onUpdate, onDelete }: NodeEditorProps) {
    if (!node) return null;

    const handleUpdate = (newData: any) => {
        onUpdate(node.id, { ...node.data, ...newData });
    };

    // const handleDelete = () => {
    //     if (window.confirm('Are you sure you want to delete this node?')) {
    //         onDelete(node.id);
    //         onClose();
    //     }
    // };

    // const renderEditor = () => {
    //     // ...
    // };

    // const isStartNode = node.type === 'start';

    return (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl border-l border-gray-100 z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="font-bold text-gray-900">
                        {node.data.label}
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        {node.data.type}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onDelete(node.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Node"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {(node.type === 'start' || node.data.type === 'start') ? (
                    <StartNodeEditor data={node.data} onUpdate={handleUpdate} />
                ) : (node.data.type === 'page' || node.data.type === 'donation') ? (
                    <PageBuilder data={node.data} onUpdate={handleUpdate} />
                ) : (node.data.type === 'message' || node.data.type === 'sms' || node.data.type === 'email') ? (
                    <MessageNodeEditor data={node.data} nodes={nodes} onUpdate={handleUpdate} />
                ) : node.data.type === 'delay' ? (
                    <DelayNodeEditor data={node.data} onUpdate={handleUpdate} />
                ) : (
                    <div className="p-6 text-center text-gray-500">
                        Select a node to edit its properties.
                    </div>
                )}
            </div>
        </div>
    );
}
