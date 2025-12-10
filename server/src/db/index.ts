import { Pool } from 'pg';
import dotenv from 'dotenv';
import { mockQuery } from './mock';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.givelive_POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

let useMock = false;

export const query = async (text: string, params?: any[]) => {
    // Only use Mock DB if explicitly enabled
    if (useMock || process.env.USE_MOCK_DB === 'true') {
        if (!useMock) {
            console.log('[Database] Using Mock Database (explicitly enabled via USE_MOCK_DB)');
            useMock = true;
        }
        return mockQuery(text, params);
    }

    try {
        return await pool.query(text, params);
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ Database Query Failed (Production):', err);
            throw err; // Fail in production to ensure we don't silently lose data
        } else {
            console.warn('⚠️ Database connection failed. Falling back to Mock DB (Development only). Data will not be saved permanently.', err);
            useMock = true;
            return mockQuery(text, params);
        }
    }
};
