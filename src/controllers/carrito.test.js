import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, mongo, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

let token, productoId;
before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  token = await tokenDe({ email: 'cart@test.local', tipo: 'cliente' });
  const p = await mongo.producto.create({ data: { sku: 'TEST-CART', nombre: 'CartProd', categoria: 'ropa', precio: 40, stock: 100, tiendaId: 't1', atributos: {}, etiquetas: [], marcas: [], industria: [], variantes: [], activo: true } });
  productoId = p.id;
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('GET /api/carrito crea un carrito vacío la primera vez', async () => {
  const res = await request(app).get('/api/carrito').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.items, []);
});

test('el carrito está vinculado al UUID del usuario', async () => {
  const res = await request(app).get('/api/carrito').set('Authorization', `Bearer ${token}`);
  assert.ok(res.body.usuarioId, 'debe tener usuarioId (UUID de Postgres)');
});
