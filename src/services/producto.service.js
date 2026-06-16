import { productoRepository } from '../repositories/producto.repository.js';

export const productoService = {
  async listar(filtros) {
    const [data, total] = await Promise.all([
      productoRepository.buscar(filtros),
      productoRepository.contar(filtros),
    ]);
    return { data, total, page: filtros.page ?? 1, limit: filtros.limit ?? 12 };
  },
};
