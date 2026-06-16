// ============================================================================
//  Cifrado simétrico AES-256-GCM (autenticado) para datos de tarjeta.
//  GCM aporta confidencialidad + integridad (authTag). La clave (32 bytes)
//  proviene de CARD_ENCRYPTION_KEY (en producción: KMS / secret manager).
// ============================================================================
import crypto from 'node:crypto';

const ALGORITMO = 'aes-256-gcm';

function obtenerClave() {
  const hex = process.env.CARD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'CARD_ENCRYPTION_KEY debe tener 64 caracteres hex (32 bytes). ' +
        'Genera una con: node -e "console.log(require(\'node:crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return Buffer.from(hex, 'hex');
}

/** Cifra un texto. Devuelve { contenido, iv, tag } en Base64. */
export function cifrar(textoPlano) {
  const iv = crypto.randomBytes(12); // 96 bits, recomendado para GCM
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(String(textoPlano), 'utf8'), cipher.final()]);
  return {
    contenido: cifrado.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

/** Descifra { contenido, iv, tag }. Lanza si el authTag no valida (dato manipulado). */
export function descifrar({ contenido, iv, tag }) {
  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const descifrado = Buffer.concat([
    decipher.update(Buffer.from(contenido, 'base64')),
    decipher.final(),
  ]);
  return descifrado.toString('utf8');
}
