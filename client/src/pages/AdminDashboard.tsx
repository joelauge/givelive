import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            // We need an endpoint to list events. 
            // Assuming api.getEvents() exists or we add it.
            // For now, let's mock it or fetch from the endpoint we created (GET /events)
            const res = await fetch('http://localhost:3000/events');
            const data = await res.json();
            setEvents(data);
        } catch (err) {
            console.error(err);
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

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
                    <button
                        onClick={createEvent}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        + Create Event
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                            <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
                            <p className="text-gray-500 text-sm mb-4">
                                {new Date(event.date).toLocaleDateString()}
                            </p>
                            <div className="flex justify-between items-center mt-4">
                                <Link
                                    to={`/event/${event.id}`}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View Funnel
                                </Link>
                                <Link
                                    to={`/admin/event/${event.id}`}
                                    className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                                >
                                    Manage &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}

                    {events.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No events found. Create one to get started!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
