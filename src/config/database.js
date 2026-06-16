// ============================================================================
//  PASO 4 — Inicializa y exporta AMBOS clientes Prisma (PostgreSQL + MongoDB).
//  Patrón singleton: evita agotar conexiones al recargar en desarrollo.
// ============================================================================
import 'dotenv/config';
import { PrismaClient as PostgresClient } from '@prisma/postgres-client';
import { PrismaClient as MongoClient } from '@prisma/mongo-client';

const globalForPrisma = globalThis;

export const postgres =
  globalForPrisma.__postgres ??
  new PostgresClient({ log: ['warn', 'error'] });

export const mongo =
  globalForPrisma.__mongo ??
  new MongoClient({ log: ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__postgres = postgres;
  globalForPrisma.__mongo = mongo;
}

/** Abre las dos conexiones en paralelo. Llamar al arrancar la app. */
export async function connectDatabases() {
  await Promise.all([postgres.$connect(), mongo.$connect()]);
  console.log('✅ PostgreSQL y MongoDB conectados');
}

/** Cierra las dos conexiones (apagado ordenado). */
export async function disconnectDatabases() {
  await Promise.all([postgres.$disconnect(), mongo.$disconnect()]);
  console.log('🔌 PostgreSQL y MongoDB desconectados');
}
