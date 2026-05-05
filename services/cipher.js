/**
 * RemindFlow — Cipher Service v4.1.0
 * Cifrado AES-256-GCM usando el módulo crypto nativo de Node.js.
 * Sin dependencias externas. Compatible con producción en Railway/Heroku/VPS.
 *
 * Requiere variable de entorno: CIPHER_SECRET (mínimo 32 caracteres)
 * El IV se genera aleatoriamente por cada cifrado y se adjunta al resultado.
 * El authTag de GCM garantiza integridad — detecta manipulación de datos.
 */

const crypto = require('crypto');

const ALGORITHM  = 'aes-256-gcm';
const IV_LENGTH  = 12;   // 96 bits — recomendado para GCM
const TAG_LENGTH = 16;   // 128 bits authTag
const KEY_LENGTH = 32;   // 256 bits

/**
 * Deriva una clave de 32 bytes a partir de CIPHER_SECRET usando SHA-256.
 * Permite usar secrets de cualquier longitud sin restricciones.
 */
function getKey() {
  const secret = process.env.CIPHER_SECRET;
  if (!secret) throw new Error('CIPHER_SECRET no está definido en .env');
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Cifra un texto plano.
 * @param {string} plaintext
 * @returns {string} formato: iv_hex:tag_hex:ciphertext_hex
 */
function encrypt(plaintext) {
  if (!plaintext) return '';
  const key = getKey();
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descifra un texto cifrado con encrypt().
 * @param {string} ciphertext formato: iv_hex:tag_hex:ciphertext_hex
 * @returns {string} texto plano original
 */
function decrypt(ciphertext) {
  if (!ciphertext) return '';
  const key = getKey();
  const [ivHex, tagHex, dataHex] = ciphertext.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Formato de ciphertext inválido');
  const iv       = Buffer.from(ivHex,  'hex');
  const tag      = Buffer.from(tagHex, 'hex');
  const data     = Buffer.from(dataHex,'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

module.exports = { encrypt, decrypt };
