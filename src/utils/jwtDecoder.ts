export function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const b64 = padded + "=".repeat(padLen);
  try {
    return decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return atob(b64);
  }
}

export function tryParseJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export interface JwtDecodedData {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  valid: boolean;
}

export function decodeJwt(token: string): JwtDecodedData {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Token uygun formatta değil: 3 parçadan (Header, Payload, Signature) oluşmalıdır.");
  }
  const [h, p, sig] = parts;
  return {
    header: tryParseJson(base64UrlDecode(h)),
    payload: tryParseJson(base64UrlDecode(p)),
    signature: sig,
    valid: true,
  };
}

export function isExpired(exp: unknown): boolean {
  if (typeof exp !== "number") return false;
  return Date.now() > exp * 1000;
}

export function isNotBeforeValid(nbf: unknown): boolean {
  if (typeof nbf !== "number") return true;
  return Date.now() >= nbf * 1000;
}
