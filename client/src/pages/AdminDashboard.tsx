import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { api } from '../api';
import Modal from '../components/Modal';
import UpgradeModal from '../components/UpgradeModal';
import { canCreateCampaign, getCampaignLimit } from '../lib/billingLimits';
import type { PlanId } from '../data/pricingPlans';
import QRCode from 'react-qr-code';
import { BarChart3, Calendar, Clock, LayoutGrid, Grid, List, Copy, LayoutTemplate, MessageSquare, Heart, GitBranch, Users, Mail, Zap, Activity, Terminal, QrCode, Settings, ChevronDown, ChevronRight, Search, X, Inbox } from 'lucide-react';
import { templates, categories, getTemplatesByCategory, getCategoryCount } from '../data/templateLibrary';
import { useRegisterMobileSidebar } from '../contexts/MobileSidebarContext';
import MobileDrawer from '../components/MobileDrawer';
import ReactFlow, { Background, type Node, type Edge, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import 'reactflow/dist/style.css';

// Node Components for Preview
const StartNodePreview = () => (
    <div className="bg-white rounded-full shadow-md border-2 border-primary/20 p-2 px-4 flex items-center gap-3">
        <div className="p-1.5 rounded-full bg-blue-50 text-blue-600">
            <QrCode size={16} />
        </div>
        <div className="font-bold text-sm text-gray-700 select-none">Start</div>
        <Handle type="source" position={Position.Bottom} className="!hidden" />
    </div>
);

const CustomNodePreview = ({ data }: { data: any }) => {
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

    const getNodeColor = () => {
        const type = data.type || 'page';
        if (['page', 'donation'].includes(type)) return 'border-blue-200';
        if (['sms', 'email'].includes(type)) return 'border-green-200';
        if (['delay', 'condition', 'start'].includes(type)) return 'border-purple-200';
        if (['fub', 'salesforce', 'hubspot', 'constant_contact', 'mailchimp', 'brevo', 'zapier', 'make', 'n8n'].includes(type)) return 'border-orange-200';
        return 'border-gray-100';
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border-2 ${getNodeColor()} min-w-[140px] p-2 relative`}>
            <Handle type="target" position={Position.Top} className="!hidden" />
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-50 rounded-lg shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-gray-700 truncate">{data.label}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!hidden" />
        </div>
    );
};

const nodeTypes = { start: StartNodePreview, default: CustomNodePreview };

export default function AdminDashboard() {
    const { user } = useUser();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [eventFlows, setEventFlows] = useState<Record<string, { nodes: Node[], edges: Edge[], isPublished?: boolean }>>({});
    const [viewMode, setViewMode] = useState<'grid' | 'small-grid' | 'list'>('grid');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEventName, setNewEventName] = useState('');
    const [creating, setCreating] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // Sidebar State
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [templateSearch, setTemplateSearch] = useState('');
    const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
    const mobileSidebar = useRegisterMobileSidebar();
    const [planId, setPlanId] = useState<PlanId>('free');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        api.getBillingStatus(user.id)
            .then((data) => setPlanId((data.planId as PlanId) || 'free'))
            .catch(() => setPlanId('free'));
    }, [user?.id]);

    const isAtCampaignLimit = () => !canCreateCampaign(planId, events.length);

    const openCreateFlow = () => {
        if (isAtCampaignLimit()) {
            setShowUpgradeModal(true);
            return;
        }
        setPendingTemplateId(null);
        setNewEventName('');
        setIsModalOpen(true);
    };

    const handleTemplateClick = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            if (isAtCampaignLimit()) {
                setShowUpgradeModal(true);
                return;
            }
            setNewEventName(template.name);
            setPendingTemplateId(template.id);
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const [claimingLegacy, setClaimingLegacy] = useState(false);
    const [mailAccess, setMailAccess] = useState(false);
    const [mailUnread, setMailUnread] = useState(0);

    // Only platform operators get a 200 here; everyone else keeps a clean sidebar.
    useEffect(() => {
        api.getMailMessages(1, 0)
            .then((data) => {
                setMailAccess(true);
                setMailUnread(data.unreadCount || 0);
            })
            .catch(() => setMailAccess(false));
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await api.getEvents();
            const eventsData = Array.isArray(data) ? data : [];
            setEvents(eventsData);

            // Show onboarding if they have no projects and haven't seen it yet
            if (eventsData.length === 0 && !localStorage.getItem('givelive_onboarded')) {
                setShowOnboarding(true);
            }

            // Load flows for each event
            const flowsMap: Record<string, { nodes: Node[], edges: Edge[] }> = {};
            for (const event of eventsData) {
                try {
                    const flowData = await api.getFlow(event.id);
                    if (flowData && flowData.nodes && flowData.edges) {
                        flowsMap[event.id] = flowData;
                    }
                } catch (err) {
                    // No flow data for this event yet
                    console.log(`No flow data for event ${event.id}`);
                }
            }
            setEventFlows(flowsMap);
        } catch (err) {
            console.error(err);
            setError('Could not load events. Please check if the server is running and database is connected.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventName.trim()) return;

        if (isAtCampaignLimit()) {
            setIsModalOpen(false);
            setShowUpgradeModal(true);
            return;
        }

        try {
            setCreating(true);
            const newEvent = await api.createEvent({
                name: newEventName,
                date: new Date().toISOString(),
                qr_url: 'https://example.com/qr-placeholder',
            });
            setNewEventName('');
            setIsModalOpen(false);

            if (pendingTemplateId) {
                setPendingTemplateId(null);
                window.location.href = `/admin/event/${newEvent.id}?new=true&template=${pendingTemplateId}`;
            } else {
                loadEvents();
            }
        } catch (err) {
            if (err instanceof Error && err.message === 'plan_limit') {
                setIsModalOpen(false);
                setShowUpgradeModal(true);
                return;
            }
            console.error(err);
            alert('Failed to create event');
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const handleDuplicate = async (eventToDuplicate: any, e: React.MouseEvent) => {
        e.preventDefault();

        if (isAtCampaignLimit()) {
            setShowUpgradeModal(true);
            return;
        }

        try {
            setLoading(true);
            const newEvent = await api.createEvent({
                name: `${eventToDuplicate.name} (Copy)`,
                date: new Date().toISOString(),
                qr_url: 'https://example.com/qr-placeholder',
            });

            const flowData = eventFlows[eventToDuplicate.id];
            if (flowData) {
                const idMapping: Record<string, string> = {};
                const newNodes = flowData.nodes.map((n: any) => {
                    const newId = `node_${Math.random().toString(36).substring(2, 9)}`;
                    idMapping[n.id] = newId;

                    let newData = { ...n.data };
                    if (n.type === 'start' || newData?.type === 'start' || newData?.triggerType === 'qr') {
                        delete newData.qrDisplayText;
                        delete newData.campaignImage;
                    }

                    return { ...n, id: newId, data: newData };
                });

                const newEdges = flowData.edges.map((e: any) => ({
                    ...e,
                    id: `edge_${Math.random().toString(36).substring(2, 9)}`,
                    source: idMapping[e.source] || e.source,
                    target: idMapping[e.target] || e.target,
                }));

                await api.saveFlow(newEvent.id, {
                    nodes: newNodes,
                    edges: newEdges,
                    isPublished: false,
                });
            }

            loadEvents();
        } catch (err) {
            if (err instanceof Error && err.message === 'plan_limit') {
                setShowUpgradeModal(true);
                setLoading(false);
                return;
            }
            console.error(err);
            alert('Failed to duplicate event');
            setLoading(false);
        }
    };

    const handleClaimLegacy = async () => {
        try {
            setClaimingLegacy(true);
            const result = await api.claimLegacyProjects();
            if (result.migrated > 0) {
                await loadEvents();
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Could not import legacy projects');
        } finally {
            setClaimingLegacy(false);
        }
    };

    const closeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem('givelive_onboarded', 'true');
        setTimeout(() => setIsModalOpen(true), 300); // Automatically open project creation modal
    };

    const closeMobileSidebar = () => mobileSidebar?.close();

    // No width/display utilities here — they're set per usage to avoid
    // conflicting with the responsive wrapper classes (w-full beat w-64 in CSS order).
    const sidebarPanelClass =
        'h-full bg-white border-r border-gray-100 flex flex-col p-4 gap-2 overflow-y-auto';

    const sidebarNav = (
        <>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3 mt-4">Menu</div>

                <Link
                    to="/admin"
                    onClick={closeMobileSidebar}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary font-medium transition text-left mb-2"
                >
                    <Grid size={18} />
                    <span>My Projects</span>
                </Link>

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
                        <div className="px-3 py-2 max-h-[40vh] overflow-y-auto">
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
                                                    handleTemplateClick(template.id);
                                                    closeMobileSidebar();
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
                    to="/analytics"
                    onClick={closeMobileSidebar}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left"
                >
                    <BarChart3 size={18} />
                    <span>Analytics</span>
                </Link>

                {mailAccess && (
                    <Link
                        to="/mail"
                        onClick={closeMobileSidebar}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left"
                    >
                        <Inbox size={18} />
                        <span>Mail</span>
                        {mailUnread > 0 && (
                            <span className="ml-auto bg-primary text-white text-xs font-bold rounded-full px-2 py-0.5">
                                {mailUnread}
                            </span>
                        )}
                    </Link>
                )}

                <Link
                    to="/settings"
                    onClick={closeMobileSidebar}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary transition text-left mt-auto mb-4"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </Link>
        </>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
            <MobileDrawer open={Boolean(mobileSidebar?.isOpen)} onClose={closeMobileSidebar}>
                <div className={`${sidebarPanelClass} w-full`}>{sidebarNav}</div>
            </MobileDrawer>

            {/* Left Sidebar Menu — desktop only */}
            <aside className="hidden lg:block w-64 shrink-0 z-10 h-screen sticky top-0">
                <div className={`${sidebarPanelClass} w-full`}>{sidebarNav}</div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-h-screen lg:h-screen w-full min-w-0">
                <div className="max-w-7xl mx-auto">
                    {loading && (
                        <div className="p-8 text-center text-gray-500">Loading projects...</div>
                    )}
                    {error && !loading && (
                        <div className="p-8 text-center">
                            <div className="text-red-500 mb-4">{error}</div>
                            <button onClick={loadEvents} className="btn-primary">Retry</button>
                        </div>
                    )}
                    {!loading && !error && (
                    <>
                    {/* Onboarding Modal */}
                    {showOnboarding && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                                <div className="p-8 text-center space-y-6">
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2 text-4xl">
                                        👋
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Welcome to GiveLive!</h2>
                                        <p className="text-gray-500 leading-relaxed text-lg">
                                            We are excited to help you start raising more money. Ready to build your first interactive donor journey?
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-4">
                                        <div className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">1</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Create a Project</h4>
                                                <p className="text-sm text-gray-500">Name your campaign to get started.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">2</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Build Your Journey</h4>
                                                <p className="text-sm text-gray-500">Use our visual builder to design your donor experience.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 items-start">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0 mt-0.5">3</div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">Go Live!</h4>
                                                <p className="text-sm text-gray-500">Publish your flow and share your QR Code or link.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeOnboarding}
                                        className="w-full bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-6 py-4 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                                    >
                                        Let's Go! 🚀
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-12">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 sm:mb-2">
                                My Projects
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-lg">Manage your QR Events and Projects</p>
                        </div>
                        <button
                            onClick={openCreateFlow}
                            className="bg-gradient-to-r from-black to-gray-800 hover:from-gray-800 hover:to-black text-white px-5 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <span className="text-xl">+</span> Create Project
                        </button>
                    </div>

                    {/* View Switcher and Filters Bar */}
                    <div className="flex justify-end items-center mb-6 gap-2">
                        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex gap-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('small-grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'small-grid' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Small Grid View"
                            >
                                <Grid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                title="List View"
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Projects Grid/List Container */}
                    <div className={`
                        ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : ''}
                        ${viewMode === 'small-grid' ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : ''}
                        ${viewMode === 'list' ? 'flex flex-col gap-3' : ''}
                    `}>
                        {events.map(event => {
                            const eventUrl = `${window.location.origin}/event/${event.id}`;
                            const flowData = eventFlows[event.id];

                            if (viewMode === 'list') {
                                return (
                                    <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all group flex items-center gap-6">
                                        {/* Small QR/Preview Thumb */}
                                        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 shrink-0">
                                            <QRCode value={eventUrl} size={40} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                    {event.name}
                                                </h2>
                                                {flowData && flowData.isPublished ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span>{formatDate(event.created_at || event.date)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>Updated {formatDate(event.updated_at || event.date).split(',')[0]}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/analytics/${event.id}`}
                                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                                title="Analytics"
                                            >
                                                <BarChart3 size={18} />
                                            </Link>
                                            <button
                                                onClick={(e) => handleDuplicate(event, e)}
                                                className="p-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                                                title="Duplicate Project"
                                            >
                                                <Copy size={18} />
                                            </button>
                                            <Link
                                                to={`/admin/event/${event.id}`}
                                                className="px-5 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                );
                            }

                            if (viewMode === 'small-grid') {
                                return (
                                    <div
                                        key={event.id}
                                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col"
                                    >
                                        {/* Minimized Header with status */}
                                        <div className="p-4 flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="w-10 h-10 bg-white p-1 rounded-lg border border-gray-100 shadow-sm shrink-0">
                                                    <QRCode value={eventUrl} size={32} />
                                                </div>
                                                {flowData && flowData.isPublished ? (
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                                )}
                                            </div>
                                            <h2 className="text-base font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                                                {event.name}
                                            </h2>
                                            <p className="text-[10px] text-gray-500 mb-4">
                                                Updated {formatDate(event.updated_at || event.date).split(',')[0]}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-3 gap-2">
                                            <Link
                                                to={`/analytics/${event.id}`}
                                                className="flex items-center justify-center p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 border border-blue-100 transition-all font-bold text-xs"
                                            >
                                                <BarChart3 size={14} />
                                            </Link>
                                            <button
                                                onClick={(e) => handleDuplicate(event, e)}
                                                className="flex items-center justify-center p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 border border-gray-200 transition-all font-bold text-xs"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <Link
                                                to={`/admin/event/${event.id}`}
                                                className="flex items-center justify-center p-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={event.id}
                                    className="bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                                >
                                    {/* Flow Preview */}
                                    <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200 overflow-hidden">
                                        {flowData ? (
                                            <ReactFlow
                                                nodes={flowData.nodes}
                                                edges={flowData.edges}
                                                nodeTypes={nodeTypes}
                                                fitView
                                                nodesDraggable={false}
                                                nodesConnectable={false}
                                                elementsSelectable={false}
                                                panOnDrag={false}
                                                zoomOnScroll={false}
                                                zoomOnPinch={false}
                                                preventScrolling={false}
                                                proOptions={{ hideAttribution: true }}
                                                className="pointer-events-none"
                                            >
                                                <Background gap={12} size={1} color="#E5E7EB" />
                                            </ReactFlow>
                                        ) : (
                                            // Placeholder if no flow data
                                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                                <div className="text-gray-400 text-sm">No flow created yet</div>
                                            </div>
                                        )}

                                        {/* QR Code overlay */}
                                        <div className="absolute top-4 right-4 bg-white p-2 rounded-xl shadow-lg">
                                            <QRCode value={eventUrl} size={64} />
                                        </div>

                                        {/* Status badge */}
                                        <div className="absolute top-4 left-4">
                                            {flowData && flowData.isPublished ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-green-200 shadow-sm">
                                                    Live
                                                </span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-amber-200 shadow-sm">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                                            {event.name}
                                        </h2>

                                        {/* Metadata */}
                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>Created {formatDate(event.created_at || event.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock size={14} className="text-gray-400" />
                                                <span>Updated {formatDate(event.updated_at || event.date)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <Link
                                                to={`/analytics/${event.id}`}
                                                className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all duration-200"
                                            >
                                                <BarChart3 size={16} />
                                                Analytics
                                            </Link>
                                            <button
                                                onClick={(e) => handleDuplicate(event, e)}
                                                className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all duration-200"
                                            >
                                                <Copy size={16} />
                                                Copy
                                            </button>
                                            <Link
                                                to={`/admin/event/${event.id}`}
                                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200"
                                            >
                                                Manage
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty State */}
                        {events.length === 0 && (
                            <div className="col-span-full">
                                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-300 shadow-sm">
                                    <div className="text-7xl mb-6">🚀</div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No projects yet</h3>
                                    <p className="text-gray-500 mb-8 text-lg">Create your first QR Event project to get started</p>
                                    <button
                                        onClick={openCreateFlow}
                                        className="bg-gradient-to-r from-black to-gray-800 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        Create Project
                                    </button>
                                    <p className="text-sm text-gray-400 mt-6">
                                        Had projects before this update?{' '}
                                        <button
                                            type="button"
                                            onClick={handleClaimLegacy}
                                            disabled={claimingLegacy}
                                            className="text-primary font-medium hover:underline disabled:opacity-50"
                                        >
                                            {claimingLegacy ? 'Importing…' : 'Import them to your account'}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    </>
                    )}
                </div>

                {/* Create Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New Project"
                >
                    <form onSubmit={handleCreateEvent}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                            <input
                                type="text"
                                value={newEventName}
                                onChange={(e) => setNewEventName(e.target.value)}
                                placeholder="e.g. Summer Campaign 2024"
                                className="input-field"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-2xl font-semibold text-gray-600 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newEventName.trim() || creating}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </Modal>

                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    limit={getCampaignLimit(planId) ?? 1}
                />
            </div>
        </div>
    );
}
