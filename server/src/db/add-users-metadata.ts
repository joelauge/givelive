import { query } from './index';

async function migrate() {
    console.log('Adding metadata column to users table...');
    try {
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT');
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT');
        console.log('✅ Successfully updated users table.');
    } catch (err: any) {
        console.error('❌ Failed to update users table:', err.message);
        process.exit(1);
    }
}

migrate();
