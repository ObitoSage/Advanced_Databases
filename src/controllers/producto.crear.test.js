import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

let tokenVendedor, tokenCliente;
before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  tokenVendedor = await tokenDe({ email: 'v5@test.local', tipo: 'vendedor' });
  tokenCliente = await tokenDe({ email: 'c5@test.local', tipo: 'cliente' });
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

const nuevo = { sku: 'TEST-NEW', nombre: 'Nuevo', categoria: 'electronica', precio: 50, stock: 10, atributos: { voltaje: '220V' }, etiquetas: ['oferta'], marcas: ['Acme'], industria: ['tec'], variantes: [] };

test('VENDEDOR crea producto -> 201 con tiendaId del token', async () => {
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${tokenVendedor}`).send(nuevo);
  assert.equal(res.status, 201);
  assert.equal(res.body.sku, 'TEST-NEW');
  assert.ok(res.body.tiendaId, 'debe asignar tiendaId');
});

test('CLIENTE no puede crear producto -> 403', async () => {
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${tokenCliente}`).send({ ...nuevo, sku: 'TEST-NEW2' });
  assert.equal(res.status, 403);
});

test('sin token -> 401', async () => {
  const res = await request(app).post('/api/productos').send({ ...nuevo, sku: 'TEST-NEW3' });
  assert.equal(res.status, 401);
});
