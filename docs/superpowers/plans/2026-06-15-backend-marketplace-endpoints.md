# Backend Marketplace Endpoints — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the HTTP endpoints the marketplace frontend needs — product catalog (search/CRUD), cart, and checkout/invoices — to the existing Express + polyglot backend, following its layered architecture.

**Architecture:** Routes → Controllers → Services → Repositories. Catalog and cart live in MongoDB (`Producto`, `Carrito`); invoices live in PostgreSQL (`Factura`, ACID). Checkout creates the invoice in a real PostgreSQL transaction, then updates stock/cart in MongoDB best-effort with a compensating action. RBAC is enforced with the existing `autenticar`/`autorizar` middleware.

**Tech Stack:** Node.js 22 (ESM), Express 4, Prisma 6 (PostgreSQL + MongoDB clients), `node:test` runner + `supertest` for integration tests, JWT auth (existing).

---

## Prerequisites & conventions

- **Containers must be running** for tests and dev: `npm run db:up` (PostgreSQL + MongoDB). Both Prisma clients must be generated (`npm run prisma:generate`, which `postinstall` also runs).
- Tests hit the **real** dev databases (consistent with the existing `demo.js` / `test-seguridad.js` smoke scripts). They isolate data with markers: users `*@test.local`, products `sku` starting with `TEST-`, and clean up before/after.
- Existing reusable pieces (do not recreate): `src/app.js` (exports `app`), `src/config/database.js` (`postgres`, `mongo`, `connectDatabases`, `disconnectDatabases`), `src/middlewares/auth.middleware.js` (`autenticar`, `autorizar`), `src/routes/index.js`, `src/services/auth.service.js`, `src/repositories/producto.repository.js`.
- Error convention (already used in services): throw `Object.assign(new Error(msg), { status })`; the centralized error handler in `app.js` turns it into `{ error: msg }` with that status.

## File structure (created / modified)

```
src/
├── test/
│   └── helper.js                      # CREATE — test setup: app, db, cleanup, token helper
├── repositories/
│   ├── producto.repository.js         # MODIFY — add buscar/contar/actualizar/eliminar
│   └── carrito.repository.js          # CREATE
│   └── factura.repository.js          # CREATE
├── services/
│   ├── auth.service.js                # MODIFY — registrar acepta `tipo`
│   ├── producto.service.js            # CREATE
│   ├── carrito.service.js             # CREATE
│   └── checkout.service.js            # CREATE
├── controllers/
│   ├── producto.controller.js         # CREATE
│   ├── carrito.controller.js          # CREATE
│   └── factura.controller.js          # CREATE  (checkout + facturas)
├── routes/
│   ├── producto.routes.js             # CREATE
│   ├── carrito.routes.js              # CREATE
│   ├── factura.routes.js              # CREATE
│   └── index.js                       # MODIFY — mount new routers
├── demo.js                            # MODIFY — seed sample catalog
└── **/*.test.js                       # CREATE — one per resource
package.json                           # MODIFY — supertest dep + test script
```

---

## Task 1: Test infrastructure

**Files:**
- Modify: `package.json` (add `supertest` devDependency + `test` script)
- Create: `src/test/helper.js`
- Create: `src/test/health.test.js`

- [ ] **Step 1: Install supertest and add the test script**

Run:
```bash
npm install -D supertest@^7.0.0
```

Then edit `package.json` scripts — add this line inside `"scripts"` (after `"demo:seguridad"`):
```json
    "test": "node --test"
```

- [ ] **Step 2: Create the test helper**

Create `src/test/helper.js`:
```js
import 'dotenv/config';
import request from 'supertest';
import { app } from '../app.js';
import { postgres, mongo, connectDatabases, disconnectDatabases } from '../config/database.js';

export { app, request, postgres, mongo, connectDatabases, disconnectDatabases };

/** Garantiza que existan los roles base. */
export async function asegurarRoles() {
  for (const nombre of ['CLIENTE', 'VENDEDOR', 'ADMIN']) {
    await postgres.rol.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }
}

/** Borra los datos de prueba (usuarios *@test.local y productos TEST-*). */
export async function limpiarTest() {
  const us = await postgres.usuario.findMany({
    where: { email: { endsWith: '@test.local' } },
    select: { id: true },
  });
  const ids = us.map((u) => u.id);
  if (ids.length) {
    await mongo.carrito.deleteMany({ where: { usuarioId: { in: ids } } });
    await postgres.factura.deleteMany({ where: { usuarioId: { in: ids } } });
    await postgres.metodoPago.deleteMany({ where: { usuarioId: { in: ids } } });
    await postgres.usuario.deleteMany({ where: { id: { in: ids } } });
  }
  await mongo.producto.deleteMany({ where: { sku: { startsWith: 'TEST-' } } });
}

/** Registra un usuario y devuelve su token JWT. */
export async function tokenDe({ email, password = 'secreto123', nombre = 'Test', tipo = 'cliente' }) {
  await request(app).post('/api/auth/registro').send({ email, password, nombre, tipo });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}
```

