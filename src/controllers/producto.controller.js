import { productoService } from '../services/producto.service.js';

const aNumero = (v) => (v == null || v === '' ? undefined : Number(v));
const aLista = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : undefined);

export const productoController = {
  async listar(req, res, next) {
    try {
      const { q, categoria, precioMin, precioMax, etiquetas, marca, page, limit } = req.query;
      const resultado = await productoService.listar({
        q: q || undefined,
        categoria: categoria || undefined,
        precioMin: aNumero(precioMin),
        precioMax: aNumero(precioMax),
        etiquetas: aLista(etiquetas),
        marca: marca || undefined,
        page: aNumero(page) ?? 1,
        limit: aNumero(limit) ?? 12,
      });
      res.json(resultado);
    } catch (e) { next(e); }
  },

  async detalle(req, res, next) {
    try {
      res.json(await productoService.detalle(req.params.id));
    } catch (e) { next(e); }
  },
};
