import * as crypto from 'crypto';

export class PrivacyUtil {
  /**
   * Mask nomor telepon sesuai kaidah UU PDP (contoh: +62812****8901)
   */
  static maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 7) return '***';
    const clean = phone.replace(/[^0-9+]/g, '');
    const prefix = clean.slice(0, 5);
    const suffix = clean.slice(-4);
    return `${prefix}****${suffix}`;
  }

  /**
   * Field-level encryption untuk koordinat & detail alamat pelanggan
   */
  static encryptField(text: string, secretKeyHex: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secretKeyHex, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decryptField(payload: string, secretKeyHex: string = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'): string {
    const [ivHex, authTagHex, encrypted] = payload.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted payload format');
    }
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(secretKeyHex, 'hex'), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
