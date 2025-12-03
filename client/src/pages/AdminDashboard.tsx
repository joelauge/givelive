import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/events`);
            if (!res.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError('Could not load events. Please check if the server is running and database is connected.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const createEvent = async () => {
        const name = prompt('Event Name:');
        if (!name) return;

        try {
            const res = await fetch('http://localhost:3000/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    org_id: 'default-org', // Mock org ID
                    name,
                    date: new Date().toISOString(),
                    qr_url: 'https://example.com/qr-placeholder'
                })
            });
            if (res.ok) {
                loadEvents();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading events...</div>;
    if (error) return (
        <div className="p-8 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button onClick={loadEvents} className="btn-primary">Retry</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-primary mb-1">My Events</h1>
                        <p className="text-gray-500">Manage your fundraising campaigns</p>
                    </div>
                    <button
                        onClick={createEvent}
                        className="btn-primary flex items-center gap-2"
                    >
                        <span>+</span> Create Event
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event.id} className="card hover:shadow-lg transition-shadow duration-300 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-accent-blue/20 text-accent-blue rounded-2xl flex items-center justify-center font-bold text-xl">
                                    {event.name.charAt(0)}
                                </div>
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                    Active
                                </span>
                            </div>

                            <h2 className="text-xl font-bold mb-2 text-primary group-hover:text-blue-600 transition-colors">{event.name}</h2>
                            <p className="text-gray-400 text-sm mb-6 flex items-center gap-2">
                                <span>📅</span> {new Date(event.date).toLocaleDateString()}
                            </p>

                            <div className="flex gap-3 mt-auto">
                                <Link
                                    to={`/event/${event.id}`}
                                    className="flex-1 bg-gray-50 text-gray-700 py-2 rounded-xl text-center text-sm font-semibold hover:bg-gray-100 transition"
                                >
                                    Preview
                                </Link>
                                <Link
                                    to={`/admin/event/${event.id}`}
                                    className="flex-1 bg-primary text-white py-2 rounded-xl text-center text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
                                >
                                    Manage
                                </Link>
                            </div>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                            <div className="text-6xl mb-4">✨</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
                            <p className="text-gray-500 mb-6">Create your first event to get started</p>
                            <button
                                onClick={createEvent}
                                className="btn-secondary"
                            >
                                Create Event
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
