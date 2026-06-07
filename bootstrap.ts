import fs from 'fs';
import path from 'path';

// Load .env.local into process.env
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

// Start the app
import('./server');
