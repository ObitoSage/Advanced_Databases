import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

let tokenA, tokenB, productoId;
before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  tokenA = await tokenDe({ email: 'v6a@test.local', tipo: 'vendedor' });
  tokenB = await tokenDe({ email: 'v6b@test.local', tipo: 'vendedor' });
  const res = await request(app).post('/api/productos').set('Authorization', `Bearer ${tokenA}`)
    .send({ sku: 'TEST-G6', nombre: 'Gestion', categoria: 'ropa', precio: 30, stock: 5, atributos: {}, etiquetas: [], marcas: [], industria: [], variantes: [] });
  productoId = res.body.id;
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('GET /api/productos/mios devuelve solo los del vendedor', async () => {
  const res = await request(app).get('/api/productos/mios').set('Authorization', `Bearer ${tokenA}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].sku, 'TEST-G6');
});

test('el dueño edita su producto -> 200', async () => {
  const res = await request(app).put(`/api/productos/${productoId}`).set('Authorization', `Bearer ${tokenA}`).send({ precio: 35 });
  assert.equal(res.status, 200);
  assert.equal(res.body.precio, 35);
});

test('otro vendedor NO puede editar -> 403', async () => {
  const res = await request(app).put(`/api/productos/${productoId}`).set('Authorization', `Bearer ${tokenB}`).send({ precio: 1 });
  assert.equal(res.status, 403);
});

test('el dueño elimina su producto -> 204', async () => {
  const res = await request(app).delete(`/api/productos/${productoId}`).set('Authorization', `Bearer ${tokenA}`);
  assert.equal(res.status, 204);
});
