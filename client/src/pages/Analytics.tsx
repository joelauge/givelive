import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Users as UsersIcon, Mail, Phone, Calendar, DollarSign, Activity, ChevronDown, ChevronRight } from 'lucide-react';
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

export default function Analytics() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [selectedEvent, setSelectedEvent] = useState(eventId || '');
    const [events, setEvents] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        // If URL param changes, update state
        if (eventId) {
            setSelectedEvent(eventId);
        }
    }, [eventId]);

    useEffect(() => {
        if (selectedEvent) {
            loadUsers();
        }
    }, [selectedEvent]);

    const loadEvents = async () => {
        try {
            const eventList = await api.getEvents();
            setEvents(eventList);

            // If no event selected via URL, select the first one and navigate
            if (!eventId && eventList.length > 0) {
                const firstEventId = eventList[0].id;
                setSelectedEvent(firstEventId);
                // navigate(`/analytics/${firstEventId}`, { replace: true });
                navigate(`/analytics/${firstEventId}`, { replace: true });
            }
        } catch (err) {
            console.error('Failed to load events:', err);
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
                                <h1 className="text-lg font-bold text-primary">Analytics</h1>
                                <p className="text-xs text-gray-400">User Profiles & Engagement</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 items-center">
                        {/* Event Filter */}
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
                {/* Stats Cards */}
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
                                <div className="text-xs text-gray-500">Total Donated</div>
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
