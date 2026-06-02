import { query } from '../db';

async function addFlowDataColumn() {
    try {
        console.log('Adding flow_data column to events table...');

        await query(`
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS flow_data JSONB;
        `);

        console.log('✅ Successfully added flow_data column');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to add flow_data column:', error);
        process.exit(1);
    }
}

addFlowDataColumn();
