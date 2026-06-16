import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { request, app, mongo, connectDatabases, disconnectDatabases, asegurarRoles, limpiarTest, tokenDe } from '../test/helper.js';

before(async () => {
  await connectDatabases(); await asegurarRoles(); await limpiarTest();
  await mongo.producto.createMany({ data: [
    { sku: 'TEST-A', nombre: 'Laptop Pro', categoria: 'electronica', precio: 1200, stock: 5, tiendaId: 't1', atributos: { voltaje: '220V' }, etiquetas: ['oferta'], marcas: ['Asus'], industria: ['tec'], variantes: [], activo: true },
    { sku: 'TEST-B', nombre: 'Camiseta', categoria: 'ropa', precio: 25, stock: 50, tiendaId: 't1', atributos: { talla: 'XL' }, etiquetas: ['verano'], marcas: ['Nike'], industria: ['moda'], variantes: [], activo: true },
    { sku: 'TEST-C', nombre: 'Laptop Air', categoria: 'electronica', precio: 999, stock: 3, tiendaId: 't2', atributos: {}, etiquetas: ['oferta'], marcas: ['HP'], industria: ['tec'], variantes: [], activo: true },
  ]});
});
after(async () => { await limpiarTest(); await disconnectDatabases(); });

// La BD de desarrollo es compartida (puede contener datos del demo). Las
// aserciones se limitan a los productos de prueba (markers TEST-*); el filtro
// del servidor sigue siendo lo que se valida (un TEST-* que no coincide no aparece).
const soloTest = (data) => data.filter((p) => p.sku.startsWith('TEST-')).map((p) => p.sku).sort();

test('GET /api/productos filtra por categoria y rango de precio', async () => {
  const res = await request(app).get('/api/productos?categoria=electronica&precioMin=1000&precioMax=1500&limit=100');
  assert.equal(res.status, 200);
  assert.deepEqual(soloTest(res.body.data), ['TEST-A']);
  assert.equal(typeof res.body.total, 'number');
});

test('GET /api/productos filtra por texto (q) insensible a mayúsculas', async () => {
  const res = await request(app).get('/api/productos?q=laptop&limit=100');
  assert.deepEqual(soloTest(res.body.data), ['TEST-A', 'TEST-C']);
});

test('GET /api/productos filtra por etiqueta (arreglo)', async () => {
  const res = await request(app).get('/api/productos?etiquetas=oferta&limit=100');
  assert.deepEqual(soloTest(res.body.data), ['TEST-A', 'TEST-C']);
});
