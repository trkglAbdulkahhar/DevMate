import { describe, it, expect } from 'vitest';
import { MaskPii, getDeterministicChecks } from '../jwtDecoder';

describe('jwtDecoder utility tests', () => {
  describe('MaskPii', () => {
    it('should mask top-level email addresses', () => {
      const payload = { email: "user@example.com", name: "John Doe" };
      const masked = MaskPii(payload);
      expect(masked.email).toBe("u***@example.com");
      expect(masked.name).toBe("John Doe");
    });

    it('should mask sensitive keys', () => {
      const payload = { 
        password: "mysecretpassword", 
        userToken: "abc123xyz", 
        SSN: "123-45-678" 
      };
      const masked = MaskPii(payload);
      expect(masked.password).toBe("***MASKED***");
      expect(masked.userToken).toBe("***MASKED***");
      expect(masked.SSN).toBe("***MASKED***");
    });

    it('should recursively mask nested objects and arrays', () => {
      const payload = {
        user: {
          email: "nested@test.com",
          secretKey: "hidden_value"
        },
        items: [
          { token: "item_token" },
          "normal_string"
        ]
      };
      const masked = MaskPii(payload);
      expect((masked.user as any).email).toBe("n***@test.com");
      expect((masked.user as any).secretKey).toBe("***MASKED***");
      expect((masked.items as any[])[0].token).toBe("***MASKED***");
      expect((masked.items as any[])[1]).toBe("normal_string");
    });
  });

  describe('getDeterministicChecks', () => {
    it('should flag alg "none" as Critical', () => {
      const header = { alg: "none" };
      const payload = { jti: "123" };
      const checks = getDeterministicChecks(header, payload);
      const algCheck = checks.find(c => c.claim === 'alg');
      expect(algCheck).toBeDefined();
      expect(algCheck?.severity).toBe("Critical");
    });

    it('should flag alg "HS256" as Low risk indicator', () => {
      const header = { alg: "HS256" };
      const payload = { jti: "123" };
      const checks = getDeterministicChecks(header, payload);
      const algCheck = checks.find(c => c.claim === 'alg');
      expect(algCheck).toBeDefined();
      expect(algCheck?.severity).toBe("Low");
      expect(algCheck?.issue).toContain("Risk göstergesi");
    });

    it('should flag missing "jti" as Low risk indicator', () => {
      const header = { alg: "RS256" };
      const payload = { sub: "user" }; // missing jti
      const checks = getDeterministicChecks(header, payload);
      const jtiCheck = checks.find(c => c.claim === 'jti');
      expect(jtiCheck).toBeDefined();
      expect(jtiCheck?.severity).toBe("Low");
      expect(jtiCheck?.issue).toContain("Risk göstergesi");
    });

    it('should flag "kid" presence as Low risk indicator', () => {
      const header = { alg: "RS256", kid: "some-key-id" };
      const payload = { jti: "123" };
      const checks = getDeterministicChecks(header, payload);
      const kidCheck = checks.find(c => c.claim === 'kid');
      expect(kidCheck).toBeDefined();
      expect(kidCheck?.severity).toBe("Low");
      expect(kidCheck?.issue).toContain("Risk göstergesi");
    });

    it('should flag large payloads as Medium DoS risk', () => {
      const header = { alg: "RS256" };
      let bigString = "";
      for (let i = 0; i < 3000; i++) bigString += "a";
      const payload = { jti: "123", data: bigString };
      const checks = getDeterministicChecks(header, payload);
      const sizeCheck = checks.find(c => c.claim === 'payload_size');
      expect(sizeCheck).toBeDefined();
      expect(sizeCheck?.severity).toBe("Medium");
    });
  });
});
