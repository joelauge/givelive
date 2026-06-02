export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

export const api = {
    getEvent: async (id: string) => {
        const res = await fetch(`${API_URL}/events/${id}`);
        if (!res.ok) throw new Error('Failed to fetch event');
        return res.json();
    },

    getEvents: async () => {
        const res = await fetch(`${API_URL}/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    createEvent: async (data: { name: string; org_id: string; date: string; qr_url: string;[key: string]: any }) => {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create event');
        return res.json();
    },

    updateEvent: async (id: string, data: { name?: string;[key: string]: any }) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update event');
        return res.json();
    },

    startJourney: async (eventId: string, phoneNumber?: string) => {
        const res = await fetch(`${API_URL}/journey/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, phone_number: phoneNumber }),
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to start journey');
        }
        return res.json();
    },

    getNode: async (eventId: string) => {
        // This might need to be adjusted to get a specific node or next node
        // For now, let's assume we fetch all nodes and filter client side or have a specific endpoint
        const res = await fetch(`${API_URL}/journey/${eventId}/nodes`);
        if (!res.ok) throw new Error('Failed to fetch nodes');
        return res.json();
    },

    publishJourney: async (eventId: string, data: { nodes: any[], edges: any[] }) => {
        const res = await fetch(`${API_URL}/journey/${eventId}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const message = body.error || 'Failed to publish journey';
            const err = new Error(message) as Error & { validationErrors?: string[] };
            err.validationErrors = body.validationErrors;
            throw err;
        }
        return res.json();
    },

    saveFlow: async (eventId: string, data: { nodes: any[], edges: any[], isPublished?: boolean }) => {
        const res = await fetch(`${API_URL}/events/${eventId}/flow`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to save flow');
        return res.json();
    },

    getFlow: async (eventId: string) => {
        const res = await fetch(`${API_URL}/events/${eventId}/flow`);
        if (!res.ok) {
            if (res.status === 404) return null; // No flow saved yet
            throw new Error('Failed to fetch flow');
        }
        return res.json();
    },

    testConnection: async (data: { type: string; config: any }) => {
        const res = await fetch(`${API_URL}/journey/test-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to test connection');
        return res.json();
    },

    syncLead: async (data: { userId: string; nodeId: string }) => {
        const res = await fetch(`${API_URL}/journey/sync-lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to sync lead');
        return res.json();
    },

    deleteEvent: async (id: string) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete event');
        return res.json();
    }
};