- [ ] **Step 3: Write a smoke test that exercises the infra**

Create `src/test/health.test.js`:
```js
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
```

- [ ] **Step 4: Run it (must pass — proves the harness works)**

Run: `npm test`
Expected: the `health` test passes (PASS / 1 test). (Containers must be up.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/test/helper.js src/test/health.test.js
git commit -m "test: add node:test + supertest integration harness"
```

---

## Task 2: Registration with role type (cliente / vendedor)

**Files:**
- Modify: `src/services/auth.service.js`
- Create: `src/services/auth.service.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/services/auth.service.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `registro con tipo=vendedor` expects `rol: 'VENDEDOR'` but current code always returns `CLIENTE`.

- [ ] **Step 3: Implement — `registrar` honors `tipo`**

In `src/services/auth.service.js`, replace the body of `registrar` so it maps an optional `tipo` to a role name (whitelist CLIENTE/VENDEDOR only):
```js
  async registrar({ email, password, nombre, tipo }) {
    if (!email || !password || !nombre) {
      throw error(400, 'email, password y nombre son obligatorios');
    }
    if (await usuarioRepository.buscarPorEmail(email)) {
      throw error(409, 'El email ya está registrado');
    }
    // Solo se permite CLIENTE o VENDEDOR desde el registro público (ADMIN jamás).
    const nombreRol = tipo === 'vendedor' ? 'VENDEDOR' : 'CLIENTE';
    const rol = await rolRepository.buscarPorNombre(nombreRol);
    if (!rol) throw error(500, `Rol ${nombreRol} inexistente (siembra los roles primero)`);

    const passwordHash = await hashPassword(password);
    const usuario = await usuarioRepository.crear({ email, passwordHash, nombre, rolId: rol.id });
    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: nombreRol };
  },
```

(No new imports needed — `rolRepository`, `hashPassword`, `error` are already imported.)

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — all three registration tests green.

- [ ] **Step 5: Commit**

```bash
git add src/services/auth.service.js src/services/auth.service.test.js
git commit -m "feat(auth): allow registering as cliente or vendedor"
```

---

## Task 3: Catalog listing with filters (GET /api/productos)

**Files:**
- Modify: `src/repositories/producto.repository.js` (add `buscar`, `contar`)
- Create: `src/services/producto.service.js`
- Create: `src/controllers/producto.controller.js`
- Create: `src/routes/producto.routes.js`
- Modify: `src/routes/index.js`
- Create: `src/repositories/producto.repository.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/repositories/producto.repository.test.js`:
```js
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

test('GET /api/productos filtra por categoria y rango de precio', async () => {
  const res = await request(app).get('/api/productos?categoria=electronica&precioMin=1000&precioMax=1500');
  assert.equal(res.status, 200);
  const skus = res.body.data.map((p) => p.sku);
  assert.deepEqual(skus.sort(), ['TEST-A']);
  assert.equal(typeof res.body.total, 'number');
});

test('GET /api/productos filtra por texto (q) insensible a mayúsculas', async () => {
  const res = await request(app).get('/api/productos?q=laptop');
  const skus = res.body.data.map((p) => p.sku).sort();
  assert.deepEqual(skus, ['TEST-A', 'TEST-C']);
});

test('GET /api/productos filtra por etiqueta (arreglo)', async () => {
  const res = await request(app).get('/api/productos?etiquetas=oferta');
  const skus = res.body.data.map((p) => p.sku).sort();
  assert.deepEqual(skus, ['TEST-A', 'TEST-C']);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — route `/api/productos` returns 404 (not mounted yet).

- [ ] **Step 3a: Add repository methods**

In `src/repositories/producto.repository.js`, add these two methods to the `productoRepository` object (after `listarPorTienda`):
```js
  // Búsqueda con filtros combinados (Prisma -> Mongo).
  buscar({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId, page = 1, limit = 12 }) {
    const where = construirWhere({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId });
    const skip = (page - 1) * limit;
    return mongo.producto.findMany({ where, skip, take: limit, orderBy: { creadoEn: 'desc' } });
  },

  contar({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId }) {
    return mongo.producto.count({ where: construirWhere({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId }) });
  },
```

And add this helper at the bottom of the file (after the closing `}` of `productoRepository`):
```js
function construirWhere({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId }) {
  const where = { activo: true };
  if (categoria) where.categoria = categoria;
  if (tiendaId) where.tiendaId = tiendaId;
  if (q) where.nombre = { contains: q, mode: 'insensitive' };
  if (precioMin != null || precioMax != null) {
    where.precio = {};
    if (precioMin != null) where.precio.gte = precioMin;
    if (precioMax != null) where.precio.lte = precioMax;
  }
  if (etiquetas?.length) where.etiquetas = { hasSome: etiquetas };
  if (marca) where.marcas = { has: marca };
  return where;
}
```

- [ ] **Step 3b: Create the service**

Create `src/services/producto.service.js`:
```js
import { productoRepository } from '../repositories/producto.repository.js';

