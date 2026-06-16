import { carritoService } from '../services/carrito.service.js';

export const carritoController = {
  async obtener(req, res, next) {
    try {
      res.json(await carritoService.obtener(req.usuario.sub));
    } catch (e) { next(e); }
  },

  async agregar(req, res, next) {
    try {
      res.status(201).json(await carritoService.agregarItem(req.usuario.sub, req.body));
    } catch (e) { next(e); }
  },

  async cambiar(req, res, next) {
    try {
      res.json(await carritoService.cambiarCantidad(req.usuario.sub, req.params.productoId, req.body.cantidad));
    } catch (e) { next(e); }
  },

  async quitar(req, res, next) {
    try {
      res.json(await carritoService.quitarItem(req.usuario.sub, req.params.productoId));
    } catch (e) { next(e); }
  },

  async vaciar(req, res, next) {
    try {
      res.json(await carritoService.vaciar(req.usuario.sub));
    } catch (e) { next(e); }
  },
};
