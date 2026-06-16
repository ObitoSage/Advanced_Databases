// ============================================================================
//  PASO 5 (A) — Repositorio de Usuario (PostgreSQL).
//  Prisma parametriza todas las consultas => protección nativa contra SQL Injection.
// ============================================================================
import { postgres } from '../config/database.js';

export const usuarioRepository = {
  crear(data) {
    // data: { email, passwordHash, nombre, rolId }
    return postgres.usuario.create({ data });
  },

  buscarPorId(id) {
    return postgres.usuario.findUnique({
      where: { id },
      include: { rol: true }, // join 3NF: trae el rol relacionado
    });
  },

  buscarPorEmail(email) {
    return postgres.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });
  },

  listar() {
    return postgres.usuario.findMany({
      include: { rol: true },
      orderBy: { creadoEn: 'desc' },
    });
  },

  // ---- Ejemplo de transacción ACID: emitir una factura con sus líneas ----
  // Todo se confirma o todo se revierte (atomicidad).
  emitirFactura({ usuarioId, numero, items }) {
    return postgres.$transaction(async (tx) => {
      const subtotal = items.reduce((acc, i) => acc + i.precioUnit * i.cantidad, 0);
      const impuestos = +(subtotal * 0.19).toFixed(2); // IVA 19%
      const total = +(subtotal + impuestos).toFixed(2);

      return tx.factura.create({
        data: {
          numero,
          usuarioId,
          subtotal,
          impuestos,
          total,
          items: {
            create: items.map((i) => ({
              productoId: i.productoId, // _id del producto en Mongo
              descripcion: i.descripcion,
              cantidad: i.cantidad,
              precioUnit: i.precioUnit,
              subtotal: +(i.precioUnit * i.cantidad).toFixed(2),
            })),
          },
        },
        include: { items: true },
      });
    });
  },
};