export const productoService = {
  async listar(filtros) {
    const [data, total] = await Promise.all([
      productoRepository.buscar(filtros),
      productoRepository.contar(filtros),
    ]);
    return { data, total, page: filtros.page ?? 1, limit: filtros.limit ?? 12 };
  },
};
```

- [ ] **Step 3c: Create the controller**

Create `src/controllers/producto.controller.js`:
```js
import { productoService } from '../services/producto.service.js';

const aNumero = (v) => (v == null || v === '' ? undefined : Number(v));
const aLista = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : undefined);

export const productoController = {
  async listar(req, res, next) {
    try {
      const { q, categoria, precioMin, precioMax, etiquetas, marca, page, limit } = req.query;
      const resultado = await productoService.listar({
        q: q || undefined,
        categoria: categoria || undefined,
        precioMin: aNumero(precioMin),
        precioMax: aNumero(precioMax),
        etiquetas: aLista(etiquetas),
        marca: marca || undefined,
        page: aNumero(page) ?? 1,
        limit: aNumero(limit) ?? 12,
      });
      res.json(resultado);
    } catch (e) { next(e); }
  },
};
```

- [ ] **Step 3d: Create the routes file**

Create `src/routes/producto.routes.js`:
```js
import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);

export default router;
```

- [ ] **Step 3e: Mount the router**

In `src/routes/index.js`, add the import and `router.use` (keep existing lines):
```js
import productoRoutes from './producto.routes.js';
// ...
router.use('/productos', productoRoutes);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — the three catalog filter tests are green.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/producto.repository.js src/services/producto.service.js src/controllers/producto.controller.js src/routes/producto.routes.js src/routes/index.js src/repositories/producto.repository.test.js
git commit -m "feat(productos): catalog listing with filters (GET /api/productos)"
```

---

## Task 4: Product detail (GET /api/productos/:id)

**Files:**
- Modify: `src/services/producto.service.js`
- Modify: `src/controllers/producto.controller.js`
- Modify: `src/routes/producto.routes.js`
- Create: `src/controllers/producto.detalle.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/controllers/producto.detalle.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `/api/productos/:id` not defined (the `/` route does not match an id).

- [ ] **Step 3a: Add service method** — in `src/services/producto.service.js`, add to `productoService`:
```js
  async detalle(id) {
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    return producto;
  },
```

- [ ] **Step 3b: Add controller method** — in `src/controllers/producto.controller.js`, add to `productoController`:
```js
  async detalle(req, res, next) {
    try {
      res.json(await productoService.detalle(req.params.id));
    } catch (e) { next(e); }
  },
```

- [ ] **Step 3c: Add route** — in `src/routes/producto.routes.js`, add after the `'/'` route:
```js
router.get('/:id', productoController.detalle);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — detail found returns 200, missing id returns 404.

> Note: `buscarPorId` on a malformed ObjectId throws. If the 404 test instead surfaces a 500, wrap `productoRepository.buscarPorId` lookups in the service with a try/catch that treats invalid-id errors as 404. With a valid 24-hex string (as in the test) it returns `null` → 404 cleanly.

- [ ] **Step 5: Commit**

```bash
git add src/services/producto.service.js src/controllers/producto.controller.js src/routes/producto.routes.js src/controllers/producto.detalle.test.js
git commit -m "feat(productos): product detail (GET /api/productos/:id)"
```

---

## Task 5: Create product (POST /api/productos, VENDEDOR)

**Files:**
- Modify: `src/services/producto.service.js`
- Modify: `src/controllers/producto.controller.js`
- Modify: `src/routes/producto.routes.js`
- Create: `src/controllers/producto.crear.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/controllers/producto.crear.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — POST `/api/productos` returns 404.

