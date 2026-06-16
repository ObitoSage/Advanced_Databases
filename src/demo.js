// ============================================================================
//  Demostración end-to-end del flujo de Persistencia Políglota.
//  Ejecuta:  npm run demo
//  Idempotente: limpia sus propios datos (markers DEMO- / @demo.local) y se repite.
// ============================================================================
import {
  postgres,
  mongo,
  connectDatabases,
  disconnectDatabases,
} from './config/database.js';
import { usuarioRepository } from './repositories/usuario.repository.js';
import { productoRepository } from './repositories/producto.repository.js';

const log = (titulo, data) => {
  console.log(`\n=== ${titulo} ===`);
  console.dir(data, { depth: null });
};

async function limpiar() {
  const demoUsuarios = await postgres.usuario.findMany({
    where: { email: { endsWith: '@demo.local' } },
    select: { id: true },
  });
  const ids = demoUsuarios.map((u) => u.id);
  if (ids.length) {
    await mongo.carrito.deleteMany({ where: { usuarioId: { in: ids } } });
    await postgres.factura.deleteMany({ where: { usuarioId: { in: ids } } }); // cascada -> items
    await postgres.usuario.deleteMany({ where: { id: { in: ids } } });
  }
  await mongo.producto.deleteMany({ where: { sku: { startsWith: 'DEMO-' } } });
}

async function main() {
  await connectDatabases();
  await limpiar();

  // 1) RBAC — roles en Postgres
  const rolVendedor = await postgres.rol.upsert({
    where: { nombre: 'VENDEDOR' },
    update: {},
    create: { nombre: 'VENDEDOR', descripcion: 'Publica productos' },
  });
  const rolCliente = await postgres.rol.upsert({
    where: { nombre: 'CLIENTE' },
    update: {},
    create: { nombre: 'CLIENTE', descripcion: 'Compra productos' },
  });

  // 2) Usuarios (Postgres) -> generan UUID (passwordHash simulado)
  const vendedor = await usuarioRepository.crear({
    email: 'tienda.tech@demo.local',
    passwordHash: 'hash_demo',
    nombre: 'TechStore',
    rolId: rolVendedor.id,
  });
  const cliente = await usuarioRepository.crear({
    email: 'ana@demo.local',
    passwordHash: 'hash_demo',
    nombre: 'Ana',
    rolId: rolCliente.id,
  });
  log('Usuarios creados (Postgres, UUID)', {
    vendedor: { id: vendedor.id, email: vendedor.email },
    cliente: { id: cliente.id, email: cliente.email },
  });

  // 3) Productos (Mongo) — tiendaId = UUID del vendedor de Postgres (LINK entre BDs)
  const laptop = await productoRepository.crear({
    sku: 'DEMO-LAP-001',
    nombre: 'Laptop Gamer 15"',
    descripcion: 'Portátil para juegos',
    categoria: 'electronica',
    precio: 1200.0,
    stock: 8,
    tiendaId: vendedor.id,
    atributos: { voltaje: '220V', ram: '16GB', procesador: 'Ryzen 7' }, // BSON dinámico
    etiquetas: ['gamer', 'oferta'],
    marcas: ['Asus'],
    industria: ['tecnologia'],
    variantes: [
      { nombre: 'Color', valor: 'Negro', stock: 5 },
      { nombre: 'Color', valor: 'Plata', stock: 3 },
    ],
  });
  const camiseta = await productoRepository.crear({
    sku: 'DEMO-CAM-001',
    nombre: 'Camiseta algodón',
    descripcion: 'Prenda básica',
    categoria: 'ropa',
    precio: 25.0,
    stock: 50,
    tiendaId: vendedor.id,
    atributos: { talla: 'XL', material: 'algodón' }, // BSON dinámico distinto
    etiquetas: ['oferta', 'verano'],
    marcas: ['Nike'],
    industria: ['moda'],
    variantes: [{ nombre: 'Talla', valor: 'XL', stock: 20 }],
  });
  log('Productos creados (Mongo, atributos BSON dinámicos por categoría)', {
    laptop: { sku: laptop.sku, atributos: laptop.atributos },
    camiseta: { sku: camiseta.sku, atributos: camiseta.atributos },
  });

  // 4) Consultas Mongo con operadores
  log(
    'electronica precio 0–1500  (AND + gte/lte => $and/$gte/$lte)',
    (await productoRepository.buscarPorRangoPrecio({ categoria: 'electronica', min: 0, max: 1500 }))
      .map((p) => p.nombre),
  );
  log(
    'marca "Nike" OR etiqueta "gamer"  ($or sobre arreglos)',
    (await productoRepository.buscarPorMarcaOEtiqueta({ marca: 'Nike', etiqueta: 'gamer' }))
      .map((p) => p.nombre),
  );
  log(
    'etiquetas hasSome ["oferta"]  ($in sobre arreglo)',
    (await productoRepository.buscarPorEtiquetas(['oferta'])).map((p) => p.nombre),
  );
  log(
    'atributo dinámico voltaje=220V  (findRaw + notación de punto)',
    (await productoRepository.buscarPorAtributo('voltaje', '220V')).map((p) => p.nombre),
  );
  log(
    'reporte comparativo NATIVO ($and/$or/$gt/$lt) electronica 100<precio<1500',
    (await productoRepository.reporteComparativo({ categoria: 'electronica', precioMin: 100, precioMax: 1500 }))
      .map((p) => p.nombre),
  );

  // 5) Carrito (Mongo) vinculado por UUID al cliente (Postgres)
  const carrito = await mongo.carrito.create({
    data: {
      usuarioId: cliente.id, // <-- UUID de Postgres
      items: [
        { productoId: laptop.id, sku: laptop.sku, nombre: laptop.nombre, cantidad: 1, precio: laptop.precio },
      ],
    },
  });
  log('Carrito (Mongo) vinculado al UUID del cliente (Postgres)', {
    usuarioId: carrito.usuarioId,
    items: carrito.items,
  });

  // 6) Transacción ACID: factura (Postgres) cuya línea referencia el _id del producto de Mongo
  const factura = await usuarioRepository.emitirFactura({
    usuarioId: cliente.id,
    numero: 'DEMO-F-0001',
    items: [
      { productoId: laptop.id, descripcion: laptop.nombre, cantidad: 1, precioUnit: laptop.precio },
    ],
  });
  log('Factura emitida en transacción ACID (3NF: factura + factura_items)', {
    numero: factura.numero,
    subtotal: String(factura.subtotal),
    impuestos: String(factura.impuestos),
    total: String(factura.total),
    items: factura.items.map((i) => ({ productoId_mongo: i.productoId, total: String(i.subtotal) })),
  });

  // 7) Lectura con join 3NF (usuario + su rol)
  const conRol = await usuarioRepository.buscarPorId(cliente.id);
  log('Cliente con su rol (join 3NF: usuarios + roles)', {
    nombre: conRol.nombre,
    rol: conRol.rol.nombre,
  });

  await disconnectDatabases();
  console.log('\n✅ Flujo políglota completo: OK');
}

main().catch(async (err) => {
  console.error('\n❌ Error en la demo:', err);
  await disconnectDatabases();
  process.exit(1);
});
