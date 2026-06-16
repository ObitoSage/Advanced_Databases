// ============================================================================
//  PASO 5 (B) — Repositorio de Producto (MongoDB).
//  Demuestra: operadores de comparación/lógicos, consultas sobre arreglos
//  y filtrado por atributos dinámicos (BSON).
// ============================================================================
import { mongo } from '../config/database.js';

export const productoRepository = {
  crear(data) {
    // data incluye 'atributos' (Json dinámico) y arreglos (etiquetas, marcas...)
    return mongo.producto.create({ data });
  },

  buscarPorId(id) {
    return mongo.producto.findUnique({ where: { id } });
  },

  // Productos publicados por una tienda concreta (link al UUID de PostgreSQL)
  listarPorTienda(tiendaId) {
    return mongo.producto.findMany({ where: { tiendaId } });
  },

  // Búsqueda con filtros combinados (Prisma -> Mongo).
  buscar({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId, page = 1, limit = 12 }) {
    const where = construirWhere({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId });
    const skip = (page - 1) * limit;
    return mongo.producto.findMany({ where, skip, take: limit, orderBy: { creadoEn: 'desc' } });
  },

  contar({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId }) {
    return mongo.producto.count({ where: construirWhere({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId }) });
  },

  actualizar(id, data) {
    return mongo.producto.update({ where: { id }, data });
  },

  eliminar(id) {
    return mongo.producto.delete({ where: { id } });
  },

  // ---- Búsqueda comparativa: $and + $gte/$lte ($gt/$lt) ----
  buscarPorRangoPrecio({ categoria, min, max }) {
    return mongo.producto.findMany({
      where: {
        AND: [
          { categoria },
          { precio: { gte: min, lte: max } },
          { activo: true },
        ],
      },
      orderBy: { precio: 'asc' },
    });
  },

  // ---- Operador lógico $or ----
  buscarPorMarcaOEtiqueta({ marca, etiqueta }) {
    return mongo.producto.findMany({
      where: {
        OR: [
          { marcas: { has: marca } },        // arreglo contiene 'marca'
          { etiquetas: { has: etiqueta } },  // arreglo contiene 'etiqueta'
        ],
      },
    });
  },

  // ---- Consulta sobre arreglos: hasSome / hasEvery ($in) ----
  buscarPorEtiquetas(etiquetas) {
    return mongo.producto.findMany({
      where: { etiquetas: { hasSome: etiquetas } },
    });
  },

  // ---- Filtro por atributo dinámico dentro del BSON ----
  // El conector MongoDB de Prisma NO soporta el filtro 'path' sobre Json (eso es
  // solo PostgreSQL/MySQL). Se usa findRaw con notación de punto nativa de Mongo.
  // ej. electrónica -> ('voltaje','220V')  =>  { "atributos.voltaje": "220V" }
  buscarPorAtributo(clave, valor) {
    return mongo.producto.findRaw({
      filter: { [`atributos.${clave}`]: valor },
    });
  },

  // ---- Reporte comparativo con operadores NATIVOS de MongoDB ----
  // Demuestra literalmente $and, $or, $gt, $lt sobre findRaw.
  reporteComparativo({ categoria, precioMin, precioMax }) {
    return mongo.producto.findRaw({
      filter: {
        $and: [
          { categoria },
          { precio: { $gt: precioMin, $lt: precioMax } },
          { $or: [{ etiquetas: 'oferta' }, { 'atributos.voltaje': { $exists: true } }] },
        ],
      },
    });
  },
};

function construirWhere({ q, categoria, precioMin, precioMax, etiquetas, marca, tiendaId }) {
  const where = { activo: true };
  if (categoria) where.categoria = categoria;
  if (tiendaId) where.tiendaId = tiendaId;
  if (q) where.nombre = { contains: q, mode: 'insensitive' };
  if (precioMin != null || precioMax != null) {
    where.precio = {};
    if (precioMin != null) where.precio.gte = precioMin;
    if (precioMax != null) where.precio.lte = precioMax;
  }
  if (etiquetas?.length) where.etiquetas = { hasSome: etiquetas };
  if (marca) where.marcas = { has: marca };
  return where;
}
