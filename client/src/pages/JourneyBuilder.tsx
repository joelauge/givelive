import { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
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
    type Node,
    Handle,
    Position,
    useReactFlow,
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Plus, ArrowLeft, LayoutTemplate, Settings, Workflow, BarChart3, QrCode, Heart, MessageSquare, ChevronDown, ChevronRight, Clock, CreditCard, Mail, GitBranch, Trash2, Search, X, Edit, Check, Copy, Users, Zap, Activity, Terminal, ShoppingBag, MessageCircle, Instagram, Facebook, Video, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

import QRCode from 'react-qr-code';
import Modal from '../components/Modal';
import NodeEditor from '../components/flow-editor/NodeEditor';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { SHOW_SOCIAL_TRIGGERS } from '../config/features';
import { validatePublishFlow } from '@givelive/journey-validation';
import { Undo, Globe, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { api, API_URL } from '../api';
import { templates, categories, getTemplatesByCategory, getCategoryCount } from '../data/templateLibrary';
import { buildDefaultTemplateFlow } from '../data/templateFlows';
import AIBuilder from '../components/flow-editor/AIBuilder';
import UpgradeModal from '../components/UpgradeModal';
import type { PlanId } from '../data/pricingPlans';
import { getCampaignLimit } from '../lib/billingLimits';
import { shouldShowWatermarkForPlan } from '../lib/watermark';

// Create a context to share functionality with nodes
interface JourneyContextType {
    duplicateNode: (nodeId: string) => void;
}
const JourneyContext = createContext<JourneyContextType | null>(null);

const useJourney = () => {
    const context = useContext(JourneyContext);
    // If used outside provider, return dummy implementation or null
    // This prevents crash if CustomNode is rendered in isolation (like preview)
    if (!context) return { duplicateNode: () => console.warn('duplicateNode not available') };
    return context;
};

interface NodeData {
    label: string;
    type: string;
    sections?: any[];
    amount?: number;
    unit?: string;
    messageType?: string;
    smsMessage?: string;
    [key: string]: any;
}

const MESSAGE_NODE_TYPES = new Set(['message', 'sms', 'email']);

function isMessageNode(node: Node<NodeData>): boolean {
    const type = (node.data?.type || '').toLowerCase();
    if (MESSAGE_NODE_TYPES.has(type)) return true;
    const label = (node.data?.label || '').toLowerCase();
    return label.includes('send message') || label.includes('sms') || label === 'email';
}

function flowHasMessageNode(nodes: Node<NodeData>[]): boolean {
    return nodes.some(isMessageNode);
}

function hasDownstreamMessageNode(
    startNodeId: string,
    nodes: Node<NodeData>[],
    edges: Edge[]
): boolean {
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    const queue = [startNodeId];

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const node = nodeById.get(currentId);
        if (node && currentId !== startNodeId && isMessageNode(node)) {
            return true;
        }

        for (const edge of edges) {
            if (edge.source === currentId && !visited.has(edge.target)) {
                queue.push(edge.target);
            }
        }
    }
    return false;
}

interface SavedFlow {
    id: string;
    name: string;
    updatedAt: string;
    nodes: Node<NodeData>[];
    edges: Edge[];
}

// Custom Edge with Delete Button
const DeletableEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected }: EdgeProps) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const onEdgeDelete = () => {
        setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            {selected && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <button
                            onClick={onEdgeDelete}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 border-2 border-white"
                            title="Delete connection"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};


// Custom Start Node with QR Code
const StartNode = ({ id, data }: { id: string, data: any }) => {
    const { eventId } = useParams();
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    const [showQr, setShowQr] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showIntegrations, setShowIntegrations] = useState(false);
    const { setNodes, setEdges, getNode, getEdges } = useReactFlow();

    const handleAddNode = (type: 'page' | 'payment' | 'logic' | 'delay' | 'message' | 'fub' | 'salesforce' | 'hubspot' | 'constant_contact' | 'mailchimp' | 'brevo' | 'zapier' | 'make' | 'n8n') => {
        const currentNode = getNode(id);
        if (!currentNode) return;

        // Check if already has a child connection
        const edges = getEdges();
        const hasExistingChild = edges.some(edge => edge.source === id);

        // Prevent adding if already has a child (Start node never has branches)
        if (hasExistingChild) {
            alert("This node already has a connection. Remove the existing connection first to add a different node.");
            setShowAddMenu(false);
            return;
        }

        if (type === 'logic') {
            alert("Logic steps are coming soon!");
            setShowAddMenu(false);
            return;
        }

        const newNodeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `node_${Date.now()}`;
        let newNode: any;

        const isIntegration = ['fub', 'salesforce', 'hubspot', 'constant_contact', 'mailchimp', 'brevo', 'zapier', 'make', 'n8n'].includes(type);

        if (type === 'message') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: 'Send Message', type: 'message', message: '' },
                type: 'default',
            };
        } else if (type === 'delay') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: 'Wait 1 day', type: 'delay', amount: 1, unit: 'days' },
                type: 'default',
            };
        } else if (type === 'payment') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 200 },
                data: {
                    label: 'Payment Page',
                    type: 'donation',
                    sections: [
                        { id: 's1', type: 'header', content: { title: 'Support Our Cause', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                        {
                            id: 's2',
                            type: 'payment',
                            content: {
                                frequencies: ['one-time', 'monthly'],
                                defaultAmount: 50,
                                buttonText: 'Donate Now',
                                buttonColor: '#000000',
                                fields: ['name', 'email', 'phone'] // Ensure collection fields are there
                            }
                        }
                    ]
                },
                type: 'default',
            };
        } else if (isIntegration) {
            const labels: any = { fub: 'Follow Up Boss', salesforce: 'Salesforce', hubspot: 'HubSpot', constant_contact: 'Constant Contact', mailchimp: 'Mailchimp', brevo: 'Brevo', zapier: 'Zapier', make: 'Make.com', n8n: 'n8n' };
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: labels[type], type: type, config: {} },
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

    const isSocial = SHOW_SOCIAL_TRIGGERS && data?.triggerType === 'social';

    return (
        <div className="relative group">
            <div className="bg-white rounded-full shadow-md border-2 border-primary/20 hover:border-primary transition-all p-2 px-4 flex items-center gap-3 min-w-[160px]">
                <button
                    onClick={() => !isSocial && setShowQr(!showQr)}
                    className={`p-1.5 rounded-full transition-colors ${showQr ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'} ${isSocial ? 'cursor-default' : 'cursor-pointer'}`}
                >
                    {SHOW_SOCIAL_TRIGGERS && data?.triggerType === 'shopify' ? (
                        <ShoppingBag size={16} />
                    ) : SHOW_SOCIAL_TRIGGERS && data?.triggerType === 'social' ? (
                        data?.triggerConfig?.platform === 'facebook' ? <Facebook size={16} /> :
                            data?.triggerConfig?.platform === 'tiktok' ? <Video size={16} /> : // Lucide doesn't have TikTok, using Video as placeholder or fallback
                                data?.triggerConfig?.platform === 'instagram' ? <Instagram size={16} /> :
                                    <MessageCircle size={16} />
                    ) : (
                        <QrCode size={16} />
                    )}
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
            {showQr && !isSocial && (
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
                <div className="absolute top-[calc(100%+20px)] left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-xl shadow-xl border border-gray-100 z-[200] flex flex-col gap-1 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    {isSocial ? (
                        <>
                            <button
                                onClick={() => handleAddNode('message')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                            >
                                <MessageSquare size={14} className="text-green-500" />
                                <span>Send Message</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('delay')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                            >
                                <Clock size={14} className="text-primary" />
                                <span>Add Delay</span>
                            </button>
                        </>
                    ) : (
                        <>
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
                                onClick={() => handleAddNode('payment')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left"
                            >
                                <CreditCard size={14} className="text-primary" />
                                <span>Add Payment Page</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('logic')}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left opacity-50 cursor-not-allowed"
                            >
                                <GitBranch size={14} className="text-gray-400" />
                                <span>Add Logic</span>
                            </button>
                        </>
                    )}

                    <div className="h-px bg-gray-100 my-1"></div>
                    <button
                        onClick={() => setShowIntegrations(!showIntegrations)}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left w-full"
                    >
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-orange-500" />
                            <span>Integrations</span>
                        </div>
                        <ChevronRight size={14} className={`text-gray-400 transition-transform ${showIntegrations ? 'rotate-90' : ''}`} />
                    </button>

                    {showIntegrations && (
                        <div className="pl-4 flex flex-col gap-1 border-l-2 border-orange-100 ml-5 py-1">
                            <button
                                onClick={() => handleAddNode('fub')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Users size={12} className="text-orange-400" />
                                <span>Follow Up Boss</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('hubspot')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Users size={12} className="text-orange-400" />
                                <span>HubSpot</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('salesforce')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Users size={12} className="text-orange-400" />
                                <span>Salesforce</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('mailchimp')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Mail size={12} className="text-orange-400" />
                                <span>Mailchimp</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('brevo')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Mail size={12} className="text-orange-400" />
                                <span>Brevo</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('zapier')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Zap size={12} className="text-orange-500" />
                                <span>Zapier</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('make')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Activity size={12} className="text-indigo-600" />
                                <span>Make.com</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('n8n')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Terminal size={12} className="text-gray-900" />
                                <span>n8n</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('constant_contact')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Mail size={12} className="text-orange-400" />
                                <span>Constant Contact</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Always show handle for drag-to-connect, but conditionally show + button */}
            <Handle
                type="source"
                position={Position.Bottom}
                className={`!w-6 !h-6 !bg-primary !border-4 !border-white !rounded-full !bottom-0 !translate-y-1/2 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-[100] ${getEdges().some(edge => edge.source === id) ? '!opacity-30 !cursor-not-allowed' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    const hasChild = getEdges().some(edge => edge.source === id);
                    if (!hasChild) {
                        setShowAddMenu(!showAddMenu);
                    }
                }}
            >
                {!getEdges().some(edge => edge.source === id) && (
                    <Plus size={10} className={`text-white stroke-[4] transition-transform duration-200 ${showAddMenu ? 'rotate-45' : ''}`} />
                )}
            </Handle>
        </div>
    );
};

const CustomNode = ({ id, data }: { id: string, data: NodeData }) => {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showIntegrations, setShowIntegrations] = useState(false);
    const { setNodes, setEdges, getNode, getEdges } = useReactFlow();
    const { duplicateNode } = useJourney();

    const handleAddNode = (type: 'page' | 'payment' | 'logic' | 'delay' | 'fub' | 'salesforce' | 'hubspot' | 'constant_contact' | 'mailchimp' | 'brevo' | 'zapier' | 'make' | 'n8n', sourceHandleId?: string) => {
        const currentNode = getNode(id);
        if (!currentNode) return;

        // Get current edges
        const edges = getEdges();

        // Check if this specific handle already has a connection
        const handleId = sourceHandleId || null;
        const hasExistingConnection = edges.some(edge =>
            edge.source === id && (handleId ? edge.sourceHandle === handleId : !edge.sourceHandle)
        );

        if (hasExistingConnection) {
            alert("This output already has a connection. Remove the existing connection first to add a different node.");
            setShowAddMenu(false);
            return;
        }

        if (type === 'logic') {
            alert("Logic steps are coming soon!");
            setShowAddMenu(false);
            return;
        }

        const newNodeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `node_${Date.now()}`;
        let newNode: any;

        const isIntegration = ['fub', 'salesforce', 'hubspot', 'constant_contact', 'mailchimp', 'brevo', 'zapier', 'make', 'n8n'].includes(type);

        if (type === 'delay') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: 'Wait 1 day', type: 'delay', amount: 1, unit: 'days' },
                type: 'default',
            };
        } else if (type === 'payment') {
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 200 },
                data: {
                    label: 'Payment Page',
                    type: 'donation',
                    sections: [
                        { id: 's1', type: 'header', content: { title: 'Support Our Cause', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                        {
                            id: 's2',
                            type: 'payment',
                            content: {
                                frequencies: ['one-time', 'monthly'],
                                defaultAmount: 50,
                                buttonText: 'Donate Now',
                                buttonColor: '#000000'
                            }
                        }
                    ]
                },
                type: 'default',
            };
        } else if (isIntegration) {
            const labels: any = { fub: 'Follow Up Boss', salesforce: 'Salesforce', hubspot: 'HubSpot', constant_contact: 'Constant Contact', mailchimp: 'Mailchimp', brevo: 'Brevo', zapier: 'Zapier', make: 'Make.com', n8n: 'n8n' };
            newNode = {
                id: newNodeId,
                position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
                data: { label: labels[type], type: type, config: {} },
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
            sourceHandle: handleId,
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
        if (type === 'sms') return <MessageSquare size={16} className="text-green-600" />;
        if (type === 'email') return <Mail size={16} className="text-green-600" />;
        if (type === 'donation') return <Heart size={16} className="text-blue-600" />;
        if (type === 'delay') return <Clock size={16} className="text-purple-600" />;
        if (type === 'condition') return <GitBranch size={16} className="text-purple-600" />;
        if (type === 'message') return <MessageSquare size={16} className="text-green-600" />;
        if (type === 'page') return <LayoutTemplate size={16} className="text-blue-600" />;
        if (['fub', 'salesforce', 'hubspot'].includes(type)) return <Users size={16} className="text-orange-600" />;
        if (['constant_contact', 'mailchimp', 'brevo'].includes(type)) return <Mail size={16} className="text-orange-600" />;
        if (type === 'zapier') return <Zap size={16} className="text-orange-500" />;
        if (type === 'make') return <Activity size={16} className="text-indigo-600" />;
        if (type === 'n8n') return <Terminal size={16} className="text-gray-900" />;
        return <LayoutTemplate size={16} className="text-gray-500" />;
    };

    // Get node category color
    const getNodeColor = () => {
        const type = data.type || 'page';
        // Inbound nodes (blue)
        if (['page', 'donation'].includes(type)) return 'border-blue-200 hover:border-blue-400';
        // Outbound nodes (green)
        if (['sms', 'email'].includes(type)) return 'border-green-200 hover:border-green-400';
        // Instruction nodes (purple)
        if (['delay', 'condition', 'start'].includes(type)) return 'border-purple-200 hover:border-purple-400';
        // Integration nodes (orange)
        if (['fub', 'salesforce', 'hubspot', 'constant_contact', 'mailchimp', 'brevo', 'zapier', 'make', 'n8n'].includes(type)) return 'border-orange-200 hover:border-orange-400';
        return 'border-gray-100 hover:border-primary/50';
    };

    // Unified branches logic
    const branches: any[] = [];

    // Check for choice section
    const choiceSection = data.sections?.find((s: any) => s.type === 'choice');
    if (choiceSection?.content?.choices) {
        choiceSection.content.choices.forEach((c: any) => {
            branches.push({ id: c.label, label: c.label, type: 'choice' });
        });
    }

    // Check for message branches
    if (data.expectedResponses) {
        data.expectedResponses.forEach((r: any) => {
            branches.push({
                id: `response-${r.trigger}`,
                label: r.value,
                subLabel: r.trigger,
                type: 'response'
            });
        });
    }

    // Check existing connections for default handle
    const edges = getEdges();
    const hasDefaultConnection = branches.length === 0 && edges.some(edge =>
        edge.source === id && !edge.sourceHandle
    );

    return (
        <div className={`bg-white rounded-xl shadow-sm border-2 ${getNodeColor()} min-w-[180px] p-3 transition-colors relative group`}>
            {/* Input Handle */}
            <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-300 !-top-1.5" />

            {/* Main Content */}
            {/* Duplicate Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    duplicateNode(id);
                }}
                className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-blue-500 shadow-sm border border-gray-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:border-blue-200"
                title="Duplicate Node"
            >
                <Copy size={12} />
            </button>

            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-700 truncate">{data.label}</div>
                    {data.isEndNode && (
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold">
                            <span>✓</span>
                            <span>END</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Branch Options (If Any) */}
            {branches.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100 flex justify-center gap-4">
                    {branches.map((branch: any, idx: number) => {
                        // Check if this specific branch already has a connection
                        const branchHasConnection = edges.some(edge =>
                            edge.source === id && edge.sourceHandle === branch.id
                        );

                        return (
                            <div key={idx} className="relative flex flex-col items-center group/branch">
                                <div className="text-[10px] font-bold text-gray-500 text-center leading-tight">
                                    {branch.label}
                                    {branch.subLabel && <span className="block text-[8px] text-gray-300 font-normal">({branch.subLabel})</span>}
                                </div>

                                {/* Branch Handle - always render for drag-to-connect */}
                                <Handle
                                    type="source"
                                    position={Position.Bottom}
                                    id={branch.id}
                                    className={`!w-5 !h-5 !border-2 !border-white !rounded-full !absolute !bottom-0 !translate-y-1/2 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-[100] ${branch.type === 'response' ? '!bg-purple-600' : '!bg-primary'} ${branchHasConnection ? '!opacity-30 !cursor-not-allowed' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!branchHasConnection) {
                                            handleAddNode('page', branch.id);
                                        }
                                    }}
                                >
                                    {!branchHasConnection && (
                                        branch.type === 'response' ? (
                                            <GitBranch size={8} className="text-white" />
                                        ) : (
                                            <Plus size={8} className="text-white" />
                                        )
                                    )}
                                </Handle>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Default Handle (If No Branches) - always render for drag-to-connect */}
            {branches.length === 0 && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className={`!w-6 !h-6 !bg-primary !border-4 !border-white !rounded-full !bottom-0 !translate-y-1/2 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-[100] ${hasDefaultConnection ? '!opacity-30 !cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!hasDefaultConnection) {
                            setShowAddMenu(!showAddMenu);
                        }
                    }}
                >
                    {!hasDefaultConnection && (
                        <Plus size={10} className={`text-white stroke-[4] transition-transform duration-200 ${showAddMenu ? 'rotate-45' : ''}`} />
                    )}
                </Handle>
            )}

            {/* Add Node Menu (Shared) */}
            {showAddMenu && (
                <div className="absolute top-[calc(100%+20px)] left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-xl shadow-xl border border-gray-100 z-[200] flex flex-col gap-1 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    <button onClick={() => handleAddNode('page')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left">
                        <LayoutTemplate size={14} className="text-primary" /> <span>Add Page</span>
                    </button>
                    <button onClick={() => handleAddNode('delay')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left">
                        <Clock size={14} className="text-primary" /> <span>Add Delay</span>
                    </button>
                    <button onClick={() => handleAddNode('payment')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left">
                        <CreditCard size={14} className="text-primary" /> <span>Add Payment Page</span>
                    </button>
                    <button onClick={() => handleAddNode('logic')} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left opacity-50 cursor-not-allowed">
                        <Workflow size={14} className="text-gray-400" /> <span>Add Logic</span>
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <button
                        onClick={() => setShowIntegrations(!showIntegrations)}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition text-left w-full"
                    >
                        <div className="flex items-center gap-2">
                            <Users size={14} className="text-orange-500" />
                            <span>Integrations</span>
                        </div>
                        <ChevronRight size={14} className={`text-gray-400 transition-transform ${showIntegrations ? 'rotate-90' : ''}`} />
                    </button>

                    {showIntegrations && (
                        <div className="pl-4 flex flex-col gap-1 border-l-2 border-orange-100 ml-5 py-1">
                            <button
                                onClick={() => handleAddNode('fub')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Users size={12} className="text-orange-400" />
                                <span>Follow Up Boss</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('hubspot')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Users size={12} className="text-orange-400" />
                                <span>HubSpot</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('salesforce')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Users size={12} className="text-orange-400" />
                                <span>Salesforce</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('mailchimp')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Mail size={12} className="text-orange-400" />
                                <span>Mailchimp</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('brevo')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Mail size={12} className="text-orange-400" />
                                <span>Brevo</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('zapier')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Zap size={12} className="text-orange-500" />
                                <span>Zapier</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('make')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Activity size={12} className="text-indigo-600" />
                                <span>Make.com</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('n8n')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Terminal size={12} className="text-gray-900" />
                                <span>n8n</span>
                            </button>
                            <button
                                onClick={() => handleAddNode('constant_contact')}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-xs text-gray-600 font-medium transition text-left"
                            >
                                <Mail size={12} className="text-orange-400" />
                                <span>Constant Contact</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const initialNodes: Node<NodeData>[] = [
    { id: 'start', position: { x: 250, y: 0 }, data: { label: 'Start Trigger', type: 'start' }, type: 'start' },
];
const initialEdges: Edge[] = [];

export default function JourneyBuilder({ previewMode = false, templateId: propTemplateId }: { previewMode?: boolean; templateId?: string }) {
    const { user } = useUser();
    const { eventId, templateId: paramTemplateId } = useParams();
    const templateId = propTemplateId || paramTemplateId;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [isPublished, setIsPublished] = useState(false);
    const [planId, setPlanId] = useState<PlanId>('free');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const [isDeleteFlowModalOpen, setIsDeleteFlowModalOpen] = useState(false);

    const [titleToast, setTitleToast] = useState<{ show: boolean, title: string, subtitle: string } | null>(null);
    const [isAIBuilderOpen, setIsAIBuilderOpen] = useState(false);

    const handleAIGenerate = async (prompt: string) => {
        try {
            const response = await fetch(`${API_URL}/journey/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) throw new Error('Failed to generate journey');

            const data = await response.json();

            if (data.nodes && data.edges) {
                // Sanitize nodes to ensure they have all required ReactFlow properties
                const sanitizedNodes = data.nodes.map((node: any, index: number) => ({
                    id: node.id || `ai_node_${index}_${Date.now()}`,
                    type: node.id === 'start' || node.type === 'start' ? 'start' : 'default',
                    position: {
                        x: typeof node.position?.x === 'number' ? node.position.x : 250,
                        y: typeof node.position?.y === 'number' ? node.position.y : index * 200
                    },
                    data: {
                        ...node.data,
                        label: node.data?.label || 'New Node',
                        type: (() => {
                            const rawType = node.data?.type || 'page';
                            const label = (node.data?.label || '').toLowerCase();

                            // Force-sanitize integration nodes if AI gets confused
                            if (label.includes('hubspot')) return 'hubspot';
                            if (label.includes('follow up boss') || label.includes('fub')) return 'fub';
                            if (label.includes('salesforce')) return 'salesforce';
                            if (label.includes('mailchimp')) return 'mailchimp';
                            if (label.includes('constant contact')) return 'constant_contact';

                            return rawType;
                        })()
                    }
                }));

                // Sanitize edges
                const sanitizedEdges = data.edges
                    .filter((edge: any) => edge.source && edge.target)
                    .map((edge: any, index: number) => ({
                        id: edge.id || `ai_edge_${index}_${Date.now()}`,
                        source: edge.source,
                        target: edge.target,
                        sourceHandle: edge.sourceHandle || null,
                        markerEnd: { type: MarkerType.ArrowClosed }
                    }));

                // Ensure the start node is preserved and correctly typed
                const startNodeIndex = sanitizedNodes.findIndex((n: any) => n.id === 'start');
                if (startNodeIndex === -1) {
                    const currentStart = nodes.find(n => n.id === 'start');
                    if (currentStart) {
                        sanitizedNodes.unshift(currentStart);
                    } else {
                        sanitizedNodes.unshift({
                            id: 'start',
                            type: 'start',
                            position: { x: 250, y: 0 },
                            data: { label: 'Start (QR Scan)', type: 'start' }
                        });
                    }
                } else {
                    // Force start node type
                    sanitizedNodes[startNodeIndex].type = 'start';
                    sanitizedNodes[startNodeIndex].data.type = 'start';
                }

                setNodes(sanitizedNodes);
                setEdges(sanitizedEdges);
                setHasUnsavedChanges(true);

                setModal({
                    isOpen: true,
                    title: '✨ Magic Complete!',
                    content: 'Your AI journey has been generated. Take a look and feel free to adjust it!'
                });
            }
        } catch (err: any) {
            console.error(err);
            throw err;
        }
    };

    // Load flow logic
    useEffect(() => {
        const loadFlow = async () => {
            // Preview Mode Logic
            if (previewMode) {
                if (templateId) {
                    processTemplate(templateId);
                    setIsTemplatesOpen(false); // Hide template picker in preview
                }
                return;
            }

            if (!eventId) return;

            // Authenticated Logic
            try {
                // Check for 'new' param to show toast
                const isNew = searchParams.get('new') === 'true';
                const templateParam = searchParams.get('template');

                if (isNew && templateParam) {
                    const templateName = templates.find(t => t.id === templateParam)?.name || 'Template';
                    setTitleToast({
                        show: true,
                        title: `You're editing the ${templateName} flow`,
                        subtitle: "You'll be able to make any modifications. Publish the flow to put it live immediately."
                    });
                    // Clear the 'new' param from URL without reload
                    window.history.replaceState({}, '', window.location.pathname + window.location.search.replace('&new=true', '').replace('?new=true', ''));
                }

                // ... existing DB load ...
                const flowData = await api.getFlow(eventId);
                if (flowData && flowData.nodes && flowData.nodes.length > 0) {
                    setNodes(flowData.nodes);
                    setEdges(flowData.edges);
                    setIsPublished(!!flowData.isPublished);

                    // If we have a template param but flows exist, we probably shouldn't potential overwrite unless forced.
                    // But if it's a NEW event with a template param, the flow might be empty initially in DB.
                } else if (!flowData || !flowData.nodes || flowData.nodes.length === 0) {
                    // Empty flow in DB? Check if we have a template to apply
                    if (templateParam) {
                        processTemplate(templateParam);
                        setIsTemplatesOpen(false); // Close picker as we auto-selected
                    }
                }
            } catch (error) {
                // ... existing localStorage fallback ...
            }
        };

        loadFlow();
    }, [eventId, previewMode, templateId, searchParams]); // Add deps

    // Fetch event name and set as flow name
    useEffect(() => {
        const fetchEventName = async () => {
            if (!eventId) return;
            try {
                const event = await api.getEvent(eventId);
                if (event && event.name) {
                    setFlowName(event.name);
                }
            } catch (error) {
                console.error('Failed to fetch event name:', error);
            }
        };
        fetchEventName();
    }, [eventId]);

    useEffect(() => {
        if (!user?.id || previewMode) return;
        api.getBillingStatus(user.id)
            .then((data) => setPlanId((data.planId as PlanId) || 'free'))
            .catch(() => setPlanId('free'));
    }, [user?.id, previewMode]);

    const [saving, setSaving] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [templateSearch, setTemplateSearch] = useState('');
    const [flowName, setFlowName] = useState('Untitled Flow');
    const [isEditingFlowName, setIsEditingFlowName] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [modal, setModal] = useState<{ isOpen: boolean; title: string; content: React.ReactNode }>({ isOpen: false, title: '', content: '' });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, templateName: '' });
    const [messageConfirmation, setMessageConfirmation] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });

    // Undo/Redo
    const { takeSnapshot, undo, canUndo } = useUndoRedo();

    // Track changes for undo (debounced or on specific actions)
    // For simplicity, we'll just snapshot on every change for now, but in reality we should debounce
    // or only snapshot on "drag stop" or "connect" etc.
    // ReactFlow's onNodesChange/onEdgesChange fire frequently during drag.

    // Better approach: Snapshot on specific user actions or use a ref to track "last saved state"
    // and snapshot when it deviates significantly.
    // For this MVP, let's snapshot when the user *starts* a change (e.g. onNodeDragStart) or *ends* it.
    // But onNodesChange handles everything.

    // Let's use a simple effect that debounces the snapshot
    // Auto-save to localStorage
    useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            const flow = { nodes, edges };
            localStorage.setItem(`givelive_flow_${eventId}`, JSON.stringify(flow));
        }
    }, [nodes, edges, eventId]);

    // Warn before unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires returnValue to be set
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Track changes for undo (debounced or on specific actions)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (nodes.length > 0) { // Avoid initial empty state if any
                // Snapshot logic placeholder
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [nodes, edges]);

    const onNodesChangeWrapped = useCallback((changes: any) => {
        // Filter out deletion of start node
        const filteredChanges = changes.filter((change: any) => {
            if (change.type === 'remove' && change.id === 'start') {
                return false;
            }
            return true;
        });

        onNodesChange(filteredChanges);
        if (filteredChanges.some((c: any) => c.type !== 'select')) {
            setHasUnsavedChanges(true);
        }
    }, [onNodesChange]);

    const onEdgesChangeWrapped = useCallback((changes: any) => {
        onEdgesChange(changes);
        if (changes.some((c: any) => c.type !== 'select')) {
            setHasUnsavedChanges(true);
        }
    }, [onEdgesChange]);

    // Let's manually call takeSnapshot before we make big changes (like applying template, adding node).
    // And for drag/resize, maybe we can just rely on the user not needing infinite undo for every pixel.

    // Let's try a manual approach:
    // 1. Snapshot before adding node
    // 2. Snapshot before deleting node
    // 3. Snapshot before connecting
    // 4. Snapshot before updating node data

    const handleUndo = useCallback(() => {
        const result = undo(nodes, edges);
        if (result) {
            setNodes(result.nodes);
            setEdges(result.edges);
        }
    }, [undo, nodes, edges, setNodes, setEdges]);

    // Wrap setNodes/setEdges or specific actions?
    // Let's wrap the high-level actions we have control over.

    const saveCheckpoint = () => {
        takeSnapshot(nodes, edges);
    };

    // Track unsaved changes removed (handled by wrappers)

    const nodeTypes = useMemo(() => ({ start: StartNode, default: CustomNode }), []);
    const edgeTypes = useMemo(() => ({ default: DeletableEdge }), []);

    const onConnect = useCallback((params: Connection) => {
        // Check if this source handle already has a connection
        const sourceHandleId = params.sourceHandle || null;
        const existingConnection = edges.find(edge =>
            edge.source === params.source &&
            (sourceHandleId ? edge.sourceHandle === sourceHandleId : !edge.sourceHandle)
        );

        // If there's already a connection from this handle, prevent adding a new one
        if (existingConnection) {
            alert("This output already has a connection. Delete the existing connection first.");
            return;
        }

        saveCheckpoint();
        setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    }, [setEdges, saveCheckpoint, edges]);

    const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
        const selected = nodes[0];
        setSelectedNodeId(selected ? selected.id : null);
    }, []);

    const onNodeClick = useCallback(() => {
        // We can keep this for explicit clicks, but onSelectionChange handles the main logic
        // Maybe just ensure it's selected?
    }, []);

    // Derive selected node from nodes array to ensure it's always up to date
    const selectedNode = useMemo(() => {
        if (!selectedNodeId) return null;
        const node = nodes.find(n => n.id === selectedNodeId);
        if (!node) return null;

        // Enrich with type if needed (same logic as before)
        const nodeData = node.data as NodeData;
        const type = nodeData.type || (nodeData.label?.toLowerCase().includes('sms') ? 'sms' :
            nodeData.label?.toLowerCase().includes('donation') ? 'donation' : 'page');

        return { ...node, data: { ...node.data, type } };
    }, [nodes, selectedNodeId]);

    const updateNodeData = (nodeId: string, newData: Partial<NodeData>) => {
        saveCheckpoint();

        // 1. Update the node data
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, ...newData } as NodeData };
            }
            return node;
        }));

        // 2. Check for form addition condition to prompt user
        // We look up the latest node state from the previous render cycle (nodes) + the newData being applied
        const node = nodes.find(n => n.id === nodeId);
        if (node && node.data.type === 'page') {
            const mergedData = { ...node.data, ...newData };
            const sections = mergedData.sections;

            if (sections) {
                const hasForm = sections.some((s: any) => s.type === 'form');
                const hadForm = node.data.sections?.some((s: any) => s.type === 'form') ?? false;
                const formNewlyAdded = hasForm && !hadForm;

                const alreadyHasMessage =
                    flowHasMessageNode(nodes) ||
                    hasDownstreamMessageNode(nodeId, nodes, edges);

                if (formNewlyAdded && !alreadyHasMessage) {
                    setTimeout(() => {
                        setMessageConfirmation({ isOpen: true, nodeId });
                    }, 0);
                }
            }
        }
    };

    const confirmAddMessageNode = () => {
        const nodeId = messageConfirmation.nodeId;
        if (!nodeId) return;

        const sourceNode = nodes.find(n => n.id === nodeId);
        if (!sourceNode) return;

        // Determine default message type based on form fields
        let defaultMessageType = 'both';
        if (sourceNode.data.sections) {
            const formSection = sourceNode.data.sections.find((s: any) => s.type === 'form');
            if (formSection && formSection.content && formSection.content.fields) {
                const fields = formSection.content.fields;
                const hasPhone = fields.includes('phone');
                const hasEmail = fields.includes('email');

                if (hasPhone && !hasEmail) defaultMessageType = 'sms';
                else if (!hasPhone && hasEmail) defaultMessageType = 'email';
                else if (hasPhone && hasEmail) defaultMessageType = 'both';
                else defaultMessageType = 'sms'; // Default fallback
            }
        }

        const newNodeId = `${nodes.length + 1}`;
        const newNode = {
            id: newNodeId,
            position: { x: sourceNode.position.x + 300, y: sourceNode.position.y },
            data: { label: 'Send Message', type: 'message', messageType: defaultMessageType },
            type: 'default',
        };

        const newEdge = {
            id: `e${nodeId}-${newNodeId}`,
            source: nodeId,
            target: newNodeId,
            markerEnd: { type: MarkerType.ArrowClosed },
        };

        setNodes((nds) => nds.concat(newNode));
        setEdges((eds) => eds.concat(newEdge));
        setMessageConfirmation({ isOpen: false, nodeId: null });
    };

    const deleteNode = (nodeId: string) => {
        if (nodeId === 'start') {
            alert("The start node cannot be deleted.");
            return;
        }
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
            data: { label: type === 'donation' ? 'Payment Node' : `${type.charAt(0).toUpperCase() + type.slice(1)} Node`, type }, // Store type in data
            type: type === 'end' ? 'output' : 'default',
            selected: true, // Auto-select
        };
        // Deselect others and add new node
        setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(newNode));
        // selectedNodeId will be updated by onSelectionChange or we can set it here if needed,
        // but ReactFlow should trigger selection change.
    };

    const processTemplate = (templateName: string) => {
        const startNodeId = nodes.find(n => n.type === 'start')?.id || 'start';
        const baseId = nodes.length + 1;
        const newNodes: Node<NodeData>[] = [];
        const newEdges: Edge[] = [];

        switch (templateName) {
            case 'simple-donation':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Donation Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Support Our Cause', logo: '', paddingTop: 40, paddingBottom: 40, backgroundColor: '#ffffff', textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your generosity helps us make a difference. Every contribution counts.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', color: '#333333', fontSize: 18 } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 50, buttonText: 'Donate Now', buttonColor: '#000000', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Thank You SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thank you so much for your generous donation! We truly appreciate your support. 🙏'
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 500 },
                        data: {
                            label: 'Thank You Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Thank You!', logo: '', paddingTop: 60, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your donation has been received. You are making a real impact.', paddingTop: 20, paddingBottom: 60, textAlign: 'center', color: '#333333', fontSize: 20 } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'feedback-survey':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Survey Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'We Value Your Feedback', logo: '', paddingTop: 40, paddingBottom: 20, backgroundColor: '#f8f9fa', textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Please take a moment to let us know how we did today.', paddingTop: 10, paddingBottom: 30, textAlign: 'center', color: '#666666', fontSize: 16 } },
                                { id: 's3', type: 'form', content: { fields: ['rating', 'comments', 'email'], buttonText: 'Submit Feedback', buttonColor: '#2563eb', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: { label: 'Wait 1 Hour', type: 'delay', amount: 1, unit: 'hours' },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 500 },
                        data: {
                            label: 'Follow-up SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thanks for attending today! We hope to see you again soon.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'raffle-entry':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Raffle Entry',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Enter the Raffle!', logo: '', paddingTop: 40, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' } },
                                { id: 's2', type: 'image', content: { url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop', alt: 'Prize Image', paddingTop: 10, paddingBottom: 20, borderRadius: 12 } },
                                { id: 's3', type: 'text', content: { text: 'Enter for a chance to win our grand prize! Winner announced at the end of the event.', paddingTop: 10, paddingBottom: 20, textAlign: 'center', color: '#333333', fontSize: 16 } },
                                { id: 's4', type: 'form', content: { fields: ['name', 'phone', 'email'], buttonText: 'Enter Now', buttonColor: '#ea580c', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 400 },
                        data: {
                            label: 'Ticket SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You are entered! Good luck! 🎟️'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'share-testimonial':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Share Story',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Share Your Story', logo: '', paddingTop: 40, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'We would love to hear how this event has impacted you. Record a short video or write a message below.', paddingTop: 10, paddingBottom: 30, textAlign: 'center', color: '#4b5563', fontSize: 16 } },
                                { id: 's3', type: 'video', content: { url: '', paddingTop: 20, paddingBottom: 20, loop: false, autoplay: false } }, // Placeholder for upload prompt
                                { id: 's4', type: 'form', content: { fields: ['name', 'message'], buttonText: 'Submit Story', buttonColor: '#000000', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 400 },
                        data: {
                            label: 'Thanks SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thank you for sharing your story with us! It means the world. ❤️'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'new-member':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Welcome Info',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Welcome Home', logo: '', paddingTop: 40, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' } },
                                { id: 's2', type: 'video', content: { url: '', paddingTop: 10, paddingBottom: 20, loop: false, autoplay: false } },
                                { id: 's3', type: 'text', content: { text: 'We are so glad you are here. Fill out the form below to get connected.', paddingTop: 10, paddingBottom: 20, textAlign: 'center', color: '#333333', fontSize: 16 } },
                                { id: 's4', type: 'form', content: { fields: ['name', 'email', 'phone', 'interests'], buttonText: 'Get Connected', buttonColor: '#2563eb', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 400 },
                        data: { label: 'Wait 2 Days', type: 'delay', amount: 2, unit: 'days' },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 550 },
                        data: {
                            label: 'Coffee SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Hey! We\'d love to buy you a coffee and get to know you. Are you free this week? ☕'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'get-baptised':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Baptism Info',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Take the Next Step', logo: '', paddingTop: 40, paddingBottom: 20, backgroundColor: '#ffffff', textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Baptism is an outward declaration of an inward decision. Watch this video to learn more.', paddingTop: 10, paddingBottom: 20, textAlign: 'center', color: '#333333', fontSize: 16 } },
                                { id: 's3', type: 'video', content: { url: '', paddingTop: 10, paddingBottom: 30, loop: false, autoplay: false } },
                                { id: 's4', type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'I\'m Ready', buttonColor: '#000000', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 400 },
                        data: {
                            label: 'Celebration SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'We are so excited for you! A team member will reach out shortly to schedule your baptism. 🎉'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // FUNDRAISING TEMPLATES
            case 'monthly-giving':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Monthly Giving Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Become a Monthly Partner', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your monthly support helps us plan ahead and make a lasting impact. Join our community of monthly givers today.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 16 } },
                                { id: 's3', type: 'payment', content: { frequencies: ['monthly'], defaultAmount: 25, buttonText: 'Start Monthly Giving', buttonColor: '#000000' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Welcome SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Welcome to our monthly giving family! Your first gift will process shortly. Thank you for your partnership! ❤️'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'matching-campaign':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Matching Gift Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: '2X Match Active!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: '🎉 Every dollar you give will be MATCHED dollar-for-dollar! Double your impact today.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 18, color: '#059669' } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 50, buttonText: 'Double My Gift!', buttonColor: '#059669' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Impact SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thank you! Your gift has been matched - you\'ve doubled your impact! We\'ll send you an update on how your donation is being used.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // REAL LOCATIONS TEMPLATES
            case 'event-checkin':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Check-In Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Welcome! Check In Here', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'Check In', buttonColor: '#000000' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 300 },
                        data: {
                            label: 'Confirmation SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re all checked in! Enjoy the event. We\'ll send you a follow-up with highlights and next steps.'
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 450 },
                        data: { label: 'Wait 1 Day', type: 'delay', amount: 1, unit: 'days' },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 3}`,
                        position: { x: 250, y: 600 },
                        data: {
                            label: 'Follow-up Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Thanks for Attending!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'We hope you enjoyed the event. Here are some resources and next steps.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 2}-${baseId + 3}`, source: `${baseId + 2}`, target: `${baseId + 3}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'networking-event':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Networking Profile',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Connect With Others', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Share your info to connect with other scanners', paddingTop: 10, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'company', 'linkedin'], buttonText: 'Join Network', buttonColor: '#2563eb' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Connection SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re connected! We\'ll email you a list of scanners after your visit.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'conference-agenda':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Session Selection',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Conference Agenda', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'View the full schedule and save sessions to your personal agenda', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'choice', content: { choices: [{ label: 'Morning Keynote' }, { label: 'Afternoon Workshop' }, { label: 'Evening Panel' }], paddingTop: 10, paddingBottom: 10 } },
                                { id: 's4', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Save My Agenda', buttonColor: '#000000' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Agenda SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Your personalized agenda has been saved! We\'ll send you reminders before each session starts.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // CHURCHES TEMPLATES
            case 'small-groups':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Small Group Info',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Join a Small Group', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Small groups are where life change happens. Find your community.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone', 'interests'], buttonText: 'Find My Group', buttonColor: '#2563eb' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Confirmation SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thanks for your interest! A small group leader will contact you within 48 hours to help you find the perfect group.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // LEAD CAPTURE TEMPLATES
            case 'lead-magnet':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Free Resource',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Get Your Free Guide', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Download our comprehensive guide absolutely free. Just enter your email below.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Download Now', buttonColor: '#059669' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Download Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Success!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your free guide is ready. Download below or check your email for a copy.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'download', content: { fileUrl: '', fileName: 'Free Guide.pdf', buttonText: 'Download Your Guide', buttonColor: '#059669', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'demo-request':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Demo Request Form',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Schedule Your Demo', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'See our product in action. Book a personalized demo with our team.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone', 'company'], buttonText: 'Request Demo', buttonColor: '#2563eb' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Confirmation SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Demo requested! Our team will reach out within 24 hours to schedule your personalized walkthrough.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'waitlist-signup':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Waitlist Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Join the Waitlist', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Be first to know when we launch. Early access for waitlist members.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Join Waitlist', buttonColor: '#7c3aed' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Welcome SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re on the list! 🎉 We\'ll notify you as soon as we launch. Get ready for something amazing!'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // ONLINE WEBINAR TEMPLATES
            case 'webinar-registration':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Webinar Registration',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Register for Webinar', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Join us for an exclusive online training session.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Register Now', buttonColor: '#dc2626' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Confirmation SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re registered! We\'ve sent the webinar link to your email. We\'ll remind you 1 hour before it starts.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'workshop-series':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Workshop Signup',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: '4-Week Workshop Series', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Transform your skills in just 4 weeks. Limited spots available.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'Secure My Spot', buttonColor: '#059669' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Welcome Email',
                            type: 'message',
                            messageType: 'email',
                            emailSubject: 'Welcome to the Workshop Series!',
                            emailMessage: 'Excited to have you! Here\'s what to expect over the next 4 weeks...'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'masterclass':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Masterclass Registration',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Exclusive Masterclass', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Learn from the best. Premium training with industry experts.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 97, buttonText: 'Enroll Now', buttonColor: '#000000' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Access Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Welcome to the Masterclass!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your exclusive access link has been sent. See you in class!', paddingTop: 20, paddingBottom: 40, textAlign: 'center' } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // CONCERTS TEMPLATES
            case 'concert-tickets':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Ticket Selection',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Get Your Tickets', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Select your seats and secure your spot for an unforgettable night.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'choice', content: { choices: [{ label: 'General Admission' }, { label: 'VIP' }], paddingTop: 10, paddingBottom: 10 } },
                                { id: 's4', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 50, buttonText: 'Buy Tickets', buttonColor: '#ec4899' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'E-Ticket SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Tickets confirmed! 🎫 Check your email for your e-tickets. See you at the show!'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'backstage-pass':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'VIP Upgrade',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Backstage VIP Experience', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: '⭐ Meet the artist, early entry, exclusive merch. Limited passes available!', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 150, buttonText: 'Get VIP Access', buttonColor: '#000000' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'VIP Confirmation',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'VIP CONFIRMED! ⭐ Check your email for exclusive backstage instructions. This is going to be epic!'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'fan-meetup':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Meet & Greet Signup',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Fan Meet & Greet', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Limited spots! Register for a chance to meet the artist.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'Enter to Win', buttonColor: '#ec4899' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Entry Confirmation',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re entered! 🎉 We\'ll notify winners 24 hours before the show. Good luck!'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // SURVEYS TEMPLATES
            case 'nps-survey':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'NPS Question',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Quick Question', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'How likely are you to recommend us to a friend? (0-10)', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['rating', 'comments'], buttonText: 'Submit', buttonColor: '#2563eb' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Thank You SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thanks for your feedback! Your input helps us improve.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'market-research':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Product Survey',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Help Us Build Better', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Share your thoughts on our new product idea. Takes 2 minutes.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'feedback'], buttonText: 'Share Feedback', buttonColor: '#2563eb' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Thank You',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Thank You!', paddingTop: 60, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your feedback is invaluable. We\'ll keep you updated on the launch!', paddingTop: 20, paddingBottom: 60, textAlign: 'center' } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // TICKETS TEMPLATES
            case 'event-ticket':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Ticket Purchase',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Reserve Your Spot', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Secure your ticket now. Limited availability.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 25, buttonText: 'Get Ticket', buttonColor: '#ea580c' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'E-Ticket',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Ticket Confirmed!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your e-ticket has been sent to your email. Show it at the door!', paddingTop: 20, paddingBottom: 40, textAlign: 'center' } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'early-bird':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Early Bird Offer',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: '⚡ Early Bird Special', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Save 30%! Offer ends in 48 hours. Don\'t miss out.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 18, color: '#ea580c' } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 17, buttonText: 'Claim Discount', buttonColor: '#ea580c' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Confirmation SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Early bird ticket secured! You saved 30%. See you at the event! 🎉'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'group-tickets':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Group Booking',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Group Tickets', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Bring your friends! 10+ tickets get 20% off.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone', 'quantity'], buttonText: 'Book Group', buttonColor: '#ea580c' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Quote SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Group booking received! We\'ll send you a custom quote and payment link within 2 hours.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // RAFFLES TEMPLATES
            case 'grand-prize':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Multi-Prize Raffle',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Grand Prize Raffle!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: '🏆 Win 1 of 10 amazing prizes! Entry is free.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'Enter Raffle', buttonColor: '#7c3aed' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Entry SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re entered in the Grand Prize Raffle! 🏆 Winner announced Friday at 5pm. Good luck!'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'charity-raffle':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Charity Raffle',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Support & Win!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Every $10 donation = 1 raffle entry. All proceeds go to charity.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'payment', content: { frequencies: ['one-time'], defaultAmount: 10, buttonText: 'Donate & Enter', buttonColor: '#059669' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Thank You',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Thank You!', paddingTop: 60, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Your donation makes a difference. You\'re entered to win! Good luck! 🍀', paddingTop: 20, paddingBottom: 60, textAlign: 'center' } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            // QUIZ GAMES TEMPLATES
            case 'trivia-quiz':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Trivia Signup',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Trivia Challenge!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Test your knowledge. Top scorers win prizes!', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Start Quiz', buttonColor: '#eab308' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 300 },
                        data: {
                            label: 'Question 1',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'text', content: { text: 'Which planet is known as the Red Planet?', paddingTop: 30, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's2', type: 'choice', content: { choices: [{ label: 'Mars' }, { label: 'Venus' }, { label: 'Jupiter' }], paddingTop: 10, paddingBottom: 30 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 450 },
                        data: {
                            label: 'Results SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Nice work! You scored 8/10. Check your email for the leaderboard and prize details.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'personality-quiz':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Quiz Signup',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'What\'s Your Type?', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Discover your personality type in 2 minutes!', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Take Quiz', buttonColor: '#7c3aed' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 300 },
                        data: {
                            label: 'Question 1',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'text', content: { text: 'At a party, you usually:', paddingTop: 30, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's2', type: 'choice', content: { choices: [{ label: 'Meet new people' }, { label: 'Stick with close friends' }, { label: 'Leave early' }], paddingTop: 10, paddingBottom: 30 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 450 },
                        data: {
                            label: 'Results Page',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'You\'re an Innovator!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Creative, forward-thinking, and always ready for the next challenge. Share your results!', paddingTop: 20, paddingBottom: 40, textAlign: 'center' } }
                            ]
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'leaderboard-challenge':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Challenge Signup',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Leaderboard Challenge', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Compete for the top spot! Winner gets $100 prize.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone'], buttonText: 'Join Challenge', buttonColor: '#eab308' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 300 },
                        data: {
                            label: 'Round 1',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'text', content: { text: 'Quick round — pick the best answer to earn points:', paddingTop: 30, paddingBottom: 20, textAlign: 'center', fontSize: 18 } },
                                { id: 's2', type: 'choice', content: { choices: [{ label: 'Answer A (+10 pts)' }, { label: 'Answer B (+5 pts)' }, { label: 'Answer C (+0 pts)' }], paddingTop: 10, paddingBottom: 30 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 450 },
                        data: {
                            label: 'Score SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'You\'re on the leaderboard! Current rank: #12. Play again to improve your score. Competition ends Sunday!'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'open-house':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Open House Sign-in',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Welcome to our Open House!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Please sign in to receive the disclosure package and property details.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone', 'current_address'], buttonText: 'Sign In', buttonColor: '#2563eb' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Welcome SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thanks for visiting! I\'ve just emailed you the property disclosure package. Do you have any quick questions about the home? 🏠'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'real-estate-lead':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Lead Capture',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'Find Your Dream Home', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Tell us what you\'re looking for and we\'ll send you matches instantly.', paddingTop: 20, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email', 'phone', 'area_of_interest'], buttonText: 'Start Searching', buttonColor: '#000000' } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 350 },
                        data: {
                            label: 'Speed-to-Lead SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Hi! I just saw your inquiry about properties. I\'m currently looking at some great matches - are you free for a 2-minute chat? 📞'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            case 'google-review':
                newNodes.push(
                    {
                        id: `${baseId}`,
                        position: { x: 250, y: 150 },
                        data: {
                            label: 'Quick Sign-in',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'header', content: { title: 'We\'d love your feedback!', paddingTop: 40, paddingBottom: 20, textAlign: 'center' } },
                                { id: 's2', type: 'text', content: { text: 'Tell us who you are, then we\'ll send you to leave a Google review.', paddingTop: 20, paddingBottom: 20, textAlign: 'center', fontSize: 16 } },
                                { id: 's3', type: 'form', content: { fields: ['name', 'email'], buttonText: 'Continue', buttonColor: '#2563eb', paddingTop: 20, paddingBottom: 40 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 1}`,
                        position: { x: 250, y: 300 },
                        data: {
                            label: 'Review Request',
                            type: 'page',
                            sections: [
                                { id: 's1', type: 'text', content: { text: 'If you enjoyed your experience, please leave us a review on Google. It helps us a lot!', paddingTop: 30, paddingBottom: 20, textAlign: 'center', fontSize: 16 } },
                                { id: 's2', type: 'link', content: { url: 'https://g.page/r/...', label: '⭐⭐⭐⭐⭐ Leave a Google Review', style: 'button', buttonColor: '#ea4335', textAlign: 'center', paddingTop: 10, paddingBottom: 30 } }
                            ]
                        },
                        type: 'default'
                    },
                    {
                        id: `${baseId + 2}`,
                        position: { x: 250, y: 450 },
                        data: {
                            label: 'Thank You SMS',
                            type: 'sms',
                            messageType: 'sms',
                            smsMessage: 'Thanks for your support! We really appreciate it.'
                        },
                        type: 'default'
                    }
                );
                newEdges.push(
                    { id: `e${startNodeId}-${baseId}`, source: startNodeId, target: `${baseId}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId}-${baseId + 1}`, source: `${baseId}`, target: `${baseId + 1}`, markerEnd: { type: MarkerType.ArrowClosed } },
                    { id: `e${baseId + 1}-${baseId + 2}`, source: `${baseId + 1}`, target: `${baseId + 2}`, markerEnd: { type: MarkerType.ArrowClosed } }
                );
                break;

            default: {
                const fallbackTemplate = templates.find(t => t.id === templateName);
                if (fallbackTemplate) {
                    const flow = buildDefaultTemplateFlow(fallbackTemplate, startNodeId, baseId);
                    newNodes.push(...(flow.nodes as Node<NodeData>[]));
                    newEdges.push(...flow.edges);
                }
                break;
            }
        }

        setNodes((nds) => {
            const existingStart = nds.find(n => n.type === 'start') || {
                id: 'start',
                type: 'start',
                data: { label: 'Start (QR Scan)', type: 'start' },
                position: { x: 250, y: 50 }
            };
            const startNode = {
                ...existingStart,
                data: {
                    ...existingStart.data,
                    label: 'Start (QR Scan)',
                    type: 'start',
                    triggerType: existingStart.data?.triggerType || 'qr',
                },
            };
            return [startNode, ...newNodes];
        });
        setEdges(newEdges);

        // Set the flow name from the template
        const template = templates.find(t => t.id === templateName);
        if (template) {
            setFlowName(template.name);
        }
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
        // let existingFlows = existingFlowsStr ? JSON.parse(existingFlowsStr) : [];

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
    const [loadModal, setLoadModal] = useState<{ isOpen: boolean; flows: SavedFlow[] }>({ isOpen: false, flows: [] });

    const handlePublish = async () => {
        if (!eventId) return;

        const validationErrors = validatePublishFlow({
            nodes,
            edges,
            socialTriggersEnabled: SHOW_SOCIAL_TRIGGERS,
        });

        const startNode = nodes.find(n => n.type === 'start' || n.data.type === 'start');

        // Social account required only when social triggers are enabled in the product
        if (SHOW_SOCIAL_TRIGGERS && startNode?.data?.triggerType === 'social') {
            try {
                const statusRes = await fetch(`${API_URL}/integrations/status`);
                const status = await statusRes.json();
                const isConnected = status.facebook || status.instagram || status.tiktok;

                if (!isConnected) {
                    validationErrors.push(
                        '❌ No social account connected. Go to Settings/Integrations to connect an account before publishing.'
                    );
                }
            } catch (e) {
                console.error('Failed to verify social status during publish', e);
            }
        }

        // Show validation errors if any
        if (validationErrors.length > 0) {
            setModal({
                isOpen: true,
                title: '⚠️ Flow Issues Detected',
                content: (
                    <div className="space-y-3 text-left">
                        <p className="text-gray-600 text-sm">
                            Fix these issues before publishing:
                        </p>
                        <div className="space-y-2">
                            {validationErrors.map((error, i) => (
                                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 whitespace-pre-wrap">
                                    {error}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            💡 Tip: Make sure all nodes are connected in a logical flow from Start to End.
                        </p>
                    </div>
                )
            });
            return;
        }

        // Block publishing an additional live flow on free tier (re-publishing the same flow is allowed)
        if (!isPublished && user?.id) {
            try {
                const limitCheck = await api.checkCanPublish(user.id, eventId);
                if (!limitCheck.canPublish) {
                    setShowUpgradeModal(true);
                    return;
                }
            } catch (e) {
                console.error('Failed to check publish limit', e);
            }
        }

        // All validation passed, proceed with publish
        try {
            setSaving(true);
            await api.publishJourney(eventId, { nodes, edges });
            // Save as published to update status
            await api.saveFlow(eventId, { nodes, edges, isPublished: true });
            setIsPublished(true);
            setModal({
                isOpen: true,
                title: '✅ Published Successfully!',
                content: 'Your journey is now live! Users can scan the QR code to begin.'
            });
        } catch (err: any) {
            console.error(err);

            if (err.message === 'plan_limit' || err.planLimit) {
                setShowUpgradeModal(true);
                return;
            }

            if (err.validationErrors?.length) {
                setModal({
                    isOpen: true,
                    title: '⚠️ Flow Issues Detected',
                    content: (
                        <div className="space-y-3 text-left">
                            <p className="text-gray-600 text-sm">Fix these issues before publishing:</p>
                            <div className="space-y-2">
                                {err.validationErrors.map((error: string, i: number) => (
                                    <div
                                        key={i}
                                        className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 whitespace-pre-wrap"
                                    >
                                        {error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ),
                });
                return;
            }

            let errorMessage = 'Failed to publish journey.';

            if (err.message?.includes('Network')) {
                errorMessage = '🌐 Network error. Check your internet connection and try again.';
            } else if (err.message?.includes('500')) {
                errorMessage = '🔧 Server error. Please try again in a moment.';
            } else if (err.message?.includes('401') || err.message?.includes('403')) {
                errorMessage = '🔒 Authentication error. Please log in again.';
            } else if (err.message) {
                errorMessage = `❌ ${err.message}`;
            }

            setModal({
                isOpen: true,
                title: 'Publish Failed',
                content: (
                    <div className="space-y-3 text-left">
                        <p className="text-gray-900">{errorMessage}</p>
                        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                            <p className="font-bold mb-1">What to try:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Check your internet connection</li>
                                <li>Refresh the page and try again</li>
                                <li>Make sure all nodes are properly configured</li>
                            </ul>
                        </div>
                    </div>
                ),
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveClick = () => {
        setSaveModal({ isOpen: true, flowName: flowName });
    };

    const confirmSave = async () => {
        if (!saveModal.flowName.trim()) {
            alert("Please enter a flow name");
            return;
        }

        setSaving(true);

        try {
            // Update event name if it has changed
            if (saveModal.flowName !== flowName && eventId) {
                await api.updateEvent(eventId, { name: saveModal.flowName });
                // Update local state to reflect the new name
                setFlowName(saveModal.flowName);
            }

            // Save flow to database
            if (eventId) {
                await api.saveFlow(eventId, {
                    nodes,
                    edges,
                    isPublished: isPublished // Use the current published state
                });
            }

            // Also save to localStorage as backup
            localStorage.setItem(`givelive_flow_${eventId}`, JSON.stringify({ nodes, edges }));

            setSaving(false);
            setHasUnsavedChanges(false);
            setSaveModal({ isOpen: false, flowName: '' });
            setModal({ isOpen: true, title: 'Success', content: 'Journey saved successfully!' });
        } catch (error) {
            console.error('Failed to save flow:', error);
            setSaving(false);
            alert('Failed to save flow. Please try again.');
        }
    };

    const confirmLoad = (flow: SavedFlow) => {
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setHasUnsavedChanges(false);
        setLoadModal({ isOpen: false, flows: [] });
        setModal({ isOpen: true, title: 'Success', content: `Loaded flow: ${flow.name}` });
    };

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });

    const handleDeleteClick = (nodeId: string) => {
        if (nodeId === 'start') {
            alert("The start node cannot be deleted.");
            return;
        }
        setDeleteModal({ isOpen: true, nodeId });
    };

    const confirmDelete = () => {
        if (deleteModal.nodeId) {
            deleteNode(deleteModal.nodeId);
            setDeleteModal({ isOpen: false, nodeId: null });
        }
    };

    const handleDeleteFlow = async () => {
        if (!eventId) return;
        setSaving(true);
        try {
            await api.deleteEvent(eventId);
            setHasUnsavedChanges(false);
            navigate('/admin');
        } catch (error) {
            console.error('Failed to delete flow:', error);
            alert('Failed to delete flow. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const duplicateNode = (nodeId: string) => {
        const nodeToDuplicate = nodes.find(n => n.id === nodeId);
        if (!nodeToDuplicate) return;

        const newNodeId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `node_${Date.now()}`;

        // Deep clone data to avoid reference issues
        const newData = JSON.parse(JSON.stringify(nodeToDuplicate.data));

        // Slightly offset position
        const newPosition = {
            x: nodeToDuplicate.position.x + 50,
            y: nodeToDuplicate.position.y + 50
        };

        const newNode = {
            ...nodeToDuplicate,
            id: newNodeId,
            position: newPosition,
            data: newData,
            selected: true
        };

        // Deselect others and add new node
        setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNode));
        setSelectedNodeId(newNodeId);
    };

    const closeMobileNav = () => setMobileNavOpen(false);

    return (
        <JourneyContext.Provider value={{ duplicateNode }}>
            <div className="h-screen flex flex-col bg-background">
                <div className="bg-surface border-b border-gray-100 px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 z-10 shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen((open) => !open)}
                            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition shrink-0"
                            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                        >
                            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition shrink-0">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <Logo size="small" />
                            <div className="hidden sm:block h-6 w-px bg-gray-200"></div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg font-bold text-primary truncate">Journey Builder</h1>
                                <p className="text-xs text-gray-400 hidden sm:block">Editing Flow</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-0">
                        <div className="hidden md:flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
                            <button onClick={() => addNode('page')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                                <Plus size={14} /> Page
                            </button>
                            <button onClick={() => addNode('sms')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                                <Plus size={14} /> SMS
                            </button>
                            <button onClick={() => addNode('donation')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                                <Plus size={14} /> Payment
                            </button>
                            <button onClick={() => addNode('delay')} className="px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm text-sm font-medium text-gray-600 transition flex items-center gap-2">
                                <Clock size={14} /> Delay
                            </button>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={handlePublish}
                                disabled={saving}
                                className="bg-[#FCD34D] hover:bg-[#FBBF24] text-slate-900 font-bold py-2 px-3 sm:px-4 rounded-full text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                <Globe size={16} /> <span className="hidden sm:inline">{saving ? 'Publishing...' : 'Publish Live'}</span><span className="sm:hidden">{saving ? '...' : 'Publish'}</span>
                            </button>
                            <button
                                onClick={handleSaveClick}
                                disabled={saving}
                                className="btn-primary py-2 px-3 sm:px-4 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={16} /> <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Flow'}</span><span className="sm:hidden">{saving ? '...' : 'Save'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {mobileNavOpen && (
                        <button
                            type="button"
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                            aria-label="Close menu"
                            onClick={closeMobileNav}
                        />
                    )}

                    {/* Left Sidebar */}
                    <div
                        className={`w-64 bg-surface border-r border-gray-100 flex flex-col p-4 gap-2 z-50 overflow-y-auto transition-transform duration-300 ease-out
                            fixed inset-y-0 left-0 lg:static lg:translate-x-0 lg:z-10
                            ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                    >
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
                                <span>Template Library</span>
                            </div>
                            {isTemplatesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        <button
                            onClick={() => {
                                setIsAIBuilderOpen(true);
                                closeMobileNav();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 transition text-left w-full mb-2"
                        >
                            <Sparkles size={18} />
                            <span className="font-bold">AI Journey Builder</span>
                        </button>

                        {isTemplatesOpen && (
                            <div className="mb-2 animate-in slide-in-from-top-2 duration-200">
                                {/* Search Bar */}
                                <div className="px-3 py-2">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search templates..."
                                            value={templateSearch}
                                            onChange={(e) => setTemplateSearch(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        />
                                        {templateSearch && (
                                            <button
                                                onClick={() => setTemplateSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="px-3 py-2 max-h-20 overflow-y-auto">
                                    <div className="flex flex-wrap gap-1">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setTemplateSearch('');
                                                }}
                                                className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${selectedCategory === cat
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {cat} ({getCategoryCount(cat)})
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Templates Grid */}
                                <div className="px-3 py-2 max-h-96 overflow-y-auto">
                                    <div className="flex flex-col gap-1">
                                        {(() => {
                                            let filteredTemplates = getTemplatesByCategory(selectedCategory);

                                            if (templateSearch) {
                                                filteredTemplates = templates.filter(t =>
                                                    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                                                    t.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
                                                    t.category.toLowerCase().includes(templateSearch.toLowerCase())
                                                );
                                            }

                                            if (filteredTemplates.length === 0) {
                                                return (
                                                    <div className="text-center py-8 text-gray-400 text-sm">
                                                        No templates found
                                                    </div>
                                                );
                                            }

                                            return filteredTemplates.map((template) => {
                                                const Icon = template.icon;
                                                return (
                                                    <button
                                                        key={template.id}
                                                        onClick={() => {
                                                            applyTemplate(template.id);
                                                            closeMobileNav();
                                                        }}
                                                        className="flex items-start gap-3 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left group"
                                                    >
                                                        <div className={`${template.iconBg} ${template.iconColor} p-1.5 rounded-lg group-hover:scale-110 transition flex-shrink-0`}>
                                                            <Icon size={14} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-xs font-medium truncate">{template.name}</span>
                                                            <span className="text-[10px] text-gray-400 truncate">{template.description}</span>
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Link
                            to="/settings"
                            onClick={closeMobileNav}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left"
                        >
                            <Settings size={18} />
                            <span>Settings</span>
                        </Link>

                        <div className="h-px bg-gray-100 my-2"></div>

                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Analytics</div>
                        <Link
                            to="/analytics"
                            onClick={closeMobileNav}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition"
                        >
                            <BarChart3 size={18} />
                            <span>Overview</span>
                        </Link>

                        <div className="mt-auto pt-4">
                            <button
                                onClick={() => {
                                    setIsDeleteFlowModalOpen(true);
                                    closeMobileNav();
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition w-full text-left font-medium"
                            >
                                <Trash2 size={18} />
                                <span>Delete Flow</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Content (ReactFlow) */}
                    <div className="flex-1 bg-gray-50/50 relative">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChangeWrapped}
                            onEdgesChange={onEdgesChangeWrapped}
                            onConnect={onConnect}
                            onSelectionChange={onSelectionChange}
                            onNodeClick={onNodeClick} // Add click handler
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            fitView
                            className="bg-gray-50"
                            proOptions={{ hideAttribution: true }}
                        >
                            <Controls className="bg-white border-gray-100 shadow-card rounded-xl overflow-hidden">
                                <div className="react-flow__controls-button" onClick={handleUndo} title="Undo">
                                    <Undo size={12} className={!canUndo ? 'opacity-30' : ''} />
                                </div>
                            </Controls>

                            {/* Flow Name Display - Bottom Left - Editable */}
                            <div className="absolute bottom-6 left-[49px] z-10">
                                {isEditingFlowName ? (
                                    <div className="bg-white rounded-xl shadow-card border border-gray-100 p-2 flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={flowName}
                                            onChange={(e) => setFlowName(e.target.value)}
                                            onBlur={async () => {
                                                setIsEditingFlowName(false);
                                                // Update event name via API
                                                if (eventId && flowName) {
                                                    try {
                                                        await api.updateEvent(eventId, { name: flowName });
                                                    } catch (error) {
                                                        console.error('Failed to update event name:', error);
                                                    }
                                                }
                                            }}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    setIsEditingFlowName(false);
                                                    // Update event name via API
                                                    if (eventId && flowName) {
                                                        try {
                                                            await api.updateEvent(eventId, { name: flowName });
                                                        } catch (error) {
                                                            console.error('Failed to update event name:', error);
                                                        }
                                                    }
                                                }
                                            }}
                                            autoFocus
                                            className="px-2 py-1 text-sm font-medium text-gray-700 border-none outline-none focus:ring-0 bg-transparent min-w-[200px]"
                                        />
                                        <button
                                            onClick={async () => {
                                                setIsEditingFlowName(false);
                                                // Update event name via API
                                                if (eventId && flowName) {
                                                    try {
                                                        await api.updateEvent(eventId, { name: flowName });
                                                    } catch (error) {
                                                        console.error('Failed to update event name:', error);
                                                    }
                                                }
                                            }}
                                            className="p-1 hover:bg-gray-100 rounded transition"
                                            title="Save name"
                                        >
                                            <Check size={14} className="text-green-600" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditingFlowName(true)}
                                        className="bg-white rounded-xl shadow-card border border-gray-100 px-3 py-2 flex items-center gap-2 hover:border-primary transition group"
                                        title="Click to edit event name"
                                    >
                                        <span className="text-sm font-medium text-gray-700">{flowName}</span>
                                        <Edit size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                                    </button>
                                )}
                            </div>

                            <MiniMap className="bg-white border-gray-100 shadow-card rounded-xl" />
                            <Background gap={20} size={1} color="#E5E7EB" />
                        </ReactFlow>
                    </div>
                </div>

                <NodeEditor
                    node={selectedNode}
                    nodes={nodes}
                    edges={edges}
                    onClose={() => setSelectedNodeId(null)}
                    onUpdate={updateNodeData}
                    onDelete={handleDeleteClick}
                    onDuplicate={duplicateNode}
                    showWatermark={previewMode || shouldShowWatermarkForPlan(planId)}
                    eventId={eventId}
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

                {/* Template Confirmation Modal */}
                <Modal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    title="⚠️ Load Template?"
                >
                    <div className="text-gray-600">
                        <p className="mb-3">
                            <strong>Loading this template will replace your entire current flow.</strong>
                        </p>
                        <p>
                            You have unsaved changes. Would you like to save your current work before loading the template?
                        </p>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDiscardTemplate}
                            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-sm font-medium"
                        >
                            Discard & Load Template
                        </button>
                        <button
                            onClick={handleConfirmTemplate}
                            className="btn-primary py-2 px-4 text-sm"
                        >
                            {saving ? 'Saving...' : 'Save & Load Template'}
                        </button>
                    </div>
                </Modal>

                {/* Message Node Creation Confirmation Modal */}
                <Modal
                    isOpen={messageConfirmation.isOpen}
                    onClose={() => setMessageConfirmation({ isOpen: false, nodeId: null })}
                    title="Add Message Node"
                >
                    <div className="text-gray-600">
                        Adding a form to a page generally means you&apos;re going to ask for contact information. Do you want us to add a &quot;Send Message&quot; node so you can contact this person?
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setMessageConfirmation({ isOpen: false, nodeId: null })}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        >
                            No, thanks
                        </button>
                        <button
                            onClick={confirmAddMessageNode}
                            className="btn-primary py-2 px-4 text-sm"
                        >
                            Yes, add it
                        </button>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, nodeId: null })}
                    title="Delete Node"
                >
                    <div className="text-gray-600">
                        Are you sure you want to delete this node? This action cannot be undone.
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteModal({ isOpen: false, nodeId: null })}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm font-medium shadow-lg shadow-red-500/20"
                        >
                            Delete
                        </button>
                    </div>
                </Modal>

                {/* Save Flow Modal */}
                <Modal
                    isOpen={saveModal.isOpen}
                    onClose={() => setSaveModal({ ...saveModal, isOpen: false })}
                    title="Save Flow"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Flow Name</label>
                        <input
                            type="text"
                            value={saveModal.flowName}
                            onChange={(e) => setSaveModal({ ...saveModal, flowName: e.target.value })}
                            placeholder="e.g., Welcome Series V2"
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            autoFocus
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setSaveModal({ ...saveModal, isOpen: false })}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmSave}
                            className="btn-primary py-2 px-4 text-sm"
                        >
                            {saving ? 'Saving...' : 'Save Flow'}
                        </button>
                    </div>
                </Modal>

                {/* Delete Flow Modal */}
                <Modal
                    isOpen={isDeleteFlowModalOpen}
                    onClose={() => setIsDeleteFlowModalOpen(false)}
                    title="⚠️ Delete Flow Forever?"
                >
                    <div className="text-gray-600">
                        <p className="mb-4">
                            Are you sure you want to delete <strong>{flowName}</strong>?
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm mb-4">
                            <strong>Warning:</strong> This will permanently delete this flow campaign, all associated nodes, and its unique QR code configuration. This action cannot be undone.
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteFlowModalOpen(false)}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteFlow}
                            disabled={saving}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition text-sm font-medium shadow-lg shadow-red-500/20 disabled:opacity-50"
                        >
                            {saving ? 'Deleting...' : 'Delete Forever'}
                        </button>
                    </div>
                </Modal>

                {/* Load Flow Modal */}
                <Modal
                    isOpen={loadModal.isOpen}
                    onClose={() => setLoadModal({ ...loadModal, isOpen: false })}
                    title="Load Saved Flow"
                >
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {loadModal.flows.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No saved flows found.</p>
                        ) : (
                            loadModal.flows.map((flow) => (
                                <button
                                    key={flow.id}
                                    onClick={() => confirmLoad(flow)}
                                    className="w-full p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 text-left transition group"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-900 group-hover:text-primary transition">{flow.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(flow.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {flow.nodes?.length || 0} nodes • {flow.edges?.length || 0} connections
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setLoadModal({ ...loadModal, isOpen: false })}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>

                {/* Preview Mode Overlay */}
                {previewMode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-white">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <LayoutTemplate size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit this workflow</h2>
                            <p className="text-gray-600 mb-8">
                                Sign up for free to customize this template, connect your payment processing, and publish it to the world.
                            </p>
                            <div className="flex flex-col gap-3">
                                <a href="https://accounts.givelive.app/sign-up" className="bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                                    Sign up for free
                                </a>
                                <Link to="/blog" className="text-gray-500 font-medium py-2 hover:text-gray-800">
                                    Explore other templates
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Title Toast */}
                {titleToast && titleToast.show && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-500">
                        <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-start gap-4 max-w-lg border border-gray-700">
                            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 mt-1">
                                <Edit size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{titleToast.title}</h3>
                                <p className="text-gray-300 text-sm leading-relaxed">{titleToast.subtitle}</p>
                            </div>
                            <button onClick={() => setTitleToast(null)} className="text-gray-500 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}
                {/* Modals */}
                <AIBuilder
                    isOpen={isAIBuilderOpen}
                    onClose={() => setIsAIBuilderOpen(false)}
                    onGenerate={handleAIGenerate}
                />
                {!previewMode && (
                    <UpgradeModal
                        isOpen={showUpgradeModal}
                        onClose={() => setShowUpgradeModal(false)}
                        limit={getCampaignLimit(planId) ?? 1}
                        reason="publish"
                    />
                )}
            </div >
        </JourneyContext.Provider>
    );
}
