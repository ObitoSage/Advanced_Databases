// ============================================================================
//  Servicio de autenticación: registro (hash de contraseña) y login (JWT).
// ============================================================================
import { usuarioRepository } from '../repositories/usuario.repository.js';
import { rolRepository } from '../repositories/rol.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.util.js';
import { firmarToken } from '../utils/jwt.util.js';

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

export const authService = {
  // El registro PÚBLICO siempre crea rol CLIENTE (un usuario no puede auto-asignarse ADMIN).
  async registrar({ email, password, nombre }) {
    if (!email || !password || !nombre) {
      throw error(400, 'email, password y nombre son obligatorios');
    }
    if (await usuarioRepository.buscarPorEmail(email)) {
      throw error(409, 'El email ya está registrado');
    }
    const rol = await rolRepository.buscarPorNombre('CLIENTE');
    if (!rol) throw error(500, 'Rol CLIENTE inexistente (siembra los roles primero)');

    const passwordHash = await hashPassword(password); // <-- hash bcrypt
    const usuario = await usuarioRepository.crear({
      email,
      passwordHash,
      nombre,
      rolId: rol.id,
    });
    return { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: 'CLIENTE' };
  },

  async login({ email, password }) {
    const usuario = await usuarioRepository.buscarPorEmail(email); // incluye rol
    // Mismo mensaje para usuario inexistente o password incorrecta (evita enumeración).
    if (!usuario || !(await verifyPassword(password, usuario.passwordHash))) {
      throw error(401, 'Credenciales inválidas');
    }
    const token = firmarToken({ sub: usuario.id, rol: usuario.rol.nombre });
    return {
      token,
      usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre },
    };
  },
};
