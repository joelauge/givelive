import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    Users as UsersIcon,
    Mail,
    Phone,
    Calendar,
    DollarSign,
    Activity,
    ChevronDown,
    ChevronRight,
    QrCode,
    UserPlus,
    Zap,
    Rocket,
    BarChart3,
    ExternalLink,
} from 'lucide-react';
import Logo from '../components/Logo';
import { api } from '../api';

interface User {
    id: string;
    email: string;
    phone_number: string;
    first_name: string;
    last_name: string;
    profile: Record<string, any>;
    total_sessions: number;
    created_at: string;
    last_seen: string;
    submission_count: number;
    total_donated: number;
}

interface GroupedUser {
    key: string;
    name: string;
    email: string;
    phone: string;
    submissions: User[];
    totalSessions: number;
    totalDonated: number;
    firstSeen: string;
    lastSeen: string;
}

type EventStats = {
    scans: number;
    lead_captures: number;
    integration_syncs: number;
    flow_publishes: number;
    donations_total: number;
    active_users: number;
    conversions: number;
};

type OrgAnalytics = Awaited<ReturnType<typeof api.getOrgAnalytics>>;

export default function Analytics() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const isOverview = !eventId;
    const [selectedEvent, setSelectedEvent] = useState(eventId || '');
    const [events, setEvents] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [eventStats, setEventStats] = useState<EventStats | null>(null);
    const [orgAnalytics, setOrgAnalytics] = useState<OrgAnalytics | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (eventId) {
            setSelectedEvent(eventId);
        }
    }, [eventId]);

    useEffect(() => {
        if (isOverview) {
            loadOrgAnalytics();
            return;
        }
        if (selectedEvent) {
            loadUsers();
            loadEventStats();
        }
    }, [selectedEvent, isOverview]);

    const loadEvents = async () => {
        try {
            const eventList = await api.getEvents();
            setEvents(eventList);
        } catch (err) {
            console.error('Failed to load events:', err);
        }
    };

    const loadOrgAnalytics = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const data = await api.getOrgAnalytics();
            setOrgAnalytics(data);
        } catch (err) {
            console.error('Failed to load org analytics:', err);
            setOrgAnalytics(null);
            setLoadError('Could not load account analytics. Try refreshing the page.');
        } finally {
            setLoading(false);
        }
    };

    const loadEventStats = async () => {
        if (!selectedEvent) return;
        try {
            const stats = await api.getEventStats(selectedEvent);
            setEventStats(stats);
        } catch (err) {
            console.error('Failed to load event stats:', err);
            setEventStats(null);
        }
    };

    const loadUsers = async () => {
        if (!selectedEvent) return;

        setLoading(true);
        setLoadError(null);
        try {
            const data = await api.getEventUsers(selectedEvent);
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load users:', err);
            setUsers([]);
            setLoadError(
                err instanceof Error && err.message === 'Unauthorized'
                    ? 'Sign in again to view analytics for this event.'
                    : 'Could not load user data. Try refreshing the page.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Group users by profile (phone/email match = same user profile)
    const groupedUsers = useMemo(() => {
        const groups = new Map<string, GroupedUser>();

        users.forEach(user => {
            // Profile-based grouping: phone or email creates the profile key
            const key = user.phone_number || user.email || user.id;

            if (groups.has(key)) {
                const group = groups.get(key)!;
                group.submissions.push(user);
                group.totalSessions += user.total_sessions || 0;
                group.totalDonated += Number(user.total_donated) || 0;

                // Build up profile data across sessions
                if (!group.name && (user.first_name || user.last_name)) {
                    group.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                }
                if (!group.email && user.email) {
                    group.email = user.email;
                }
                if (!group.phone && user.phone_number) {
                    group.phone = user.phone_number;
                }

                // Update first/last seen
                if (new Date(user.created_at) < new Date(group.firstSeen)) {
                    group.firstSeen = user.created_at;
                }
                if (new Date(user.last_seen) > new Date(group.lastSeen)) {
                    group.lastSeen = user.last_seen;
                }
            } else {
                groups.set(key, {
                    key,
                    name: user.first_name || user.last_name
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : 'Anonymous User',
                    email: user.email,
                    phone: user.phone_number,
                    submissions: [user],
                    totalSessions: user.total_sessions || 0,
                    totalDonated: Number(user.total_donated) || 0,
                    firstSeen: user.created_at,
                    lastSeen: user.last_seen
                });
            }
        });

        return Array.from(groups.values());
    }, [users]);

    const toggleRow = (key: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const exportCSV = async () => {
        if (!selectedEvent) return;
        try {
            const csv = await api.exportEventUsersCsv(selectedEvent);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users-${selectedEvent}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Could not export CSV. Please try again.');
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const totalDonations = groupedUsers.reduce((sum, g) => sum + g.totalDonated, 0);
    const totalSessions = groupedUsers.reduce((sum, g) => sum + g.totalSessions, 0);

    const maxScans = orgAnalytics?.flows.reduce((m, f) => Math.max(m, f.scans), 0) || 1;

    if (isOverview) {
        return (
            <div className="min-h-screen bg-background">
                <div className="bg-surface border-b border-gray-100 p-4 sticky top-0 z-10 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition">
                                <ArrowLeft size={20} />
                            </Link>
                            <div className="flex items-center gap-4">
                                <Logo size="small" />
                                <div className="h-6 w-px bg-gray-200" />
                                <div>
                                    <h1 className="text-lg font-bold text-primary">Account Analytics</h1>
                                    <p className="text-xs text-gray-400">All QR flows · compare performance</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-6">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                            <p className="mt-4">Loading analytics...</p>
                        </div>
                    ) : loadError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm text-red-600 mb-2">{loadError}</p>
                            <button type="button" onClick={loadOrgAnalytics} className="text-sm font-medium text-primary hover:underline">
                                Try again
                            </button>
                        </div>
                    ) : orgAnalytics ? (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                                {[
                                    { label: 'QR Scans', value: orgAnalytics.totals.scans, icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
                                    { label: 'Lead Captures', value: orgAnalytics.totals.lead_captures, icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
                                    { label: 'CRM Syncs', value: orgAnalytics.totals.integration_syncs, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { label: 'Publishes', value: orgAnalytics.totals.flow_publishes, icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-50' },
                                    { label: 'Revenue', value: `$${orgAnalytics.totals.donations_total.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                    { label: 'Scan → Lead', value: `${orgAnalytics.totals.conversion_rate}%`, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                ].map((card) => (
                                    <div key={card.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                                            <card.icon size={18} className={card.color} />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                                        <div className="text-xs text-gray-500">{card.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
                                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-gray-900">Flow comparison</h2>
                                        <p className="text-sm text-gray-500">
                                            {orgAnalytics.totals.published_count} published · {orgAnalytics.totals.flow_count} total projects
                                        </p>
                                    </div>
                                </div>

                                {orgAnalytics.flows.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        <QrCode size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>Create and publish a flow to start tracking scans and leads.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Flow</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Scans</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Leads</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Syncs</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Revenue</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Conv.</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Volume</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {orgAnalytics.flows.map((flow) => (
                                                    <tr key={flow.event_id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="font-medium text-gray-900">{flow.event_name}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {flow.flow_publishes} publish{flow.flow_publishes === 1 ? '' : 'es'}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {flow.is_published ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                                    Published
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                                    Draft
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-medium">{flow.scans}</td>
                                                        <td className="px-4 py-3 text-right font-medium">{flow.lead_captures}</td>
                                                        <td className="px-4 py-3 text-right font-medium">{flow.integration_syncs}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-green-600">${flow.donations_total.toFixed(2)}</td>
                                                        <td className="px-4 py-3 text-right text-sm text-gray-600">{flow.conversion_rate}%</td>
                                                        <td className="px-4 py-3 text-right w-36">
                                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary rounded-full"
                                                                    style={{ width: `${maxScans > 0 ? (flow.scans / maxScans) * 100 : 0}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Link
                                                                to={`/analytics/${flow.event_id}`}
                                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                                            >
                                                                Details <ExternalLink size={12} />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-surface border-b border-gray-100 p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-500 transition">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-4">
                            <Logo size="small" />
                            <div className="h-6 w-px bg-gray-200"></div>
                            <div>
                                <h1 className="text-lg font-bold text-primary">Flow Analytics</h1>
                                <p className="text-xs text-gray-400">Scans, leads, syncs & profiles</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        <Link
                            to="/analytics"
                            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition"
                        >
                            <BarChart3 size={16} />
                            All flows
                        </Link>
                        <select
                            value={selectedEvent}
                            onChange={(e) => navigate(`/analytics/${e.target.value}`)}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary transition"
                        >
                            {events.map(event => (
                                <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                        </select>

                        <button
                            onClick={exportCSV}
                            disabled={users.length === 0}
                            className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {[
                        { label: 'QR Scans', value: eventStats?.scans ?? '—', icon: QrCode, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Lead Captures', value: eventStats?.lead_captures ?? '—', icon: UserPlus, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'CRM Syncs', value: eventStats?.integration_syncs ?? '—', icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Publishes', value: eventStats?.flow_publishes ?? '—', icon: Rocket, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Revenue', value: eventStats ? `$${eventStats.donations_total.toFixed(2)}` : '—', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Scan → Lead', value: eventStats ? `${eventStats.conversions}%` : '—', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map((card) => (
                        <div key={card.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center mb-2`}>
                                <card.icon size={18} className={card.color} />
                            </div>
                            <div className="text-xl font-bold text-gray-900">{card.value}</div>
                            <div className="text-xs text-gray-500">{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                <UsersIcon size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{groupedUsers.length}</div>
                                <div className="text-xs text-gray-500">Unique Profiles</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                                <DollarSign size={20} className="text-green-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">${totalDonations.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">Profile Donations</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                <Activity size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{totalSessions}</div>
                                <div className="text-xs text-gray-500">Total Sessions</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Calendar size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {groupedUsers.length > 0 ? (totalSessions / groupedUsers.length).toFixed(1) : 0}
                                </div>
                                <div className="text-xs text-gray-500">Avg Sessions</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">User Profiles</h2>
                        <p className="text-sm text-gray-500">Profiles built from phone/email across all sessions</p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4">Loading users...</p>
                        </div>
                    ) : loadError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm text-red-600 mb-2">{loadError}</p>
                            <button
                                type="button"
                                onClick={loadUsers}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                Try again
                            </button>
                        </div>
                    ) : groupedUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <UsersIcon size={48} className="mx-auto mb-4 opacity-20 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No user data yet</h3>
                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                Profiles appear here when scanners submit forms, share contact info, or donate on
                                your published flow.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-8"></th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sessions</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Donated</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">First Seen</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {groupedUsers.map(group => (
                                        <>
                                            <tr
                                                key={group.key}
                                                className="hover:bg-gray-50 transition cursor-pointer"
                                                onClick={() => group.submissions.length > 1 && toggleRow(group.key)}
                                            >
                                                <td className="px-4 py-3">
                                                    {group.submissions.length > 1 && (
                                                        <button className="text-gray-400 hover:text-primary transition">
                                                            {expandedRows.has(group.key) ? (
                                                                <ChevronDown size={16} />
                                                            ) : (
                                                                <ChevronRight size={16} />
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-gray-900">{group.name}</div>
                                                    {group.submissions.length > 1 && (
                                                        <div className="text-xs text-primary font-medium">
                                                            {group.submissions.length} submissions
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        {group.email && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Mail size={14} className="text-gray-400" />
                                                                {group.email}
                                                            </div>
                                                        )}
                                                        {group.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Phone size={14} className="text-gray-400" />
                                                                {group.phone}
                                                            </div>
                                                        )}
                                                        {!group.email && !group.phone && (
                                                            <span className="text-xs text-gray-400">No contact info</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-gray-900">{group.totalSessions}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-green-600">
                                                        ${group.totalDonated.toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-600">{formatDate(group.firstSeen)}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm text-gray-600">{formatDate(group.lastSeen)}</div>
                                                </td>
                                            </tr>

                                            {/* Expanded Submissions */}
                                            {expandedRows.has(group.key) && group.submissions.map((submission, idx) => (
                                                <tr key={submission.id} className="bg-gray-50">
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2">
                                                        <div className="text-xs text-gray-500 ml-6">
                                                            └ Submission #{idx + 1}
                                                        </div>
                                                        <div className="text-xs text-gray-400 ml-6">
                                                            ID: {submission.id.slice(0, 8)}...
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2">
                                                        <div className="text-xs text-gray-600">{submission.total_sessions || 0}</div>
                                                        <div className="text-xs text-gray-400">{submission.submission_count || 0} subs</div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="text-xs text-green-600">
                                                            ${Number(submission.total_donated || 0).toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="text-xs text-gray-600">{formatDate(submission.created_at)}</div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="text-xs text-gray-600">{formatDate(submission.last_seen)}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Integration Placeholders */}
                <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Export & Integrations</h3>
                    <p className="text-sm text-gray-500 mb-4">Sync your user data with your favorite marketing platforms</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Mailchimp', 'Constant Contact', 'HubSpot', 'Salesforce'].map(platform => (
                            <button
                                key={platform}
                                onClick={() => alert(`${platform} integration coming soon!`)}
                                className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 text-gray-400 hover:text-primary transition text-sm font-medium"
                            >
                                <div className="text-2xl mb-2">🔌</div>
                                {platform}
                                <div className="text-xs mt-1">Coming Soon</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
