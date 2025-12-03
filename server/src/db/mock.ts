import { v4 as uuidv4 } from 'uuid';

interface MockDB {
    events: any[];
    users: any[];
    user_progress: any[];
    donations: any[];
    journey_nodes: any[];
}

const db: MockDB = {
    events: [],
    users: [],
    user_progress: [],
    donations: [],
    journey_nodes: []
};

// Helper to simulate Postgres result format
const result = (rows: any[]) => ({ rows, rowCount: rows.length });

export const mockQuery = async (text: string, params: any[] = []) => {
    const sql = text.trim().toUpperCase();
    console.log(`[MockDB] Executing: ${text}`, params);

    // EVENTS
    if (sql.startsWith('SELECT * FROM EVENTS')) {
        if (sql.includes('WHERE ID = $1')) {
            const event = db.events.find(e => e.id === params[0]);
            return result(event ? [event] : []);
        }
        return result([...db.events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }

    if (sql.startsWith('INSERT INTO EVENTS')) {
        const [org_id, name, date, qr_url, root_node_id] = params;
        const newEvent = {
            id: uuidv4(),
            org_id,
            name,
            date,
            qr_url,
            root_node_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        db.events.push(newEvent);
        return result([newEvent]);
    }

    // JOURNEY NODES
    if (sql.startsWith('SELECT * FROM JOURNEY_NODES')) {
        if (sql.includes('WHERE EVENT_ID = $1')) {
            return result(db.journey_nodes.filter(n => n.event_id === params[0]));
        }
    }

    // USERS & PROGRESS (Simplified for MVP)
    if (sql.startsWith('INSERT INTO USERS')) {
        const [event_id, phone_number] = params;
        const newUser = { id: uuidv4(), event_id, phone_number, created_at: new Date().toISOString() };
        db.users.push(newUser);
        return result([newUser]);
    }

    if (sql.startsWith('INSERT INTO USER_PROGRESS')) {
        const [user_id, event_id, current_node_id] = params;
        const progress = { id: uuidv4(), user_id, event_id, current_node_id, updated_at: new Date().toISOString() };
        db.user_progress.push(progress);
        return result([progress]);
    }

    // DONATIONS
    if (sql.startsWith('INSERT INTO DONATIONS')) {
        const [event_id, user_id, amount, recurring, stripe_charge_id] = params;
        const donation = { id: uuidv4(), event_id, user_id, amount, recurring, stripe_charge_id, created_at: new Date().toISOString() };
        db.donations.push(donation);
        return result([donation]);
    }

    console.warn('[MockDB] Unhandled query:', text);
    return result([]);
};
