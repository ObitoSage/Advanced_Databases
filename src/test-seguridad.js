// ============================================================================
//  Prueba end-to-end de seguridad: hash de contraseña, JWT, RBAC y cifrado AES.
//  Ejecuta:  npm run demo:seguridad   (requiere contenedores arriba)
//  Es autónomo: levanta la app en un puerto de prueba y hace peticiones HTTP.
// ============================================================================
import 'dotenv/config';
import { app } from './app.js';
import { connectDatabases, disconnectDatabases, postgres } from './config/database.js';
import { hashPassword } from './utils/password.util.js';
import { metodoPagoService } from './services/metodoPago.service.js';

const PORT = 4100;
const base = `http://localhost:${PORT}`;
let server;
let fallos = 0;

const check = (desc, cond, extra = '') => {
  if (!cond) fallos++;
  console.log(`${cond ? '✅' : '❌'} ${desc}${extra ? `  ->  ${extra}` : ''}`);
};

async function post(path, body, token) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
async function get(path, token) {
  const res = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function limpiar() {
  const us = await postgres.usuario.findMany({
    where: { email: { endsWith: '@seg.local' } },
    select: { id: true },
  });
  const ids = us.map((u) => u.id);
  if (ids.length) {
    await postgres.metodoPago.deleteMany({ where: { usuarioId: { in: ids } } });
    await postgres.usuario.deleteMany({ where: { id: { in: ids } } });
  }
}

async function main() {
  await connectDatabases();
  await limpiar();

  // Semilla: roles + un ADMIN (creado directamente con hash real)
  const rolCliente = await postgres.rol.upsert({ where: { nombre: 'CLIENTE' }, update: {}, create: { nombre: 'CLIENTE' } });
  const rolAdmin = await postgres.rol.upsert({ where: { nombre: 'ADMIN' }, update: {}, create: { nombre: 'ADMIN' } });
  void rolCliente;
  await postgres.usuario.create({
    data: { email: 'admin@seg.local', passwordHash: await hashPassword('admin123'), nombre: 'Admin', rolId: rolAdmin.id },
  });

  server = app.listen(PORT);

  console.log('\n--- 1) Hash de contraseña al registrar ---');
  const reg = await post('/api/auth/registro', { email: 'cliente@seg.local', password: 'secreto123', nombre: 'Cliente' });
  check('POST /api/auth/registro -> 201', reg.status === 201, `status=${reg.status}`);
  const enDb = await postgres.usuario.findUnique({ where: { email: 'cliente@seg.local' } });
  check('passwordHash NO es texto plano', enDb && enDb.passwordHash !== 'secreto123');
  check('passwordHash tiene formato bcrypt ($2...)', /^\$2[aby]\$/.test(enDb.passwordHash), enDb.passwordHash.slice(0, 7) + '...');

  console.log('\n--- 2) Login + emisión de JWT ---');
  const loginCli = await post('/api/auth/login', { email: 'cliente@seg.local', password: 'secreto123' });
  check('login correcto -> 200 con token', loginCli.status === 200 && Boolean(loginCli.body.token));
  const malo = await post('/api/auth/login', { email: 'cliente@seg.local', password: 'incorrecta' });
  check('login con password incorrecta -> 401', malo.status === 401);
  const tokenCli = loginCli.body.token;
  const tokenAdm = (await post('/api/auth/login', { email: 'admin@seg.local', password: 'admin123' })).body.token;

  console.log('\n--- 3) RBAC: GET /api/usuarios (solo ADMIN) ---');
  check('sin token -> 401', (await get('/api/usuarios')).status === 401);
  check('token CLIENTE -> 403 (denegado)', (await get('/api/usuarios', tokenCli)).status === 403);
  check('token ADMIN -> 200 (permitido)', (await get('/api/usuarios', tokenAdm)).status === 200);

  console.log('\n--- 4) Cifrado de tarjeta (AES-256-GCM) ---');
  const card = await post('/api/metodos-pago',
    { titular: 'CLIENTE PRUEBA', numero: '4111 1111 1111 1234', marca: 'VISA', expMes: 12, expAnio: 2030 },
    tokenCli);
  check('CLIENTE registra tarjeta -> 201', card.status === 201, `status=${card.status}`);
  check('la respuesta solo expone ultimos4 (no el PAN)', card.body.ultimos4 === '1234' && !('panCifrado' in card.body));
  const metodoDb = await postgres.metodoPago.findFirst({ where: { ultimos4: '1234' }, orderBy: { creadoEn: 'desc' } });
  check('el PAN en BD está cifrado (no contiene "4111")', metodoDb && !metodoDb.panCifrado.includes('4111'));
  check('se almacenan iv y authTag (GCM)', Boolean(metodoDb.panIv) && Boolean(metodoDb.panTag));
  const pan = await metodoPagoService.revelarPan(metodoDb.id);
  check('el descifrado recupera el PAN original', pan === '4111111111111234', pan);

  console.log('\n--- 5) Listado de tarjetas enmascarado ---');
  const lista = await get('/api/metodos-pago', tokenCli);
  check('GET /api/metodos-pago -> 200 y sin campos cifrados',
    lista.status === 200 && Array.isArray(lista.body) && lista.body.every((m) => !('panCifrado' in m)));

  console.log(`\n${fallos === 0 ? '✅ TODAS LAS PRUEBAS DE SEGURIDAD PASARON' : `❌ ${fallos} prueba(s) fallaron`}`);

  server.close();
  await disconnectDatabases();
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error('\n❌ Error en test-seguridad:', e);
  try { server?.close(); } catch { /* noop */ }
  await disconnectDatabases();
  process.exit(1);
});
