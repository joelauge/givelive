import { query } from '../db';

export type AnalyticsAction =
    | 'scan'
    | 'lead_capture'
    | 'flow_published'
    | 'integration_sync'
    | 'sent'
    | 'clicked'
    | 'reply_received'
    | 'donation';

export async function trackAnalyticsEvent(params: {
    event_id: string;
    action: AnalyticsAction | string;
    user_id?: string | null;
    node_id?: string | null;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    const { event_id, action, user_id, node_id, metadata } = params;
    try {
        await query(
            `INSERT INTO analytics_events (event_id, user_id, node_id, action, metadata)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                event_id,
                user_id || null,
                node_id || null,
                action,
                JSON.stringify(metadata || {}),
            ]
        );
    } catch (err) {
        console.error('[Analytics] Failed to track event:', action, event_id, err);
    }
}

export type FlowMetrics = {
    event_id: string;
    event_name: string;
    is_published: boolean;
    scans: number;
    lead_captures: number;
    integration_syncs: number;
    flow_publishes: number;
    donations_total: number;
    conversion_rate: number;
};

export async function getEventMetrics(eventId: string): Promise<{
    scans: number;
    lead_captures: number;
    integration_syncs: number;
    flow_publishes: number;
    donations_total: number;
    active_users: number;
}> {
    const statsRes = await query(
        `SELECT
            COUNT(*) FILTER (WHERE action = 'scan')::int AS scans,
            COUNT(*) FILTER (WHERE action = 'lead_capture')::int AS lead_captures,
            COUNT(*) FILTER (WHERE action = 'integration_sync')::int AS integration_syncs,
            COUNT(*) FILTER (WHERE action = 'flow_published')::int AS flow_publishes
         FROM analytics_events
         WHERE event_id = $1`,
        [eventId]
    );

    const revenueRes = await query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total FROM donations WHERE event_id = $1`,
        [eventId]
    );

    const usersRes = await query(
        `SELECT COUNT(DISTINCT id)::int AS count FROM users WHERE event_id = $1`,
        [eventId]
    );

    const row = statsRes.rows[0] || {};

    return {
        scans: Number(row.scans) || 0,
        lead_captures: Number(row.lead_captures) || 0,
        integration_syncs: Number(row.integration_syncs) || 0,
        flow_publishes: Number(row.flow_publishes) || 0,
        donations_total: Number(revenueRes.rows[0]?.total) || 0,
        active_users: Number(usersRes.rows[0]?.count) || 0,
    };
}

export async function getOrgFlowMetrics(orgId: string): Promise<{
    totals: {
        scans: number;
        lead_captures: number;
        integration_syncs: number;
        flow_publishes: number;
        donations_total: number;
        flow_count: number;
        published_count: number;
    };
    flows: FlowMetrics[];
}> {
    const flowsRes = await query(
        `SELECT
            e.id AS event_id,
            e.name AS event_name,
            COALESCE(e.is_published, false) AS is_published,
            COUNT(ae.id) FILTER (WHERE ae.action = 'scan')::int AS scans,
            COUNT(ae.id) FILTER (WHERE ae.action = 'lead_capture')::int AS lead_captures,
            COUNT(ae.id) FILTER (WHERE ae.action = 'integration_sync')::int AS integration_syncs,
            COUNT(ae.id) FILTER (WHERE ae.action = 'flow_published')::int AS flow_publishes,
            COALESCE((
                SELECT SUM(d.amount)::float FROM donations d WHERE d.event_id = e.id
            ), 0) AS donations_total
         FROM events e
         LEFT JOIN analytics_events ae ON ae.event_id = e.id
         WHERE e.org_id = $1
         GROUP BY e.id, e.name, e.is_published
         ORDER BY scans DESC, e.name ASC`,
        [orgId]
    );

    const flows: FlowMetrics[] = flowsRes.rows.map((row) => {
        const scans = Number(row.scans) || 0;
        const lead_captures = Number(row.lead_captures) || 0;
        return {
            event_id: row.event_id,
            event_name: row.event_name,
            is_published: Boolean(row.is_published),
            scans,
            lead_captures,
            integration_syncs: Number(row.integration_syncs) || 0,
            flow_publishes: Number(row.flow_publishes) || 0,
            donations_total: Number(row.donations_total) || 0,
            conversion_rate: scans > 0 ? Math.round((lead_captures / scans) * 1000) / 10 : 0,
        };
    });

    const totals = flows.reduce(
        (acc, f) => ({
            scans: acc.scans + f.scans,
            lead_captures: acc.lead_captures + f.lead_captures,
            integration_syncs: acc.integration_syncs + f.integration_syncs,
            flow_publishes: acc.flow_publishes + f.flow_publishes,
            donations_total: acc.donations_total + f.donations_total,
            flow_count: acc.flow_count + 1,
            published_count: acc.published_count + (f.is_published ? 1 : 0),
        }),
        {
            scans: 0,
            lead_captures: 0,
            integration_syncs: 0,
            flow_publishes: 0,
            donations_total: 0,
            flow_count: 0,
            published_count: 0,
        }
    );

    return { totals, flows };
}
