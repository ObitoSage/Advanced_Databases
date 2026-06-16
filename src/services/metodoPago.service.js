// ============================================================================
//  Servicio de métodos de pago: cifra el PAN antes de persistir y nunca lo
//  devuelve en claro al cliente (solo últimos 4).
// ============================================================================
import { metodoPagoRepository } from '../repositories/metodoPago.repository.js';
import { cifrar, descifrar } from '../utils/cifrado.util.js';

function error(status, mensaje) {
  const e = new Error(mensaje);
  e.status = status;
  return e;
}

export const metodoPagoService = {
  async guardar({ usuarioId, titular, numero, marca, expMes, expAnio }) {
    if (!numero || !titular || !marca) {
      throw error(400, 'titular, numero y marca son obligatorios');
    }
    const pan = String(numero).replace(/[\s-]/g, '');
    if (!/^\d{13,19}$/.test(pan)) throw error(400, 'Número de tarjeta inválido');

    // CIFRADO AES-256-GCM del PAN. El CVV no se recibe ni se guarda.
    const { contenido, iv, tag } = cifrar(pan);

    const metodo = await metodoPagoRepository.crear({
      usuarioId,
      titular,
      marca,
      ultimos4: pan.slice(-4),
      expMes,
      expAnio,
      panCifrado: contenido,
      panIv: iv,
      panTag: tag,
    });

    // Respuesta segura (sin datos cifrados).
    return { id: metodo.id, titular: metodo.titular, marca: metodo.marca, ultimos4: metodo.ultimos4 };
  },

  listar(usuarioId) {
    return metodoPagoRepository.listarPorUsuario(usuarioId);
  },

  // Uso interno/back-office: descifra el PAN. NO exponer por una ruta pública.
  async revelarPan(id) {
    const m = await metodoPagoRepository.buscarPorId(id);
    if (!m) return null;
    return descifrar({ contenido: m.panCifrado, iv: m.panIv, tag: m.panTag });
  },
};
