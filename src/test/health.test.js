import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, connectDatabases, disconnectDatabases } from './helper.js';

before(async () => { await connectDatabases(); });
after(async () => { await disconnectDatabases(); });

test('GET /health responde ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});
