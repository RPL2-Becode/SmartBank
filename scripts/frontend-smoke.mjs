import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../src/lib/api/client.ts', import.meta.url), 'utf8');
const utils = readFileSync(new URL('../src/utils.ts', import.meta.url), 'utf8');
const auth = readFileSync(new URL('../src/lib/api/auth.ts', import.meta.url), 'utf8');

assert.match(client, /VITE_API_BASE_URL \?\? 'http:\/\/127\.0\.0\.1:5000\/smartbank'/);
assert.match(client, /getStoredToken\(\)/);
assert.match(utils, /sessionStorage\.getItem\('smartbank_token'\)/);
assert.match(utils, /nasabah: 'NASABAH'/);
assert.match(utils, /MANAGER: 'manager'/);
assert.match(auth, /role: input\.role/);
assert.match(auth, /sessionStorage\.setItem\('smartbank_token', response\.token\)/);

console.log('Frontend smoke checks passed');
