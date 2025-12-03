const API_URL = 'http://localhost:3000';

export const api = {
    getEvent: async (id: string) => {
        const res = await fetch(`${API_URL}/events/${id}`);
        if (!res.ok) throw new Error('Failed to fetch event');
        return res.json();
    },

    startJourney: async (eventId: string, phoneNumber?: string) => {
        const res = await fetch(`${API_URL}/journey/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, phone_number: phoneNumber }),
        });
        if (!res.ok) throw new Error('Failed to start journey');
        return res.json();
    },

    getNode: async (eventId: string) => {
        // This might need to be adjusted to get a specific node or next node
        // For now, let's assume we fetch all nodes and filter client side or have a specific endpoint
        const res = await fetch(`${API_URL}/journey/${eventId}/nodes`);
        if (!res.ok) throw new Error('Failed to fetch nodes');
        return res.json();
    }
};
