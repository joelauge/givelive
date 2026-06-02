import { query } from '../db';

async function run() {
    try {
        console.log('Adding is_published column to events table...');
        await query(`
            ALTER TABLE events
            ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
        `);
        console.log('Column added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add column:', err);
        process.exit(1);
    }
}

run();
