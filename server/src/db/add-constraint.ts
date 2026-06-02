import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const addConstraint = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.givelive_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await pool.query('ALTER TABLE integrations ADD CONSTRAINT unique_integration UNIQUE (org_id, platform, external_id);');
        console.log('✅ Successfully added unique constraint to integrations table.');
    } catch (err: any) {
        if (err.code === '42710') {
            console.log('ℹ️ Constraint already exists.');
        } else {
            console.error('❌ Failed to add constraint:', err);
        }
    } finally {
        await pool.end();
    }
};

addConstraint();
