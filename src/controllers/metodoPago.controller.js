// ============================================================================
//  Controlador de métodos de pago. El usuarioId se toma del token (req.usuario.sub),
//  no del body: un usuario solo registra tarjetas a su propio nombre.
// ============================================================================
import { metodoPagoService } from '../services/metodoPago.service.js';

export const metodoPagoController = {
  async crear(req, res, next) {
    try {
      const metodo = await metodoPagoService.guardar({
        ...req.body,
        usuarioId: req.usuario.sub,
      });
      res.status(201).json(metodo);
    } catch (e) {
      next(e);
    }
  },

  async listar(req, res, next) {
    try {
      res.json(await metodoPagoService.listar(req.usuario.sub));
    } catch (e) {
      next(e);
    }
  },
};
