import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, mongo, connectDatabases, disconnectDatabases, limpiarTest } from '../test/helper.js';

let id;
before(async () => {
  await connectDatabases(); await limpiarTest();
  const p = await mongo.producto.create({ data: { sku: 'TEST-DET', nombre: 'Detalle', categoria: 'electronica', precio: 100, stock: 1, tiendaId: 't1', atributos: { voltaje: '110V' }, etiquetas: [], marcas: [], industria: [], variantes: [], activo: true } });
  id = p.id;
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

test('GET /api/productos/:id devuelve el producto', async () => {
  const res = await request(app).get(`/api/productos/${id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.sku, 'TEST-DET');
  assert.equal(res.body.atributos.voltaje, '110V');
});

test('GET /api/productos/:id inexistente -> 404', async () => {
  const res = await request(app).get('/api/productos/000000000000000000000000');
  assert.equal(res.status, 404);
});