- [ ] **Step 3a: Add service method** — in `src/services/producto.service.js`, add to `productoService`:
```js
  crear({ tiendaId, ...datos }) {
    if (!datos.sku || !datos.nombre || !datos.categoria || datos.precio == null) {
      throw Object.assign(new Error('sku, nombre, categoria y precio son obligatorios'), { status: 400 });
    }
    return productoRepository.crear({
      sku: datos.sku,
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      categoria: datos.categoria,
      precio: Number(datos.precio),
      stock: Number(datos.stock ?? 0),
      tiendaId,
      atributos: datos.atributos ?? {},
      etiquetas: datos.etiquetas ?? [],
      marcas: datos.marcas ?? [],
      industria: datos.industria ?? [],
      variantes: datos.variantes ?? [],
    });
  },
```

- [ ] **Step 3b: Add controller method** — in `src/controllers/producto.controller.js`, add to `productoController`:
```js
  async crear(req, res, next) {
    try {
      const producto = await productoService.crear({ ...req.body, tiendaId: req.usuario.sub });
      res.status(201).json(producto);
    } catch (e) { next(e); }
  },
```

- [ ] **Step 3c: Add route** — in `src/routes/producto.routes.js`, import the middleware and add the route. Final file:
```js
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);
router.post('/', autenticar, autorizar('VENDEDOR'), productoController.crear);
router.get('/:id', productoController.detalle);

export default router;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — vendor 201, cliente 403, no-token 401.

- [ ] **Step 5: Commit**

```bash
git add src/services/producto.service.js src/controllers/producto.controller.js src/routes/producto.routes.js src/controllers/producto.crear.test.js
git commit -m "feat(productos): vendor product creation (POST /api/productos)"
```

---

## Task 6: My products, update & delete (ownership-checked)

**Files:**
- Modify: `src/repositories/producto.repository.js` (add `actualizar`, `eliminar`)
- Modify: `src/services/producto.service.js`
- Modify: `src/controllers/producto.controller.js`
- Modify: `src/routes/producto.routes.js`
- Create: `src/controllers/producto.gestion.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/controllers/producto.gestion.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `/api/productos/mios`, PUT and DELETE return 404.

- [ ] **Step 3a: Add repository methods** — in `src/repositories/producto.repository.js`, add to `productoRepository`:
```js
  actualizar(id, data) {
    return mongo.producto.update({ where: { id }, data });
  },

  eliminar(id) {
    return mongo.producto.delete({ where: { id } });
  },
```

- [ ] **Step 3b: Add service methods** — in `src/services/producto.service.js`, add to `productoService`:
```js
  listarDeTienda(tiendaId) {
    return productoRepository.listarPorTienda(tiendaId);
  },

  async actualizar({ id, tiendaId, cambios }) {
    const actual = await productoRepository.buscarPorId(id);
    if (!actual) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    if (actual.tiendaId !== tiendaId) {
      throw Object.assign(new Error('No puedes editar productos de otra tienda'), { status: 403 });
    }
    // Solo se permiten campos editables (no se puede cambiar tiendaId ni sku).
    const permitido = {};
    for (const k of ['nombre', 'descripcion', 'categoria', 'precio', 'stock', 'atributos', 'etiquetas', 'marcas', 'industria', 'variantes', 'activo']) {
      if (cambios[k] !== undefined) permitido[k] = k === 'precio' ? Number(cambios[k]) : k === 'stock' ? Number(cambios[k]) : cambios[k];
    }
    return productoRepository.actualizar(id, permitido);
  },

  async eliminar({ id, tiendaId }) {
    const actual = await productoRepository.buscarPorId(id);
    if (!actual) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    if (actual.tiendaId !== tiendaId) {
      throw Object.assign(new Error('No puedes eliminar productos de otra tienda'), { status: 403 });
    }
    await productoRepository.eliminar(id);
  },
```

