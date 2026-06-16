import { carritoRepository } from '../repositories/carrito.repository.js';

export const carritoService = {
  async obtener(usuarioId) {
    return (await carritoRepository.buscarPorUsuario(usuarioId)) ?? (await carritoRepository.crearVacio(usuarioId));
  },
};
