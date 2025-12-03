import { createApp } from '../server/src/index';

const app = createApp();

export default async function handler(req: any, res: any) {
    await app.ready();
    app.server.emit('request', req, res);
}