- [ ] **Step 3c: Add controller methods** — in `src/controllers/producto.controller.js`, add to `productoController`:
```js
  async mios(req, res, next) {
    try {
      res.json(await productoService.listarDeTienda(req.usuario.sub));
    } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try {
      res.json(await productoService.actualizar({ id: req.params.id, tiendaId: req.usuario.sub, cambios: req.body }));
    } catch (e) { next(e); }
  },

  async eliminar(req, res, next) {
    try {
      await productoService.eliminar({ id: req.params.id, tiendaId: req.usuario.sub });
      res.status(204).end();
    } catch (e) { next(e); }
  },
```

- [ ] **Step 3d: Add routes** — in `src/routes/producto.routes.js`, register `/mios` BEFORE `/:id`. Final file:
```js
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);
router.get('/mios', autenticar, autorizar('VENDEDOR'), productoController.mios);
router.post('/', autenticar, autorizar('VENDEDOR'), productoController.crear);
router.get('/:id', productoController.detalle);
router.put('/:id', autenticar, autorizar('VENDEDOR'), productoController.actualizar);
router.delete('/:id', autenticar, autorizar('VENDEDOR'), productoController.eliminar);

export default router;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — mios returns one product, owner edits 200, other vendor 403, delete 204.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/producto.repository.js src/services/producto.service.js src/controllers/producto.controller.js src/routes/producto.routes.js src/controllers/producto.gestion.test.js
git commit -m "feat(productos): list-own, update and delete with ownership checks"
```

---

## Task 7: Cart repository + GET /api/carrito

**Files:**
- Create: `src/repositories/carrito.repository.js`
- Create: `src/services/carrito.service.js`
- Create: `src/controllers/carrito.controller.js`
- Create: `src/routes/carrito.routes.js`
- Modify: `src/routes/index.js`
- Create: `src/controllers/carrito.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/controllers/carrito.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `/api/carrito` returns 404.

- [ ] **Step 3a: Create the repository** — `src/repositories/carrito.repository.js`:
```js
import { mongo } from '../config/database.js';

export const carritoRepository = {
  buscarPorUsuario(usuarioId) {
    return mongo.carrito.findUnique({ where: { usuarioId } });
  },

  crearVacio(usuarioId) {
    return mongo.carrito.create({ data: { usuarioId, items: [] } });
  },

  reemplazarItems(usuarioId, items) {
    return mongo.carrito.update({ where: { usuarioId }, data: { items: { set: items } } });
  },
};
```

- [ ] **Step 3b: Create the service** — `src/services/carrito.service.js`:
```js
import { carritoRepository } from '../repositories/carrito.repository.js';

export const carritoService = {
  async obtener(usuarioId) {
    return (await carritoRepository.buscarPorUsuario(usuarioId)) ?? (await carritoRepository.crearVacio(usuarioId));
  },
};
```

- [ ] **Step 3c: Create the controller** — `src/controllers/carrito.controller.js`:
```js
import { carritoService } from '../services/carrito.service.js';

export const carritoController = {
  async obtener(req, res, next) {
    try {
      res.json(await carritoService.obtener(req.usuario.sub));
    } catch (e) { next(e); }
  },
};
```

- [ ] **Step 3d: Create the routes** — `src/routes/carrito.routes.js`:
```js
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { carritoController } from '../controllers/carrito.controller.js';

const router = Router();

router.get('/', autenticar, autorizar('CLIENTE'), carritoController.obtener);

export default router;
```

- [ ] **Step 3e: Mount it** — in `src/routes/index.js` add:
```js
import carritoRoutes from './carrito.routes.js';
// ...
router.use('/carrito', carritoRoutes);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — empty cart created with `usuarioId` and `items: []`.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/carrito.repository.js src/services/carrito.service.js src/controllers/carrito.controller.js src/routes/carrito.routes.js src/routes/index.js src/controllers/carrito.test.js
git commit -m "feat(carrito): get-or-create cart (GET /api/carrito)"
```

---

## Task 8: Cart mutations (add / update qty / remove / clear)

**Files:**
- Modify: `src/services/carrito.service.js`
- Modify: `src/controllers/carrito.controller.js`
- Modify: `src/routes/carrito.routes.js`
- Create: `src/services/carrito.mutaciones.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/services/carrito.mutaciones.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — the item mutation routes return 404.

