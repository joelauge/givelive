import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const fixDb = async () => {
    console.log('Fixing database schema...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Alter the column type from UUID to TEXT
        await pool.query('ALTER TABLE events ALTER COLUMN org_id TYPE TEXT;');
        console.log('✅ Successfully changed org_id to TEXT.');
    } catch (err) {
        console.error('❌ Failed to alter table:', err);
    } finally {
        await pool.end();
    }
};

fixDb();
