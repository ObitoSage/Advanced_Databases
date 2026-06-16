// ============================================================================
//  Controlador de autenticación (capa fina: traduce HTTP <-> servicio).
// ============================================================================
import { authService } from '../services/auth.service.js';

export const authController = {
  async registrar(req, res, next) {
    try {
      res.status(201).json(await authService.registrar(req.body));
    } catch (e) {
      next(e);
    }
  },

  async login(req, res, next) {
    try {
      res.json(await authService.login(req.body));
    } catch (e) {
      next(e);
    }
  },
};