- [ ] **Step 3a: Extend the service** — in `src/services/carrito.service.js`, add the import and methods. Final file:
```js
import { carritoRepository } from '../repositories/carrito.repository.js';
import { productoRepository } from '../repositories/producto.repository.js';

const err = (status, mensaje) => Object.assign(new Error(mensaje), { status });

export const carritoService = {
  async obtener(usuarioId) {
    return (await carritoRepository.buscarPorUsuario(usuarioId)) ?? (await carritoRepository.crearVacio(usuarioId));
  },

  async agregarItem(usuarioId, { productoId, cantidad }) {
    const qty = Number(cantidad) || 1;
    if (qty < 1) throw err(400, 'cantidad debe ser >= 1');
    const producto = await productoRepository.buscarPorId(productoId);
    if (!producto) throw err(404, 'Producto no encontrado');

    const carrito = await this.obtener(usuarioId);
    const items = [...carrito.items];
    const i = items.findIndex((it) => it.productoId === productoId);
    if (i >= 0) {
      items[i] = { ...items[i], cantidad: items[i].cantidad + qty };
    } else {
      items.push({ productoId, sku: producto.sku, nombre: producto.nombre, cantidad: qty, precio: producto.precio });
    }
    return carritoRepository.reemplazarItems(usuarioId, items);
  },

  async cambiarCantidad(usuarioId, productoId, cantidad) {
    const qty = Number(cantidad);
    if (!Number.isInteger(qty) || qty < 1) throw err(400, 'cantidad debe ser un entero >= 1');
    const carrito = await this.obtener(usuarioId);
    const items = carrito.items.map((it) => (it.productoId === productoId ? { ...it, cantidad: qty } : it));
    if (!items.some((it) => it.productoId === productoId)) throw err(404, 'El ítem no está en el carrito');
    return carritoRepository.reemplazarItems(usuarioId, items);
  },

  async quitarItem(usuarioId, productoId) {
    const carrito = await this.obtener(usuarioId);
    const items = carrito.items.filter((it) => it.productoId !== productoId);
    return carritoRepository.reemplazarItems(usuarioId, items);
  },

  async vaciar(usuarioId) {
    await this.obtener(usuarioId);
    return carritoRepository.reemplazarItems(usuarioId, []);
  },
};
```

- [ ] **Step 3b: Extend the controller** — in `src/controllers/carrito.controller.js`, add to `carritoController`:
```js
  async agregar(req, res, next) {
    try {
      res.status(201).json(await carritoService.agregarItem(req.usuario.sub, req.body));
    } catch (e) { next(e); }
  },

  async cambiar(req, res, next) {
    try {
      res.json(await carritoService.cambiarCantidad(req.usuario.sub, req.params.productoId, req.body.cantidad));
    } catch (e) { next(e); }
  },

  async quitar(req, res, next) {
    try {
      res.json(await carritoService.quitarItem(req.usuario.sub, req.params.productoId));
    } catch (e) { next(e); }
  },

  async vaciar(req, res, next) {
    try {
      res.json(await carritoService.vaciar(req.usuario.sub));
    } catch (e) { next(e); }
  },
```

- [ ] **Step 3c: Add routes** — in `src/routes/carrito.routes.js`, final file:
```js
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { carritoController } from '../controllers/carrito.controller.js';

const router = Router();
const soloCliente = [autenticar, autorizar('CLIENTE')];

router.get('/', ...soloCliente, carritoController.obtener);
router.post('/items', ...soloCliente, carritoController.agregar);
router.patch('/items/:productoId', ...soloCliente, carritoController.cambiar);
router.delete('/items/:productoId', ...soloCliente, carritoController.quitar);
router.delete('/', ...soloCliente, carritoController.vaciar);

export default router;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — add/sum/patch/remove/clear all behave as asserted.

- [ ] **Step 5: Commit**

```bash
git add src/services/carrito.service.js src/controllers/carrito.controller.js src/routes/carrito.routes.js src/services/carrito.mutaciones.test.js
git commit -m "feat(carrito): add/update/remove/clear cart items"
```

---

## Task 9: Checkout (POST /api/checkout) — ACID invoice + compensation

**Files:**
- Create: `src/repositories/factura.repository.js`
- Create: `src/services/checkout.service.js`
- Create: `src/controllers/factura.controller.js`
- Create: `src/routes/factura.routes.js`
- Modify: `src/routes/index.js`
- Create: `src/services/checkout.service.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/services/checkout.service.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `/api/checkout` returns 404.

