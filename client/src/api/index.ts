export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

import { buildAuthHeaders } from './authHeaders';

export const api = {
    getEvent: async (id: string) => {
        const res = await fetch(`${API_URL}/events/${id}`);
        if (!res.ok) throw new Error('Failed to fetch event');
        return res.json();
    },

    checkEmbeddable: async (url: string): Promise<{ embeddable: boolean; reason?: string }> => {
        const res = await fetch(`${API_URL}/embed/check?url=${encodeURIComponent(url)}`);
        if (!res.ok) return { embeddable: false, reason: 'check-failed' };
        return res.json();
    },

    getEvents: async () => {
        const res = await fetch(`${API_URL}/events`, {
            headers: await buildAuthHeaders(),
        });
        if (res.status === 401) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    claimLegacyProjects: async () => {
        const res = await fetch(`${API_URL}/events/claim-legacy`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message || body.error || 'Failed to import legacy projects');
        return body as { migrated: number; message: string };
    },

    createEvent: async (data: { name: string; date: string; qr_url: string; org_id?: string;[key: string]: any }) => {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
            body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error('Unauthorized');
        if (res.status === 403 && body.error === 'plan_limit') {
            throw new Error('plan_limit');
        }
        if (!res.ok) throw new Error(body.message || 'Failed to create event');
        return body;
    },

    updateEvent: async (id: string, data: { name?: string;[key: string]: any }) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'PUT',
            headers: await buildAuthHeaders(),
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
        const res = await fetch(`${API_URL}/journey/${eventId}/nodes`);
        if (!res.ok) throw new Error('Failed to fetch nodes');
        return res.json();
    },

    publishJourney: async (eventId: string, data: { nodes: any[]; edges: any[] }) => {
        const res = await fetch(`${API_URL}/journey/${eventId}/publish`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
            body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 403 && body.error === 'plan_limit') {
            const err = new Error('plan_limit') as Error & { planLimit?: boolean };
            err.planLimit = true;
            throw err;
        }
        if (!res.ok) {
            const message = body.error || 'Failed to publish journey';
            const err = new Error(message) as Error & { validationErrors?: string[] };
            err.validationErrors = body.validationErrors;
            throw err;
        }
        return body;
    },

    checkCanPublish: async (orgId: string, eventId: string) => {
        const res = await fetch(
            `${API_URL}/billing/can-publish?org_id=${encodeURIComponent(orgId)}&event_id=${encodeURIComponent(eventId)}`,
            { headers: await buildAuthHeaders() }
        );
        if (!res.ok) throw new Error('Failed to check publish limit');
        return res.json() as Promise<{
            canPublish: boolean;
            planId: string;
            limit: number | null;
            publishedCount: number;
        }>;
    },

    saveFlow: async (eventId: string, data: { nodes: any[]; edges: any[]; isPublished?: boolean }) => {
        const res = await fetch(`${API_URL}/events/${eventId}/flow`, {
            method: 'PUT',
            headers: await buildAuthHeaders(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to save flow');
        return res.json();
    },

    getFlow: async (eventId: string) => {
        const res = await fetch(`${API_URL}/events/${eventId}/flow`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error('Failed to fetch flow');
        }
        return res.json();
    },

    testConnection: async (data: { type: string; config: any }) => {
        const res = await fetch(`${API_URL}/journey/test-connection`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
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

    getEventStats: async (eventId: string) => {
        const res = await fetch(`${API_URL}/analytics/${eventId}/stats`, {
            headers: await buildAuthHeaders(),
        });
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to load event stats');
        return res.json() as Promise<{
            scans: number;
            lead_captures: number;
            integration_syncs: number;
            flow_publishes: number;
            donations_total: number;
            active_users: number;
            conversions: number;
        }>;
    },

    getOrgAnalytics: async () => {
        const res = await fetch(`${API_URL}/analytics/org/overview`, {
            headers: await buildAuthHeaders(),
        });
        if (res.status === 401 || res.status === 403) throw new Error('Unauthorized');
        if (!res.ok) throw new Error('Failed to load account analytics');
        return res.json() as Promise<{
            totals: {
                scans: number;
                lead_captures: number;
                integration_syncs: number;
                flow_publishes: number;
                donations_total: number;
                flow_count: number;
                published_count: number;
                conversion_rate: number;
            };
            flows: Array<{
                event_id: string;
                event_name: string;
                is_published: boolean;
                scans: number;
                lead_captures: number;
                integration_syncs: number;
                flow_publishes: number;
                donations_total: number;
                conversion_rate: number;
            }>;
        }>;
    },

    getEventUsers: async (eventId: string) => {
        const res = await fetch(`${API_URL}/users/event/${eventId}`, {
            headers: await buildAuthHeaders(),
        });
        if (res.status === 401 || res.status === 403) {
            throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error('Failed to load users');
        return res.json();
    },

    exportEventUsersCsv: async (eventId: string) => {
        const res = await fetch(`${API_URL}/users/event/${eventId}/export`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to export users');
        return res.text();
    },

    deleteEvent: async (id: string) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to delete event');
        return res.json();
    },

    getBillingStatus: async (orgId: string) => {
        const res = await fetch(`${API_URL}/billing/status?org_id=${encodeURIComponent(orgId)}`, {
            headers: await buildAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load billing status');
        return res.json();
    },

    getBillingPlansAvailable: async () => {
        const res = await fetch(`${API_URL}/billing/plans-available`);
        if (!res.ok) throw new Error('Failed to load billing plans');
        return res.json();
    },

    createBillingCheckout: async (data: {
        org_id: string;
        plan_id: 'starter' | 'growth' | 'pro';
        email?: string;
        name?: string;
        include_ai_addon?: boolean;
    }) => {
        const res = await fetch(`${API_URL}/billing/checkout`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
            body: JSON.stringify(data),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Failed to start checkout');
        return body as { url: string; sessionId: string };
    },

    createBillingPortal: async (orgId: string) => {
        const res = await fetch(`${API_URL}/billing/portal`, {
            method: 'POST',
            headers: await buildAuthHeaders(),
            body: JSON.stringify({ org_id: orgId }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || 'Failed to open billing portal');
        return body as { url: string };
    },
};
