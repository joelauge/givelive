#!/usr/bin/env node
/**
 * Run database migration: 002_user_profiles.sql
 * This script reads the migration file and executes it on the database
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Client } = pg;

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('✅ Connected!');

        // Read migration file
        const migrationPath = join(__dirname, 'migrations', '002_user_profiles.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');

        console.log('Running migration: 002_user_profiles.sql');
        console.log('----------------------------------------');

        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('Created:');
        console.log('  - Enhanced users table with profile fields');
        console.log('  - form_submissions table');
        console.log('  - user_profiles view');
        console.log('  - Database indexes');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
