import fs from 'fs';
import path from 'path';
import { createServer } from 'http';

// Load .env.local into process.env when running the custom server
const _envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(_envPath)) {
  const content = fs.readFileSync(_envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*(.*)?\s*$/);
    if (!m) return;
    let [, key, val] = m as string[];
    if (!val) val = '';
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  });
}
;(async () => {
  const nextImport = await import('next');
  const next = nextImport.default;
  const { initSocket } = await import('./lib/socket-server');
  const { startBatchEngine } = await import('./lib/batch-engine');

  const dev = process.env.NODE_ENV !== 'production';
  const hostname = process.env.HOST ?? 'localhost';
  const port = parseInt(process.env.PORT ?? '3000', 10);

  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  app.prepare().then(async () => {
    const httpServer = createServer((req, res) => {
      handle(req, res);
    });

    const io = initSocket(httpServer);
    await startBatchEngine(io);

    httpServer.listen(port, hostname, () => {
      console.log(`> EduArena ready on http://${hostname}:${port}`);
    });
  });
})();
