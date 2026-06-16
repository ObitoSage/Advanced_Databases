import { productoRepository } from '../repositories/producto.repository.js';

export const productoService = {
  async listar(filtros) {
    const [data, total] = await Promise.all([
      productoRepository.buscar(filtros),
      productoRepository.contar(filtros),
    ]);
    return { data, total, page: filtros.page ?? 1, limit: filtros.limit ?? 12 };
  },

  async detalle(id) {
    const producto = await productoRepository.buscarPorId(id);
    if (!producto) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    return producto;
  },

  crear({ tiendaId, ...datos }) {
    if (!datos.sku || !datos.nombre || !datos.categoria || datos.precio == null) {
      throw Object.assign(new Error('sku, nombre, categoria y precio son obligatorios'), { status: 400 });
    }
    return productoRepository.crear({
      sku: datos.sku,
      nombre: datos.nombre,
      descripcion: datos.descripcion ?? null,
      categoria: datos.categoria,
      precio: Number(datos.precio),
      stock: Number(datos.stock ?? 0),
      tiendaId,
      atributos: datos.atributos ?? {},
      etiquetas: datos.etiquetas ?? [],
      marcas: datos.marcas ?? [],
      industria: datos.industria ?? [],
      variantes: datos.variantes ?? [],
    });
  },
};
