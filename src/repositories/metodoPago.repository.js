// ============================================================================
//  Repositorio de MetodoPago (PostgreSQL). Persiste el PAN ya cifrado.
// ============================================================================
import { postgres } from '../config/database.js';

export const metodoPagoRepository = {
  crear(data) {
    return postgres.metodoPago.create({ data });
  },

  // Listado seguro: NUNCA expone los campos cifrados (panCifrado/panIv/panTag).
  listarPorUsuario(usuarioId) {
    return postgres.metodoPago.findMany({
      where: { usuarioId },
      select: {
        id: true,
        titular: true,
        marca: true,
        ultimos4: true,
        expMes: true,
        expAnio: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
  },

  // Trae el registro completo (incluye campos cifrados) — uso interno/back-office.
  buscarPorId(id) {
    return postgres.metodoPago.findUnique({ where: { id } });
  },
};
