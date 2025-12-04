import { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';

const pump = util.promisify(pipeline);

export default async function uploadRoutes(fastify: FastifyInstance) {
    fastify.post('/api/upload', async (req: any, reply) => {
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(data.filename);
        const filepath = path.join(uploadDir, filename);

        await pump(data.file, fs.createWriteStream(filepath));

        // Construct URL - ensure port is included if localhost
        const protocol = req.protocol;
        const host = req.hostname;
        // req.hostname usually includes port in Fastify if Host header has it

        const fileUrl = `${protocol}://${host}/uploads/${filename}`;
        return { url: fileUrl };
    });
}
