// ============================================================================
//  Controlador de usuarios. El listado es una ruta protegida solo para ADMIN
//  (se usa para demostrar el RBAC).
// ============================================================================
import { usuarioRepository } from '../repositories/usuario.repository.js';

export const usuarioController = {
  async listar(_req, res, next) {
    try {
      const usuarios = await usuarioRepository.listar();
      res.json(
        usuarios.map((u) => ({
          id: u.id,
          email: u.email,
          nombre: u.nombre,
          rol: u.rol.nombre,
        })),
      );
    } catch (e) {
      next(e);
    }
  },
};
