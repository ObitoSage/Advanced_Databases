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
