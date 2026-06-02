import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
    console.log('Migrating integrations table...');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.givelive_POSTGRES_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS integrations (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                org_id TEXT NOT NULL,
                platform TEXT NOT NULL, -- 'facebook', 'instagram', 'shopify'
                external_id TEXT, -- e.g. Facebook User ID or Page ID
                access_token TEXT NOT NULL,
                refresh_token TEXT,
                expires_at TIMESTAMP WITH TIME ZONE,
                metadata JSONB DEFAULT '{}', -- Store Page Name, IG Handle, etc.
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ Successfully created integrations table.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
function uuid_generate_v4() {
    throw new Error('Function not implemented.');
}
