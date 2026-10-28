import { PrivacyUtil } from './privacy.util.js';

describe('PrivacyUtil', () => {
  it('should mask phone number preserving prefix and suffix', () => {
    const masked = PrivacyUtil.maskPhoneNumber('+6281234567890');
    expect(masked).toBe('+6281****7890');
  });

  it('should return *** for too short phone numbers', () => {
    expect(PrivacyUtil.maskPhoneNumber('123')).toBe('***');
    expect(PrivacyUtil.maskPhoneNumber('')).toBe('***');
  });

  it('should encrypt and decrypt field correctly using AES-256-GCM', () => {
    const rawAddress = 'Jl. Kemang Raya No. 45, Mampang Prapatan, Jakarta Selatan';
    const encrypted = PrivacyUtil.encryptField(rawAddress);
    expect(encrypted).not.toBe(rawAddress);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = PrivacyUtil.decryptField(encrypted);
    expect(decrypted).toBe(rawAddress);
  });

  it('should throw error when decrypting invalid payload format', () => {
    expect(() => PrivacyUtil.decryptField('invalid-payload')).toThrow('Invalid encrypted payload format');
  });
});
