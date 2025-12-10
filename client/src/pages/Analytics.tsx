import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Users as UsersIcon, Mail, Phone, Calendar, DollarSign, Activity } from 'lucide-react';
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

export default function Analytics() {
    const [selectedEvent, setSelectedEvent] = useState('');
    const [events, setEvents] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        if (selectedEvent) {
            loadUsers();
        }
    }, [selectedEvent]);

    const loadEvents = async () => {
        try {
            const eventList = await api.getEvents();
            setEvents(eventList);
            if (eventList.length > 0) {
                setSelectedEvent(eventList[0].id);
            }
        } catch (err) {
            console.error('Failed to load events:', err);
        }
    };

    const loadUsers = async () => {
        if (!selectedEvent) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/users/event/${selectedEvent}`);

            if (!response.ok) {
                // Database tables might not exist yet
                console.error('Failed to load users:', response.status);
                setUsers([]); // Set empty array instead of crashing
                return;
            }

            const data = await response.json();

            // Ensure we got an array
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error('Expected array, got:', data);
                setUsers([]);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            setUsers([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!selectedEvent) return;
        window.open(`/api/users/event/${selectedEvent}/export`, '_blank');
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

    const totalDonations = users.reduce((sum, u) => sum + (Number(u.total_donated) || 0), 0);
    const totalSessions = users.reduce((sum, u) => sum + (u.total_sessions || 0), 0);

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
                            onChange={(e) => setSelectedEvent(e.target.value)}
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
                                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                                <div className="text-xs text-gray-500">Total Users</div>
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
                                    {users.length > 0 ? (totalSessions / users.length).toFixed(1) : 0}
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
                        <p className="text-sm text-gray-500">All users who have interacted with this event</p>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-12 text-center">
                            <UsersIcon size={48} className="mx-auto mb-4 opacity-20 text-gray-400" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No User Data Yet</h3>
                            <p className="text-sm text-gray-500 mb-4">User profiles will appear here once people start interacting with your events.</p>

                            <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                                <p className="text-xs font-bold text-blue-900 mb-2">📋 Database Setup Required</p>
                                <p className="text-xs text-blue-700 mb-3">
                                    To enable user tracking, run the database migration:
                                </p>
                                <code className="block bg-blue-100 text-blue-900 px-3 py-2 rounded text-[10px] font-mono">
                                    psql $DATABASE_URL -f server/src/db/migrations/002_user_profiles.sql
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sessions</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Donated</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">First Seen</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Last Seen</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {user.first_name || user.last_name
                                                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                                        : 'Anonymous User'}
                                                </div>
                                                <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    {user.email && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Mail size={14} className="text-gray-400" />
                                                            {user.email}
                                                        </div>
                                                    )}
                                                    {user.phone_number && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Phone size={14} className="text-gray-400" />
                                                            {user.phone_number}
                                                        </div>
                                                    )}
                                                    {!user.email && !user.phone_number && (
                                                        <span className="text-xs text-gray-400">No contact info</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">{user.total_sessions || 0}</div>
                                                <div className="text-xs text-gray-500">{user.submission_count || 0} submissions</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-green-600">
                                                    ${Number(user.total_donated || 0).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-600">{formatDate(user.created_at)}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-600">{formatDate(user.last_seen)}</div>
                                            </td>
                                        </tr>
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
