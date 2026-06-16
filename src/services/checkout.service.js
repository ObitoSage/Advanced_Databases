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