- [ ] **Step 3a: Create the invoice repository** — `src/repositories/factura.repository.js`:
```js
import { postgres } from '../config/database.js';

export const facturaRepository = {
  // Crea la factura + sus ítems en UNA transacción ACID de PostgreSQL.
  crearConItems({ numero, usuarioId, subtotal, impuestos, total, estado, items }) {
    return postgres.$transaction(async (tx) =>
      tx.factura.create({
        data: { numero, usuarioId, subtotal, impuestos, total, estado, items: { create: items } },
        include: { items: true },
      }),
    );
  },

  listarPorUsuario(usuarioId) {
    return postgres.factura.findMany({
      where: { usuarioId },
      include: { items: true },
      orderBy: { emitidaEn: 'desc' },
    });
  },

  buscarPorId(id) {
    return postgres.factura.findUnique({ where: { id }, include: { items: true } });
  },

  marcarEstado(id, estado) {
    return postgres.factura.update({ where: { id }, data: { estado } });
  },
};
```

- [ ] **Step 3b: Create the checkout service** — `src/services/checkout.service.js`:
```js
import { postgres, mongo } from '../config/database.js';
import { carritoRepository } from '../repositories/carrito.repository.js';
import { facturaRepository } from '../repositories/factura.repository.js';

const err = (status, mensaje) => Object.assign(new Error(mensaje), { status });
const r2 = (n) => Math.round(n * 100) / 100;

export const checkoutService = {
  async procesar({ usuarioId, metodoPagoId }) {
    const carrito = await carritoRepository.buscarPorUsuario(usuarioId);
    if (!carrito || carrito.items.length === 0) throw err(400, 'El carrito está vacío');

    if (metodoPagoId) {
      const mp = await postgres.metodoPago.findUnique({ where: { id: metodoPagoId } });
      if (!mp || mp.usuarioId !== usuarioId) throw err(400, 'Método de pago inválido');
    }

    const items = carrito.items.map((i) => ({
      productoId: i.productoId,
      descripcion: i.nombre,
      cantidad: i.cantidad,
      precioUnit: i.precio,
      subtotal: r2(i.precio * i.cantidad),
    }));
    const subtotal = r2(items.reduce((a, i) => a + i.subtotal, 0));
    const impuestos = r2(subtotal * 0.19);
    const total = r2(subtotal + impuestos);
    const numero = `F-${Date.now()}`;

    // 1) Transacción ACID en PostgreSQL: factura + ítems.
    const factura = await facturaRepository.crearConItems({
      numero, usuarioId, subtotal, impuestos, total, estado: 'PAGADA', items,
    });

    // 2) Post-commit (MongoDB, best-effort): baja stock + vacía carrito.
    //    No hay atomicidad distribuida -> si falla, compensamos anulando la factura.
    try {
      for (const i of carrito.items) {
        await mongo.producto.update({ where: { id: i.productoId }, data: { stock: { decrement: i.cantidad } } });
      }
      await carritoRepository.reemplazarItems(usuarioId, []);
    } catch (e) {
      await facturaRepository.marcarEstado(factura.id, 'ANULADA');
      throw err(500, 'No se pudo actualizar stock/carrito; la factura fue anulada');
    }

    return factura;
  },
};
```

- [ ] **Step 3c: Create the controller** — `src/controllers/factura.controller.js`:
```js
import { checkoutService } from '../services/checkout.service.js';
import { facturaRepository } from '../repositories/factura.repository.js';

export const facturaController = {
  async checkout(req, res, next) {
    try {
      const factura = await checkoutService.procesar({ usuarioId: req.usuario.sub, metodoPagoId: req.body.metodoPagoId });
      res.status(201).json(factura);
    } catch (e) { next(e); }
  },

  async listar(req, res, next) {
    try {
      res.json(await facturaRepository.listarPorUsuario(req.usuario.sub));
    } catch (e) { next(e); }
  },

  async detalle(req, res, next) {
    try {
      const factura = await facturaRepository.buscarPorId(req.params.id);
      if (!factura || factura.usuarioId !== req.usuario.sub) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }
      res.json(factura);
    } catch (e) { next(e); }
  },
};
```

- [ ] **Step 3d: Create routes** — `src/routes/factura.routes.js`:
```js
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { facturaController } from '../controllers/factura.controller.js';

const router = Router();
const soloCliente = [autenticar, autorizar('CLIENTE')];

// Montado en /api: '/checkout' y '/facturas' (ver index.js)
export const checkoutRouter = Router();
checkoutRouter.post('/', ...soloCliente, facturaController.checkout);

router.get('/', ...soloCliente, facturaController.listar);
router.get('/:id', ...soloCliente, facturaController.detalle);

export default router; // router de /facturas
```

