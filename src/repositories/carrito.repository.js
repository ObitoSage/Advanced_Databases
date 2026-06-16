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
