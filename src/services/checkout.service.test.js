import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, mongo, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

let token, productoId;
const auth = () => ({ Authorization: `Bearer ${token}` });
before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  token = await tokenDe({ email: 'checkout@test.local', tipo: 'cliente' });
  const p = await mongo.producto.create({ data: { sku: 'TEST-CO', nombre: 'CheckoutProd', categoria: 'electronica', precio: 100, stock: 10, tiendaId: 't1', atributos: {}, etiquetas: [], marcas: [], industria: [], variantes: [], activo: true } });
  productoId = p.id;
  await request(app).post('/api/carrito/items').set(auth()).send({ productoId, cantidad: 2 });
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('POST /api/checkout crea una factura con totales correctos', async () => {
  const res = await request(app).post('/api/checkout').set(auth()).send({});
  assert.equal(res.status, 201);
  assert.equal(Number(res.body.subtotal), 200);   // 2 x 100
  assert.equal(Number(res.body.impuestos), 38);   // 19%
  assert.equal(Number(res.body.total), 238);
  assert.equal(res.body.items.length, 1);
});

test('tras el checkout, el carrito queda vacío y baja el stock', async () => {
  const carrito = await request(app).get('/api/carrito').set(auth());
  assert.equal(carrito.body.items.length, 0);
  const prod = await mongo.producto.findUnique({ where: { id: productoId } });
  assert.equal(prod.stock, 8); // 10 - 2
});

test('checkout con carrito vacío -> 400', async () => {
  const res = await request(app).post('/api/checkout').set(auth()).send({});
  assert.equal(res.status, 400);
});
