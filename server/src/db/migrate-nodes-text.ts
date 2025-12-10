
import { query } from './index';

async function run() {
    try {
        console.log('🔄 Starting migration to TEXT ids and removing type constraints...');

        // 1. Drop constraints that depend on UUIDs
        await query(`ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_current_node_id_fkey`);
        await query(`ALTER TABLE events DROP CONSTRAINT IF EXISTS events_root_node_id_fkey`); // if it existed (it wasn't in schema but good to check)

        // 2. Modify ID columns to TEXT
        // We need to cast existing UUIDs to TEXT
        await query(`ALTER TABLE journey_nodes ALTER COLUMN id TYPE TEXT`);
        await query(`ALTER TABLE events ALTER COLUMN root_node_id TYPE TEXT`);
        await query(`ALTER TABLE user_progress ALTER COLUMN current_node_id TYPE TEXT`);

        // 3. Remove CHECK constraint on journey_nodes.type
        await query(`ALTER TABLE journey_nodes DROP CONSTRAINT IF EXISTS journey_nodes_type_check`);

        console.log('✅ Migration successful');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

run();
