import { Pool } from 'pg';
import dotenv from 'dotenv';
import { mockQuery } from './mock';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

let useMock = false;

export const query = async (text: string, params?: any[]) => {
    if (useMock) return mockQuery(text, params);

    try {
        return await pool.query(text, params);
    } catch (err) {
        console.error('Database connection failed. Switching to Mock DB.', err);
        useMock = true;
        return mockQuery(text, params);
    }
};
