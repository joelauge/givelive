import { X, Trash2, Copy } from 'lucide-react';
import type { Node, Edge } from 'reactflow';
import PageBuilder from './PageBuilder';
import StartNodeEditor from './StartNodeEditor';
import MessageNodeEditor from './MessageNodeEditor';
import DelayNodeEditor from './DelayNodeEditor';
import IntegrationNodeEditor from './IntegrationNodeEditor';
import { ErrorBoundary } from '../ErrorBoundary';

interface NodeEditorProps {
    node: Node | null;
    nodes: Node[];
    edges: Edge[];
    onClose: () => void;
    onUpdate: (nodeId: string, data: any) => void;
    onDelete: (nodeId: string) => void;
    onDuplicate: (nodeId: string) => void;
}

export default function NodeEditor({ node, nodes, edges, onClose, onUpdate, onDelete, onDuplicate }: NodeEditorProps) {
    if (!node) return null;

    const handleUpdate = (newData: any) => {
        onUpdate(node.id, { ...node.data, ...newData });
    };

    const isStartNode = node.type === 'start' || node.data?.type === 'start';

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
                    {!isStartNode && (
                        <button
                            onClick={() => onDuplicate(node.id)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                            title="Duplicate Node"
                        >
                            <Copy size={18} />
                        </button>
                    )}
                    {!isStartNode && (
                        <button
                            onClick={() => onDelete(node.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete Node"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
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
                    <ErrorBoundary key={node.id} componentName="StartNode">
                        <StartNodeEditor data={node.data} onUpdate={handleUpdate} />
                    </ErrorBoundary>
                ) : (node.data.type === 'page' || node.data.type === 'donation') ? (
                    <ErrorBoundary key={node.id} componentName="PageBuilder">
                        <PageBuilder data={node.data} onUpdate={handleUpdate} />
                    </ErrorBoundary>
                ) : (['fub', 'salesforce', 'hubspot', 'constant_contact', 'mailchimp', 'brevo', 'zapier', 'make', 'n8n', 'shopify', 'instagram', 'facebook', 'tiktok'].includes(node.data.type)) ? (
                    <ErrorBoundary key={node.id} componentName="IntegrationNode">
                        <IntegrationNodeEditor data={node.data} onUpdate={handleUpdate} />
                    </ErrorBoundary>
                ) : node.data.type === 'delay' ? (
                    <ErrorBoundary key={node.id} componentName="DelayNode">
                        <DelayNodeEditor data={node.data} onUpdate={handleUpdate} />
                    </ErrorBoundary>
                ) : (node.data.type === 'message' || node.data.type === 'sms' || node.data.type === 'email') ? (
                    <ErrorBoundary key={node.id} componentName="MessageNode">
                        <MessageNodeEditor data={node.data} nodeId={node.id} nodes={nodes} edges={edges} onUpdate={handleUpdate} />
                    </ErrorBoundary>
                ) : (
                    <div className="p-6 text-center text-gray-500">
                        Select a node to edit its properties.
                    </div>
                )}
            </div>
        </div >
    );
}
