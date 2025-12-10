export interface Event {
    id: string;
    org_id: string;
    name: string;
    date?: string;
    qr_url?: string;
    root_node_id?: string;
    created_at?: string;
    updated_at?: string;
}

export interface JourneyNode {
    id: string;
    event_id: string;
    type: 'start' | 'page' | 'sms' | 'email' | 'delay' | 'condition' | 'donation' | 'end';
    config?: Record<string, any>;
    next_nodes?: any[];
    created_at?: string;
}

export interface UserProgress {
    id: string;
    user_id: string;
    event_id: string;
    current_node_id: string;
    status: string;
    created_at?: string;
    updated_at?: string;
}
