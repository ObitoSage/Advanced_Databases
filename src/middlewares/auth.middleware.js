// ============================================================================
//  Middlewares de seguridad para RBAC.
//   - autenticar:  valida el JWT (Authorization: Bearer <token>) -> req.usuario
//   - autorizar:   permite el paso solo a los roles indicados
// ============================================================================
import { verificarToken } from '../utils/jwt.util.js';

export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no provisto (usa: Authorization: Bearer <token>)' });
  }

  try {
    req.usuario = verificarToken(token); // { sub, rol, iat, exp }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function autorizar(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Requiere rol: ${rolesPermitidos.join(' | ')}`,
      });
    }
    next();
  };
}
