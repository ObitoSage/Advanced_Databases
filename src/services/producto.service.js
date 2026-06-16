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

  listarDeTienda(tiendaId) {
    return productoRepository.listarPorTienda(tiendaId);
  },

  async actualizar({ id, tiendaId, cambios }) {
    const actual = await productoRepository.buscarPorId(id);
    if (!actual) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    if (actual.tiendaId !== tiendaId) {
      throw Object.assign(new Error('No puedes editar productos de otra tienda'), { status: 403 });
    }
    // Solo se permiten campos editables (no se puede cambiar tiendaId ni sku).
    const permitido = {};
    for (const k of ['nombre', 'descripcion', 'categoria', 'precio', 'stock', 'atributos', 'etiquetas', 'marcas', 'industria', 'variantes', 'activo']) {
      if (cambios[k] !== undefined) permitido[k] = k === 'precio' ? Number(cambios[k]) : k === 'stock' ? Number(cambios[k]) : cambios[k];
    }
    return productoRepository.actualizar(id, permitido);
  },

  async eliminar({ id, tiendaId }) {
    const actual = await productoRepository.buscarPorId(id);
    if (!actual) throw Object.assign(new Error('Producto no encontrado'), { status: 404 });
    if (actual.tiendaId !== tiendaId) {
      throw Object.assign(new Error('No puedes eliminar productos de otra tienda'), { status: 403 });
    }
    await productoRepository.eliminar(id);
  },
};
