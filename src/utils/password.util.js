// ============================================================================
//  Hashing de contraseñas con bcrypt (one-way + salt automático).
//  Las contraseñas NO se cifran (reversible); se hashean. No se pueden recuperar.
// ============================================================================
import bcrypt from 'bcryptjs';

const ROUNDS = 10; // factor de coste (mayor = más lento = más seguro)

/** Devuelve el hash bcrypt de una contraseña en claro. */
export function hashPassword(passwordPlano) {
  return bcrypt.hash(passwordPlano, ROUNDS);
}

/** Compara una contraseña en claro contra su hash almacenado. */
export function verifyPassword(passwordPlano, hash) {
  return bcrypt.compare(passwordPlano, hash);
}
