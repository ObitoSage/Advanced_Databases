import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, mongo, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

let tokenA, tokenB, facturaId;
before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  tokenA = await tokenDe({ email: 'fa@test.local', tipo: 'cliente' });
  tokenB = await tokenDe({ email: 'fb@test.local', tipo: 'cliente' });
  const p = await mongo.producto.create({ data: { sku: 'TEST-FH', nombre: 'FH', categoria: 'ropa', precio: 20, stock: 5, tiendaId: 't1', atributos: {}, etiquetas: [], marcas: [], industria: [], variantes: [], activo: true } });
  await request(app).post('/api/carrito/items').set({ Authorization: `Bearer ${tokenA}` }).send({ productoId: p.id, cantidad: 1 });
  const co = await request(app).post('/api/checkout').set({ Authorization: `Bearer ${tokenA}` }).send({});
  facturaId = co.body.id;
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('GET /api/facturas devuelve el historial del usuario', async () => {
  const res = await request(app).get('/api/facturas').set({ Authorization: `Bearer ${tokenA}` });
  assert.equal(res.status, 200);
  assert.ok(res.body.length >= 1);
});

test('un usuario NO puede ver la factura de otro -> 404', async () => {
  const res = await request(app).get(`/api/facturas/${facturaId}`).set({ Authorization: `Bearer ${tokenB}` });
  assert.equal(res.status, 404);
});

test('el dueño ve su factura -> 200', async () => {
  const res = await request(app).get(`/api/facturas/${facturaId}`).set({ Authorization: `Bearer ${tokenA}` });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, facturaId);
});
