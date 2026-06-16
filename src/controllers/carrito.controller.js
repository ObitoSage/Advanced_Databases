import { carritoService } from '../services/carrito.service.js';

export const carritoController = {
  async obtener(req, res, next) {
    try {
      res.json(await carritoService.obtener(req.usuario.sub));
    } catch (e) { next(e); }
  },
};
