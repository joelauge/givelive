import { useState, useCallback, useMemo, useEffect } from 'react';
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
    Position,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom';
import { Save, Plus, ArrowLeft, LayoutTemplate, Settings, Workflow, BarChart3, QrCode, Heart, MessageSquare, Ticket, Quote, UserPlus, Droplets, ChevronDown, ChevronRight, FolderOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

import QRCode from 'react-qr-code';
import Modal from '../components/Modal';
import NodeEditor from '../components/flow-editor/NodeEditor';

// Custom Start Node with QR Code
const StartNode = ({ id }: { id: string }) => {
    const { eventId } = useParams();
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    const [showQr, setShowQr] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const { getNodes, setNodes, setEdges, getNode } = useReactFlow();

    const handleAddNode = (type: 'page' | 'logic' | 'delay') => {
        const currentNode = getNode(id);
        if (!currentNode) return;

        if (type === 'logic') {
            alert("Logic steps are coming soon!");
            setShowAddMenu(false);
            return;
        }

        const newNodeId = `${getNodes().length + 1}`;
        let newNode;

        if (type === 'delay') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: 'Wait 1 day', type: 'delay', amount: 1, unit: 'days' },
                type: 'default',
            };
        } else {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 200 },
                data: { label: 'New Page', type: 'page' },
                type: 'default',
            };
        }

        const newEdge = {
            id: `e${id}-${newNodeId}`,
            source: id,
            target: newNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
        };

        setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat({ ...newNode, selected: true }));
        setEdges((eds) => eds.concat(newEdge));
        setShowAddMenu(false);
    };

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

            {/* Add Node Menu */}
            {showAddMenu && (
                <div className="absolute top-[calc(100%+20px)] left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col gap-1 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={() => handleAddNode('page')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                    >
                        <LayoutTemplate size={14} className="text-primary" />
                        <span>Add Page</span>
                    </button>
                    <button
                        onClick={() => handleAddNode('delay')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                    >
                        <Clock size={14} className="text-primary" />
                        <span>Add Delay</span>
                    </button>
                    <button
                        onClick={() => handleAddNode('logic')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left opacity-50 cursor-not-allowed"
                    >
                        <Workflow size={14} className="text-gray-400" />
                        <span>Add Logic</span>
                    </button>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-6 !h-6 !bg-primary !border-4 !border-white !rounded-full !-bottom-3 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-10"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent React Flow from handling the click (if it does)
                    setShowAddMenu(!showAddMenu);
                }}
            >
                <Plus size={10} className={`text-white stroke-[4] transition-transform duration-200 ${showAddMenu ? 'rotate-45' : ''}`} />
            </Handle>
        </div>
    );
    );
};

