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
    imagenes: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80'],
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
    imagenes: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'],
    variantes: [{ nombre: 'Talla', valor: 'XL', stock: 20 }],
  });
  await productoRepository.crear({
    sku: 'DEMO-SIL-001', nombre: 'Silla ergonómica', descripcion: 'Silla de oficina con soporte lumbar', categoria: 'muebles',
    precio: 180.0, stock: 15, tiendaId: vendedor.id,
    atributos: { material: 'malla', color: 'negro' },
    etiquetas: ['oferta'], marcas: ['Ergo'], industria: ['hogar'],
    imagenes: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=900&q=80'],
    variantes: [{ nombre: 'Color', valor: 'Negro', stock: 15 }],
  });
  await productoRepository.crear({
    sku: 'DEMO-AUR-001', nombre: 'Auriculares Bluetooth', descripcion: 'Auriculares inalámbricos con cancelación de ruido', categoria: 'electronica',
    precio: 60.0, stock: 40, tiendaId: vendedor.id,
    atributos: { voltaje: '5V', bateria: '20h' },
    etiquetas: ['gamer'], marcas: ['Sony'], industria: ['tecnologia'],
    imagenes: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
    variantes: [{ nombre: 'Color', valor: 'Blanco', stock: 20 }],
  });

  // Catálogo ampliado para una vitrina editorial completa.
  const masProductos = [
    { sku: 'DEMO-SNK-001', nombre: 'Zapatillas Cloud runner', descripcion: 'Zapatillas ligeras con suela técnica', categoria: 'zapatos', precio: 122.0, stock: 25, atributos: { talla: '42', material: 'malla técnica', color: 'negro' }, etiquetas: ['oferta', 'novedad'], marcas: ['On'], industria: ['moda'], imagenes: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-SNK-002', nombre: 'Zapatillas 9060 retro', descripcion: 'Siluetas de los 2000 con amortiguación', categoria: 'zapatos', precio: 180.0, stock: 18, atributos: { talla: '43', material: 'gamuza', color: 'gris' }, etiquetas: ['novedad'], marcas: ['New Balance'], industria: ['moda'], imagenes: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-VES-001', nombre: 'Vestido midi plisado', descripcion: 'Vestido de tejido fluido para diario', categoria: 'ropa', precio: 95.0, stock: 30, atributos: { talla: 'M', material: 'viscosa', color: 'marfil' }, etiquetas: ['novedad', 'verano'], marcas: ['Atelier'], industria: ['moda'], imagenes: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-BOL-001', nombre: 'Bolso de piel estructurado', descripcion: 'Bolso tipo tote en piel granulada', categoria: 'accesorios', precio: 320.0, stock: 12, atributos: { material: 'piel', color: 'camel' }, etiquetas: ['novedad'], marcas: ['Maison'], industria: ['moda'], imagenes: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-REL-001', nombre: 'Reloj automático acero', descripcion: 'Reloj de pulsera con movimiento automático', categoria: 'accesorios', precio: 410.0, stock: 8, atributos: { material: 'acero inoxidable', color: 'plata' }, etiquetas: [], marcas: ['Nordgreen'], industria: ['moda'], imagenes: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-SOF-001', nombre: 'Sofá modular tres plazas', descripcion: 'Sofá tapizado de líneas suaves', categoria: 'muebles', precio: 890.0, stock: 5, atributos: { material: 'lino', color: 'arena', dimensiones: '220x95cm' }, etiquetas: ['oferta'], marcas: ['Form'], industria: ['hogar'], imagenes: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-CAM-002', nombre: 'Cámara mirrorless 24MP', descripcion: 'Cámara compacta para creadores', categoria: 'electronica', precio: 740.0, stock: 10, atributos: { voltaje: '7.2V', resolucion: '24MP' }, etiquetas: ['novedad'], marcas: ['Fujon'], industria: ['tecnologia'], imagenes: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80'] },
    { sku: 'DEMO-GAF-001', nombre: 'Gafas de sol acetato', descripcion: 'Montura de acetato con lentes polarizadas', categoria: 'accesorios', precio: 130.0, stock: 22, atributos: { material: 'acetato', color: 'carey' }, etiquetas: ['verano', 'oferta'], marcas: ['Komono'], industria: ['moda'], imagenes: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80'] },
  ];
  for (const p of masProductos) {
    await productoRepository.crear({ ...p, descripcion: p.descripcion, stock: p.stock, tiendaId: vendedor.id, variantes: [] });
  }
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
