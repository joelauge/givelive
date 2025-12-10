import { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for backend operations

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. Uploads will fail.');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

export default async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/upload', async (req: any, reply) => {
        // ... existing endpoint (keep for backward compat or small files if wanted, or just as fallback) ...
        try {
            const data = await req.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            const buffer = await data.toBuffer();
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(data.filename)}`;
            const bucketName = 'uploads';

            // Ensure bucket exists
            const { error: bucketError } = await supabase.storage.getBucket(bucketName);
            if (bucketError) {
                await supabase.storage.createBucket(bucketName, { public: true });
            }

            // Upload
            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filename, buffer, {
                    contentType: data.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                return reply.status(500).send({ error: 'Upload failed', details: uploadError.message });
            }

            // Get Public URL
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filename);

            return { url: publicUrlData.publicUrl };

        } catch (err) {
            console.error('Upload handler error:', err);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    fastify.post('/upload/sign', async (req: any, reply) => {
        try {
            const { filename, contentType } = req.body;

            // Clean filename
            const ext = path.extname(filename);
            const base = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, '-');
            const uniquePath = `${Date.now()}-${base}${ext}`;
            const bucketName = 'uploads';

            // Ensure bucket exists
            const { error: bucketError } = await supabase.storage.getBucket(bucketName);
            if (bucketError) {
                await supabase.storage.createBucket(bucketName, { public: true });
            }

            // Generate Signed Link
            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUploadUrl(uniquePath);

            if (error) {
                throw error;
            }

            // Get Public URL (for future access)
            const { data: publicUrlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(uniquePath);

            return {
                signedUrl: data.signedUrl,
                publicUrl: publicUrlData.publicUrl,
                path: uniquePath
            };

        } catch (err: any) {
            console.error('Sign handler error:', err);
            return reply.status(500).send({ error: 'Failed to generate upload URL', details: err.message });
        }
    });
}
