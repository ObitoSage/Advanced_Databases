// ============================================================================
//  Firma y verificación de JSON Web Tokens (autenticación para RBAC).
// ============================================================================
import jwt from 'jsonwebtoken';

function obtenerSecreto() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) throw new Error('JWT_SECRET no está definido en el entorno');
  return secreto;
}

/** Firma un payload (ej. { sub, rol }) y devuelve el token. */
export function firmarToken(payload) {
  return jwt.sign(payload, obtenerSecreto(), {
    expiresIn: process.env.JWT_EXPIRES || '1h',
  });
}

/** Verifica un token y devuelve su payload. Lanza si es inválido o expiró. */
export function verificarToken(token) {
  return jwt.verify(token, obtenerSecreto());
}
