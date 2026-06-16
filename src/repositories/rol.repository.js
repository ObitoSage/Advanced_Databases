// ============================================================================
//  Repositorio de Rol (PostgreSQL) — soporte RBAC.
// ============================================================================
import { postgres } from '../config/database.js';

export const rolRepository = {
  buscarPorNombre(nombre) {
    return postgres.rol.findUnique({ where: { nombre } });
  },

  listar() {
    return postgres.rol.findMany({ orderBy: { id: 'asc' } });
  },
};
