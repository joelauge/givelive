import { FastifyInstance } from 'fastify';
import { query } from '../db';

interface UpdateProfileBody {
    event_id: string;
    user_id?: string;
    phone_number?: string;
    email?: string;
    form_data: Record<string, any>;
    node_id?: string;
    session_id?: string;
}

export default async function userRoutes(server: FastifyInstance) {
    // Update/merge user profile with new form data
    server.post<{ Body: UpdateProfileBody }>('/users/profile', async (request, reply) => {
        try {
            const { event_id, user_id, phone_number, email, form_data, node_id, session_id } = request.body;

            let userId = user_id;
            let isNewUser = false;

            // Find or create user
            if (!userId) {
                // Try to find existing user by phone or email
                let existingUser;
                if (phone_number) {
                    const result = await query(
                        'SELECT * FROM users WHERE phone_number = $1 AND event_id = $2 LIMIT 1',
                        [phone_number, event_id]
                    );
                    existingUser = result.rows[0];
                }

                if (!existingUser && email) {
                    const result = await query(
                        'SELECT * FROM users WHERE email = $1 AND event_id = $2 LIMIT 1',
                        [email, event_id]
                    );
                    existingUser = result.rows[0];
                }

                if (existingUser) {
                    userId = existingUser.id;
                    // Increment session count
                    await query(
                        'UPDATE users SET total_sessions = total_sessions + 1, last_seen = NOW() WHERE id = $1',
                        [userId]
                    );
                } else {
                    // Create new user
                    const createResult = await query(
                        'INSERT INTO users (event_id, phone_number, email, first_name, last_name, profile, total_sessions) VALUES ($1, $2, $3, $4, $5, $6, 1) RETURNING *',
                        [
                            event_id,
                            form_data.phone || phone_number || null,
                            form_data.email || email || null,
                            form_data.name || form_data.first_name || null,
                            form_data.last_name || null,
                            JSON.stringify(form_data)
                        ]
                    );
                    userId = createResult.rows[0].id;
                    isNewUser = true;
                }
            }

            // Record form submission
            await query(
                'INSERT INTO form_submissions (user_id, event_id, node_id, form_data, session_id) VALUES ($1, $2, $3, $4, $5)',
                [userId, event_id, node_id || 'unknown', JSON.stringify(form_data), session_id || null]
            );

            // Merge new data into profile
            if (!isNewUser) {
                const userResult = await query('SELECT profile FROM users WHERE id = $1', [userId]);
                const currentProfile = userResult.rows[0]?.profile || {};
                const mergedProfile = { ...currentProfile, ...form_data };

                await query(
                    `UPDATE users SET 
                        profile = $1,
                        email = COALESCE(email, $2),
                        phone_number = COALESCE(phone_number, $3),
                        first_name = COALESCE(first_name, $4),
                        last_name = COALESCE(last_name, $5),
                        last_seen = NOW()
                    WHERE id = $6`,
                    [
                        JSON.stringify(mergedProfile),
                        form_data.email || email || null,
                        form_data.phone || phone_number || null,
                        form_data.name || form_data.first_name || null,
                        form_data.last_name || null,
                        userId
                    ]
                );
            }

            return { success: true, user_id: userId, is_new_user: isNewUser };
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get all users for an event (for analytics)
    server.get<{ Params: { eventId: string } }>('/users/event/:eventId', async (request, reply) => {
        try {
            const { eventId } = request.params;
            const result = await query(
                `SELECT 
                    u.id,
                    u.email,
                    u.phone_number,
                    u.first_name,
                    u.last_name,
                    u.profile,
                    u.total_sessions,
                    u.created_at,
                    u.last_seen,
                    COUNT(DISTINCT fs.id) as submission_count,
                    COALESCE(SUM(d.amount), 0) as total_donated
                FROM users u
                LEFT JOIN form_submissions fs ON u.id = fs.user_id
                LEFT JOIN donations d ON u.id = d.user_id
                WHERE u.event_id = $1
                GROUP BY u.id
                ORDER BY u.created_at DESC`,
                [eventId]
            );
            return result.rows;
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Export users as CSV
    server.get<{ Params: { eventId: string } }>('/users/event/:eventId/export', async (request, reply) => {
        try {
            const { eventId } = request.params;
            const result = await query(
                `SELECT 
                    u.email,
                    u.phone_number,
                    u.first_name,
                    u.last_name,
                    u.profile,
                    u.created_at,
                    u.last_seen,
                    u.total_sessions,
                    COALESCE(SUM(d.amount), 0) as total_donated
                FROM users u
                LEFT JOIN donations d ON u.id = d.user_id
                WHERE u.event_id = $1
                GROUP BY u.id
                ORDER BY u.created_at DESC`,
                [eventId]
            );

            // Convert to CSV
            const users = result.rows;
            if (users.length === 0) {
                reply.type('text/csv');
                return 'No users found';
            }

            // Extract all possible profile keys
            const allKeys = new Set<string>();
            users.forEach(user => {
                if (user.profile) {
                    Object.keys(user.profile).forEach(key => allKeys.add(key));
                }
            });

            const headers = [
                'Email',
                'Phone',
                'First Name',
                'Last Name',
                'Created At',
                'Last Seen',
                'Total Sessions',
                'Total Donated',
                ...Array.from(allKeys)
            ];

            const csvRows = [headers.join(',')];

            users.forEach(user => {
                const row = [
                    user.email || '',
                    user.phone_number || '',
                    user.first_name || '',
                    user.last_name || '',
                    user.created_at || '',
                    user.last_seen || '',
                    user.total_sessions || 0,
                    user.total_donated || 0,
                    ...Array.from(allKeys).map(key => user.profile?.[key] || '')
                ].map(value => `"${String(value).replace(/"/g, '""')}"`);

                csvRows.push(row.join(','));
            });

            reply.type('text/csv');
            reply.header('Content-Disposition', `attachment; filename="users-${eventId}.csv"`);
            return csvRows.join('\n');
        } catch (err) {
            server.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