const CustomNode = ({ id, data }: { id: string, data: any }) => {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const { getNodes, setNodes, setEdges, getNode } = useReactFlow();

    const handleAddNode = (type: 'page' | 'logic' | 'delay') => {
        const currentNode = getNode(id);
        if (!currentNode) return;

        if (type === 'logic') {
            alert("Logic steps are coming soon!");
            setShowAddMenu(false);
            return;
        }

        const newNodeId = `${getNodes().length + 1}`;
        let newNode;

        if (type === 'delay') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: 'Wait 1 day', type: 'delay', amount: 1, unit: 'days' },
                type: 'default',
            };
        } else {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 200 },
                data: { label: 'New Page', type: 'page' },
                type: 'default',
            };
        }

        const newEdge = {
            id: `e${id}-${newNodeId}`,
            source: id,
            target: newNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
        };

        setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat({ ...newNode, selected: true }));
        setEdges((eds) => eds.concat(newEdge));
        setShowAddMenu(false);
    };

    // Determine icon based on type
    const getIcon = () => {
        const type = data.type || 'page';
        if (type === 'sms') return <MessageSquare size={16} className="text-blue-500" />;
        if (type === 'donation') return <Heart size={16} className="text-red-500" />;
        if (type === 'delay') return <Clock size={16} className="text-orange-500" />;
        if (type === 'message') return <MessageSquare size={16} className="text-purple-500" />;
        return <LayoutTemplate size={16} className="text-gray-500" />;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-100 min-w-[180px] p-3 hover:border-primary/50 transition-colors relative group">
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-300 !-top-1.5" />

            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                    {getIcon()}
                </div>
                <div className="font-medium text-sm text-gray-700">{data.label}</div>
            </div>

            {/* Add Node Menu */}
            {showAddMenu && (
                <div className="absolute top-[calc(100%+20px)] left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-xl shadow-xl border border-gray-100 z-50 flex flex-col gap-1 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={() => handleAddNode('page')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                    >
                        <LayoutTemplate size={14} className="text-primary" />
                        <span>Add Page</span>
                    </button>
                    <button
                        onClick={() => handleAddNode('delay')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                    >
                        <Clock size={14} className="text-primary" />
                        <span>Add Delay</span>
                    </button>
                    <button
                        onClick={() => handleAddNode('logic')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left opacity-50 cursor-not-allowed"
                    >
                        <Workflow size={14} className="text-gray-400" />
                        <span>Add Logic</span>
                    </button>
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-6 !h-6 !bg-primary !border-4 !border-white !rounded-full !-bottom-3 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-10"
                onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMenu(!showAddMenu);
                }}
            >
                <Plus size={10} className={`text-white stroke-[4] transition-transform duration-200 ${showAddMenu ? 'rotate-45' : ''}`} />
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
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', content: '' });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, templateName: '' });

    // Track unsaved changes
    useEffect(() => {
        if (nodes.length > 1 || edges.length > 0) {
            setHasUnsavedChanges(true);
        }
    }, [nodes, edges]);

    const nodeTypes = useMemo(() => ({ start: StartNode, default: CustomNode }), []);

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)), [setEdges]);

    const onSelectionChange = useCallback(({ nodes }: { nodes: any[] }) => {
        const selected = nodes[0];
        setSelectedNodeId(selected ? selected.id : null);
    }, []);

    const onNodeClick = useCallback((_: React.MouseEvent, _node: any) => {
        // We can keep this for explicit clicks, but onSelectionChange handles the main logic
        // Maybe just ensure it's selected?
    }, []);

    // Derive selected node from nodes array to ensure it's always up to date
    const selectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        const node = nodes.find(n => n.id === selectedNodeId);
        if (!node) return null;

        // Enrich with type if needed (same logic as before)
        const nodeData = node.data as any;
        const type = nodeData.type || (nodeData.label?.toLowerCase().includes('sms') ? 'sms' :
            nodeData.label?.toLowerCase().includes('donation') ? 'donation' : 'page');

        return { ...node, data: { ...node.data, type } };
    }, [nodes, selectedNodeId]);

    const updateNodeData = (nodeId: string, newData: any) => {
        setNodes((nds) => {
            const updatedNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            });

            // Check if we need to auto-create a message node
            const updatedNode = updatedNodes.find(n => n.id === nodeId);
            if (updatedNode && updatedNode.data.type === 'page' && updatedNode.data.sections) {
                const hasForm = updatedNode.data.sections.some((s: any) => s.type === 'form');

                if (hasForm) {
                    // Check if already connected to a message node
                    const connectedEdges = edges.filter(e => e.source === nodeId);
                    const hasMessageConnection = connectedEdges.some(edge => {
                        const targetNode = updatedNodes.find(n => n.id === edge.target);
                        return targetNode?.data.type === 'message';
                    });

                    if (!hasMessageConnection) {
                        // Create new message node
                        const newNodeId = `${updatedNodes.length + 1}`;
                        const newNode = {
                            id: newNodeId,
                            position: { x: updatedNode.position.x + 300, y: updatedNode.position.y },
                            data: { label: 'Send Message', type: 'message', messageType: 'both' },
                            type: 'default',
                        };

                        // Create edge
                        const newEdge = {
                            id: `e${nodeId}-${newNodeId}`,
                            source: nodeId,
                            target: newNodeId,
                            markerEnd: { type: MarkerType.ArrowClosed },
                        };

                        // We need to schedule this update to avoid state update loops if possible, 
                        // but since we are inside setNodes, we can return the new state directly?
                        // Actually setNodes expects a pure update. We can't easily access 'edges' state here reliably if it's stale.
                        // But 'edges' is in closure.

                        // Better approach: Use a useEffect or a separate handler. 
                        // But here we are inside the update function.

                        // Let's try to do it in a separate effect or just trigger it here if we can.
                        // Since we need to update both nodes and edges, we might need to do it outside.

                        // Let's defer the creation.
                        setTimeout(() => {
                            setNodes(currNodes => [...currNodes, newNode]);
                            setEdges(currEdges => [...currEdges, newEdge]);
                        }, 0);
                    }
                }
            }

            return updatedNodes;
        });
    };

    const deleteNode = (nodeId: string) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }
    };

    const addNode = (type: string) => {
        const id = `${nodes.length + 1}`;
        const newNode = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: `${type} Node`, type }, // Store type in data
            type: type === 'end' ? 'output' : 'default',
            selected: true, // Auto-select
        };
        // Deselect others and add new node
        setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(newNode));
        // selectedNodeId will be updated by onSelectionChange or we can set it here if needed,
        // but ReactFlow should trigger selection change.
    };

    const processTemplate = (templateName: string) => {
        const startNodeId = nodes.find(n => n.type === 'start')?.id || '1';
        const baseId = nodes.length + 1;
        const newNodes: any[] = [];
        const newEdges: Edge[] = [];

        switch (templateName) {
            case 'simple-donation':
                newNodes.push(
                    { id: `${baseId}`, position: { x: 250, y: 150 }, data: { label: 'Donation Page' }, type: 'default' },
                    { id: `${baseId + 1}`, position: { x: 250, y: 300 }, data: { label: 'Thank You Page' }, type: 'output' }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;
            case 'feedback-survey':
                newNodes.push(
                    { id: `${baseId}`, position: { x: 250, y: 150 }, data: { label: 'Survey Form' }, type: 'default' },
                    { id: `${baseId + 1}`, position: { x: 250, y: 300 }, data: { label: 'Results Page' }, type: 'output' }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;
            case 'raffle-entry':
                newNodes.push(
                    { id: `${baseId}`, position: { x: 250, y: 150 }, data: { label: 'Entry Form' }, type: 'default' },
                    { id: `${baseId + 1}`, position: { x: 250, y: 300 }, data: { label: 'Digital Ticket' }, type: 'output' }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;
            case 'share-testimonial':
                newNodes.push(
                    { id: `${baseId}`, position: { x: 250, y: 150 }, data: { label: 'Video/Text Upload' }, type: 'default' },
                    { id: `${baseId + 1}`, position: { x: 250, y: 300 }, data: { label: 'Confirmation' }, type: 'output' }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;
            case 'new-member':
                newNodes.push(
                    { id: `${baseId}`, position: { x: 250, y: 150 }, data: { label: 'Member Info Form' }, type: 'default' },
                    { id: `${baseId + 1}`, position: { x: 250, y: 300 }, data: { label: 'Welcome Video' }, type: 'output' }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;
            case 'get-baptised':
                newNodes.push(
                    { id: `${baseId}`, position: { x: 250, y: 150 }, data: { label: 'Baptism Info' }, type: 'default' },
                    { id: `${baseId + 1}`, position: { x: 250, y: 300 }, data: { label: 'Schedule Form' }, type: 'default' },
                    { id: `${baseId + 2}`, position: { x: 250, y: 450 }, data: { label: 'Confirmation' }, type: 'output' }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;
        }

        setNodes((nds) => [...nds, ...newNodes]);
        setEdges((eds) => [...eds, ...newEdges]);
    };

    const applyTemplate = (templateName: string) => {
        if (hasUnsavedChanges) {
            setConfirmModal({ isOpen: true, templateName });
        } else {
            processTemplate(templateName);
        }
    };

    const handleConfirmTemplate = async () => {
        // Just save directly here since we are inside the component
        setSaving(true);
        const storageKey = `givelive_flows_${eventId}`;
        const existingFlowsStr = localStorage.getItem(storageKey);
        let existingFlows = existingFlowsStr ? JSON.parse(existingFlowsStr) : [];

        // Save current state as a backup/auto-save if no name
        localStorage.setItem(`givelive_flow_${eventId}`, JSON.stringify({ nodes, edges }));

        setTimeout(() => {
            setSaving(false);
            setHasUnsavedChanges(false);
            processTemplate(confirmModal.templateName);
            setConfirmModal({ isOpen: false, templateName: '' });
        }, 500);
    };

    const handleDiscardTemplate = () => {
        processTemplate(confirmModal.templateName);
        setConfirmModal({ isOpen: false, templateName: '' });
    };

    const [saveModal, setSaveModal] = useState({ isOpen: false, flowName: '' });
    const [loadModal, setLoadModal] = useState<{ isOpen: boolean; flows: any[] }>({ isOpen: false, flows: [] });

    const handleSaveClick = () => {
        setSaveModal({ isOpen: true, flowName: '' });
    };

    const confirmSave = async () => {
        if (!saveModal.flowName.trim()) {
            alert("Please enter a flow name");
            return;
        }

        setSaving(true);

        // Get existing flows
        const storageKey = `givelive_flows_${eventId}`;
        const existingFlowsStr = localStorage.getItem(storageKey);
        let existingFlows = existingFlowsStr ? JSON.parse(existingFlowsStr) : [];

        const newFlow = {
            id: Math.random().toString(36).substr(2, 9),
            name: saveModal.flowName,
            updatedAt: new Date().toISOString(),
            nodes,
            edges
        };

        // Add new flow
        existingFlows.push(newFlow);
        localStorage.setItem(storageKey, JSON.stringify(existingFlows));

        // Also save as "current" for backward compatibility or quick resume? 
        // Maybe just rely on the list.
        // Let's also save to the old key for now to not break "current session" if any
        localStorage.setItem(`givelive_flow_${eventId}`, JSON.stringify({ nodes, edges }));

        setTimeout(() => {
            setSaving(false);
            setHasUnsavedChanges(false);
            setSaveModal({ isOpen: false, flowName: '' });
            setModal({ isOpen: true, title: 'Success', content: 'Journey saved successfully!' });
        }, 500);
    };

    const handleLoadClick = () => {
        if (hasUnsavedChanges) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to load a saved flow? Current changes will be lost.")) {
                return;
            }
        }

        const storageKey = `givelive_flows_${eventId}`;
        const existingFlowsStr = localStorage.getItem(storageKey);
        const flows = existingFlowsStr ? JSON.parse(existingFlowsStr) : [];

        if (flows.length === 0) {
            // Fallback to check old single save
            const oldSave = localStorage.getItem(`givelive_flow_${eventId}`);
            if (oldSave) {
                // Migrate old save
                const migratedFlow = {
                    id: 'legacy',
                    name: 'Auto-Saved Flow',
                    updatedAt: new Date().toISOString(),
                    ...JSON.parse(oldSave)
                };
                setLoadModal({ isOpen: true, flows: [migratedFlow] });
            } else {
                setModal({ isOpen: true, title: 'No Saved Flows', content: 'No saved flows found for this event.' });
            }
        } else {
            setLoadModal({ isOpen: true, flows });
        }
    };

    const confirmLoad = (flow: any) => {
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setHasUnsavedChanges(false);
        setLoadModal({ isOpen: false, flows: [] });
        setModal({ isOpen: true, title: 'Success', content: `Loaded flow: ${flow.name}` });
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
                        <button onClick={() => addNode('delay')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                            <Clock size={14} /> Delay
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleLoadClick}
                            className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                        >
                            <FolderOpen size={16} /> Load Flow
                        </button>
                        <button
                            onClick={handleSaveClick}
                            disabled={saving}
                            className="btn-primary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Flow'}
                        </button>
                    </div>
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

                    <button
                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left w-full"
                    >
                        <div className="flex items-center gap-3">
                            <LayoutTemplate size={18} />
                            <span>Templates</span>
                        </div>
                        {isTemplatesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {isTemplatesOpen && (
                        <div className="pl-4 flex flex-col gap-1 mb-2 animate-in slide-in-from-top-2 duration-200">
                            <button onClick={() => applyTemplate('simple-donation')} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                                <div className="bg-green-100 text-green-600 p-1.5 rounded-lg group-hover:bg-green-200 transition">
                                    <Heart size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Simple Donation</span>
                                </div>
                            </button>

                            <button onClick={() => applyTemplate('feedback-survey')} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-200 transition">
                                    <MessageSquare size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Feedback Survey</span>
                                </div>
                            </button>

                            <button onClick={() => applyTemplate('raffle-entry')} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                                <div className="bg-purple-100 text-purple-600 p-1.5 rounded-lg group-hover:bg-purple-200 transition">
                                    <Ticket size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Raffle Entry</span>
                                </div>
                            </button>

                            <button onClick={() => applyTemplate('share-testimonial')} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                                <div className="bg-orange-100 text-orange-600 p-1.5 rounded-lg group-hover:bg-orange-200 transition">
                                    <Quote size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Share Testimonial</span>
                                </div>
                            </button>

                            <button onClick={() => applyTemplate('new-member')} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                                <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg group-hover:bg-indigo-200 transition">
                                    <UserPlus size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">New Member</span>
                                </div>
                            </button>

                            <button onClick={() => applyTemplate('get-baptised')} className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group">
                                <div className="bg-cyan-100 text-cyan-600 p-1.5 rounded-lg group-hover:bg-cyan-200 transition">
                                    <Droplets size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Get Baptised</span>
                                </div>
                            </button>
                        </div>
                    )}

                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left">
                        <Settings size={18} />
                        <span>Settings</span>
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
                        onSelectionChange={onSelectionChange}
                        onNodeClick={onNodeClick} // Add click handler
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-gray-50"
                        proOptions={{ hideAttribution: true }}
                    >
                        <Controls className="bg-white border-gray-100 shadow-card rounded-xl overflow-hidden" />
                        <MiniMap className="bg-white border-gray-100 shadow-card rounded-xl" />
                        <Background gap={20} size={1} color="#E5E7EB" />
                    </ReactFlow>
                </div>
            </div>

            {/* Node Editor Drawer */}
            <NodeEditor
                node={selectedNode}
                onClose={() => setSelectedNodeId(null)}
                onUpdate={updateNodeData}
                onDelete={deleteNode}
            />

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
            >
                <div className="text-gray-600">
                    {modal.content}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setModal({ ...modal, isOpen: false })}
                        className="btn-primary py-2 px-4 text-sm"
                    >
                        Close
                    </button>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title="Unsaved Changes"
            >
                <div className="text-gray-600">
                    You have unsaved changes in your current flow. Would you like to save them before applying this template?
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={handleDiscardTemplate}
                        className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                    >
                        Continue without Saving
                    </button>
                    <button
                        onClick={handleConfirmTemplate}
                        className="btn-primary py-2 px-4 text-sm"
                    >
                        Save & Apply
                    </button>
                </div>
            </Modal>
        </div>
    );
}