- [ ] **Step 3e: Mount both** — in `src/routes/index.js` add:
```js
import facturaRoutes, { checkoutRouter } from './factura.routes.js';
// ...
router.use('/checkout', checkoutRouter);
router.use('/facturas', facturaRoutes);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — invoice totals 200/38/238, cart emptied, stock 10→8, empty-cart 400.

- [ ] **Step 5: Commit**

```bash
git add src/repositories/factura.repository.js src/services/checkout.service.js src/controllers/factura.controller.js src/routes/factura.routes.js src/routes/index.js src/services/checkout.service.test.js
git commit -m "feat(checkout): ACID invoice from cart with stock/cart compensation"
```

---

## Task 10: Invoice history (GET /api/facturas, GET /api/facturas/:id)

> Routes were added in Task 9. This task adds the tests that lock the behavior (history + ownership).

**Files:**
- Create: `src/controllers/factura.controller.test.js`

- [ ] **Step 1: Write the test**

Create `src/controllers/factura.controller.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it passes**

Run: `npm test`
Expected: PASS — history non-empty, cross-user 404, owner 200. (Routes already exist from Task 9.)

- [ ] **Step 3: Commit**

```bash
git add src/controllers/factura.controller.test.js
git commit -m "test(facturas): invoice history and ownership"
```

---

## Task 11: Seed sample catalog + full verification

**Files:**
- Modify: `src/demo.js`

- [ ] **Step 1: Add a catalog seed to the demo**

In `src/demo.js`, the demo already creates `laptop` and `camiseta`. Add more variety so the catalog UI has content. Right after the existing `camiseta` creation (and before the queries section), insert:
```js
  await productoRepository.crear({
    sku: 'DEMO-SIL-001', nombre: 'Silla ergonómica', descripcion: 'Oficina', categoria: 'muebles',
    precio: 180.0, stock: 15, tiendaId: vendedor.id,
    atributos: { material: 'malla', color: 'negro' },
    etiquetas: ['oferta'], marcas: ['Ergo'], industria: ['hogar'],
    variantes: [{ nombre: 'Color', valor: 'Negro', stock: 15 }],
  });
  await productoRepository.crear({
    sku: 'DEMO-AUR-001', nombre: 'Auriculares Bluetooth', descripcion: 'Inalámbricos', categoria: 'electronica',
    precio: 60.0, stock: 40, tiendaId: vendedor.id,
    atributos: { voltaje: '5V', bateria: '20h' },
    etiquetas: ['gamer'], marcas: ['Sony'], industria: ['tecnologia'],
    variantes: [{ nombre: 'Color', valor: 'Blanco', stock: 20 }],
  });
```

- [ ] **Step 2: Run the seed**

Run: `npm run demo`
Expected: ends with `✅ Flujo políglota completo: OK` and the catalog now has ≥4 products.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: ALL tests pass (auth, productos, carrito, checkout, facturas, health).

- [ ] **Step 4: Manual smoke check (optional)**

```bash
npm run dev   # in another terminal
curl "http://localhost:3000/api/productos?categoria=electronica&precioMin=50&precioMax=1500"
```
Expected: JSON `{ data: [...], total, page, limit }` with electronics in range.

- [ ] **Step 5: Commit**

```bash
git add src/demo.js
git commit -m "chore(seed): add sample catalog products to demo"
```

---

## Self-review (completed by author)

- **Spec coverage:** registro con `tipo` (Task 2) ✓; catálogo listado+filtros (Task 3) ✓; detalle (Task 4) ✓; crear/editar/eliminar/mios vendedor (Tasks 5–6) ✓; carrito get + mutaciones (Tasks 7–8) ✓; checkout ACID + compensación (Task 9) ✓; facturas historial+detalle (Task 10) ✓; seed (Task 11) ✓; smoke/integration tests throughout ✓. Reused (no task needed): auth login, metodos-pago. Out of scope per spec: admin UI/endpoints.
- **Placeholder scan:** no TBD/TODO; every code step has complete code; the one note (invalid-ObjectId → 404 in Task 4) is an explicit conditional fix, not a placeholder.
- **Type/route consistency:** `construirWhere` shared by `buscar`/`contar`; `carritoRepository.reemplazarItems` used by both carrito and checkout services; `facturaRepository.crearConItems/listarPorUsuario/buscarPorId/marcarEstado` names match across service/controller; cart item shape `{ productoId, sku, nombre, cantidad, precio }` matches the Mongo `CarritoItem` type; `/productos/mios` registered before `/:id`.

---

## Execution handoff

This is **Plan 1 of 2**. After it is implemented and green, **Plan 2 (frontend)** will be written against these endpoints.
