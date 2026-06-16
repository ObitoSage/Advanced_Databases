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
