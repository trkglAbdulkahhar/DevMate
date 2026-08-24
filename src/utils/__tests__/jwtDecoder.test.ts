import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { decodeJwt, base64UrlDecode, tryParseJson, isExpired, isNotBeforeValid } from '../jwtDecoder';

describe('jwtDecoder utility', () => {

  describe('base64UrlDecode', () => {
    it('should decode valid base64url', () => {
      // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" -> {"alg":"HS256","typ":"JWT"}
      const encoded = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const decoded = base64UrlDecode(encoded);
      expect(decoded).toBe('{"alg":"HS256","typ":"JWT"}');
    });

    it('should handle broken base64url gracefully', () => {
      // Invalid base64 that fails atob or decodeURIComponent
      const brokenEncoded = 'invalid-base64@#$';
      expect(() => base64UrlDecode(brokenEncoded)).toThrow(); // atob will throw on strictly invalid chars
    });
  });

  describe('tryParseJson', () => {
    it('should parse valid JSON', () => {
      expect(tryParseJson('{"test": true}')).toEqual({ test: true });
    });

    it('should return null for broken JSON', () => {
      expect(tryParseJson('{"test": true')).toBeNull();
      expect(tryParseJson('just text')).toBeNull();
    });
  });

  describe('decodeJwt', () => {
    it('should decode a valid 3-part JWT', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const result = decodeJwt(token);
      expect(result.valid).toBe(true);
      expect(result.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(result.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
      expect(result.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('should throw error for tokens with wrong number of parts', () => {
      expect(() => decodeJwt('part1.part2')).toThrow("Token uygun formatta değil"); // 2 parts
      expect(() => decodeJwt('part1')).toThrow("Token uygun formatta değil"); // 1 part
      expect(() => decodeJwt('part1.part2.part3.part4')).toThrow("Token uygun formatta değil"); // 4 parts
    });
  });

  describe('Time validation (exp / nbf)', () => {
    beforeEach(() => {
      // Mock Date.now to a fixed time: 2026-01-01T00:00:00.000Z -> 1767225600000 ms
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1767225600000));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return false if exp is missing or not a number', () => {
      expect(isExpired(undefined)).toBe(false);
      expect(isExpired(null)).toBe(false);
      expect(isExpired('1767225600')).toBe(false); // string
    });

    it('should correctly identify expired token', () => {
      // Current time is 1767225600.
      const pastExp = 1700000000;
      expect(isExpired(pastExp)).toBe(true);
    });

    it('should correctly identify valid (future) exp token', () => {
      const futureExp = 1800000000;
      expect(isExpired(futureExp)).toBe(false);
    });

    it('should correctly identify valid nbf (past time)', () => {
      const pastNbf = 1700000000;
      expect(isNotBeforeValid(pastNbf)).toBe(true);
    });

    it('should correctly identify invalid nbf (future time)', () => {
      const futureNbf = 1800000000;
      expect(isNotBeforeValid(futureNbf)).toBe(false);
    });
  });

});
