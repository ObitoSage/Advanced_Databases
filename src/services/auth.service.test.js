import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, postgres, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest } from '../test/helper.js';

before(async () => { await connectDatabases(); await asegurarRoles(); await limpiarTest(); });
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('registro con tipo=vendedor crea usuario con rol VENDEDOR', async () => {
  const res = await request(app).post('/api/auth/registro')
    .send({ email: 'vend@test.local', password: 'secreto123', nombre: 'Vendedor', tipo: 'vendedor' });
  assert.equal(res.status, 201);
  assert.equal(res.body.rol, 'VENDEDOR');
});

test('registro sin tipo crea CLIENTE por defecto', async () => {
  const res = await request(app).post('/api/auth/registro')
    .send({ email: 'cli@test.local', password: 'secreto123', nombre: 'Cliente' });
  assert.equal(res.status, 201);
  assert.equal(res.body.rol, 'CLIENTE');
});

test('no se puede registrar como ADMIN', async () => {
  const res = await request(app).post('/api/auth/registro')
    .send({ email: 'hacker@test.local', password: 'secreto123', nombre: 'X', tipo: 'admin' });
  // 'admin' no está permitido -> cae a CLIENTE
  assert.equal(res.body.rol, 'CLIENTE');
});
