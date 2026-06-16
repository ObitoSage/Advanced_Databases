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
