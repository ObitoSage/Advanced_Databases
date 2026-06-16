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
