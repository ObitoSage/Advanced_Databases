import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, mongo, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

let token, productoId;
const auth = () => ({ Authorization: `Bearer ${token}` });
before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  token = await tokenDe({ email: 'cartm@test.local', tipo: 'cliente' });
  const p = await mongo.producto.create({ data: { sku: 'TEST-CM', nombre: 'Item', categoria: 'ropa', precio: 10, stock: 100, tiendaId: 't1', atributos: {}, etiquetas: [], marcas: [], industria: [], variantes: [], activo: true } });
  productoId = p.id;
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('POST /api/carrito/items agrega un ítem con snapshot del producto', async () => {
  const res = await request(app).post('/api/carrito/items').set(auth()).send({ productoId, cantidad: 2 });
  assert.equal(res.status, 201);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].cantidad, 2);
  assert.equal(res.body.items[0].precio, 10);
});

test('agregar el mismo producto suma cantidades', async () => {
  await request(app).post('/api/carrito/items').set(auth()).send({ productoId, cantidad: 1 });
  const res = await request(app).get('/api/carrito').set(auth());
  assert.equal(res.body.items[0].cantidad, 3);
});

test('PATCH cambia la cantidad', async () => {
  const res = await request(app).patch(`/api/carrito/items/${productoId}`).set(auth()).send({ cantidad: 5 });
  assert.equal(res.body.items[0].cantidad, 5);
});

test('DELETE de un ítem lo quita', async () => {
  const res = await request(app).delete(`/api/carrito/items/${productoId}`).set(auth());
  assert.equal(res.body.items.length, 0);
});

test('DELETE /api/carrito vacía el carrito', async () => {
  await request(app).post('/api/carrito/items').set(auth()).send({ productoId, cantidad: 1 });
  const res = await request(app).delete('/api/carrito').set(auth());
  assert.equal(res.body.items.length, 0);
});
