import { query } from './index';

async function applyCascades() {
    console.log('🚀 Applying missing ON DELETE CASCADE constraints...');

    const transformations = [
        {
            table: 'users',
            column: 'event_id',
            references: 'events(id)',
            constraint: 'users_event_id_fkey'
        },
        {
            table: 'user_progress',
            column: 'current_node_id',
            references: 'journey_nodes(id)',
            constraint: 'user_progress_current_node_id_fkey'
        },
        {
            table: 'donations',
            column: 'user_id',
            references: 'users(id)',
            constraint: 'donations_user_id_fkey'
        },
        {
            table: 'donations',
            column: 'event_id',
            references: 'events(id)',
            constraint: 'donations_event_id_fkey'
        }
    ];

    for (const t of transformations) {
        try {
            console.log(`- Updating ${t.table}.${t.column}...`);

            // 1. Try to find the actual constraint name if it's not the default
            const findConstraintSql = `
                SELECT constraint_name 
                FROM information_schema.key_column_usage 
                WHERE table_name = $1 AND column_name = $2 
                AND table_schema = 'public'
                AND constraint_name LIKE '%_fkey'
            `;
            const constraintRes = await query(findConstraintSql, [t.table, t.column]);
            const actualConstraint = constraintRes.rows[0]?.constraint_name || t.constraint;

            // 2. Drop and Re-add
            await query(`ALTER TABLE ${t.table} DROP CONSTRAINT IF EXISTS "${actualConstraint}"`);
            await query(`ALTER TABLE ${t.table} ADD CONSTRAINT "${actualConstraint}" FOREIGN KEY (${t.column}) REFERENCES ${t.references} ON DELETE CASCADE`);

            console.log(`  ✅ Success`);
        } catch (err: any) {
            console.error(`  ❌ Failed to update ${t.table}.${t.column}:`, err.message);
        }
    }

    console.log('✨ All migrations complete!');
    process.exit(0);
}

applyCascades().catch(err => {
    console.error('💥 Migration failed:', err);
    process.exit(1);
});
