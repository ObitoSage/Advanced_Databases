import { checkoutService } from '../services/checkout.service.js';
import { facturaRepository } from '../repositories/factura.repository.js';

export const facturaController = {
  async checkout(req, res, next) {
    try {
      const factura = await checkoutService.procesar({ usuarioId: req.usuario.sub, metodoPagoId: req.body.metodoPagoId });
      res.status(201).json(factura);
    } catch (e) { next(e); }
  },

  async listar(req, res, next) {
    try {
      res.json(await facturaRepository.listarPorUsuario(req.usuario.sub));
    } catch (e) { next(e); }
  },

  async detalle(req, res, next) {
    try {
      const factura = await facturaRepository.buscarPorId(req.params.id);
      if (!factura || factura.usuarioId !== req.usuario.sub) {
        return res.status(404).json({ error: 'Factura no encontrada' });
      }
      res.json(factura);
    } catch (e) { next(e); }
  },
};
