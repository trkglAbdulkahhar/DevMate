export interface JwtDecodedData {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  valid: boolean;
}

export interface DeterministicFinding {
  severity: "Low" | "Medium" | "High" | "Critical";
  claim: string;
  issue: string;
  recommendation: string;
}

export function decodeJwt(token: string): JwtDecodedData {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new Error("Token uygun formatta değil: 3 parçadan (Header, Payload, Signature) oluşmalıdır.");
  }
  const [h, p, sig] = parts;

  const header = tryParseJson(base64UrlDecode(h));
  const payload = tryParseJson(base64UrlDecode(p));

  if (!header || !payload) {
    throw new Error("Token içeriği geçersiz (Header veya Payload geçerli bir JSON değil).");
  }

  return {
    header,
    payload,
    signature: sig,
    valid: true,
  };
}

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


export function isExpired(exp: unknown): boolean {
  if (typeof exp !== "number") return false;
  return Date.now() > exp * 1000;
}

export function isNotBeforeValid(nbf: unknown): boolean {
  if (typeof nbf !== "number") return true;
  return Date.now() >= nbf * 1000;
}

export function MaskPii(payload: Record<string, unknown>): Record<string, unknown> {
  const maskedPayload = { ...payload };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const key in maskedPayload) {
    const value = maskedPayload[key];
    if (typeof value === "string") {
      if (emailRegex.test(value)) {
        maskedPayload[key] = value.replace(/(.{1}).+(@.+)/, "$1***$2");
      }
    }
  }

  return maskedPayload;

}

export function getDeterministicChecks(
  header: Record<string, unknown>,
  payload: Record<string, unknown>
): DeterministicFinding[] {
  const findings: DeterministicFinding[] = [];

  if (header.alg === "none") {
    findings.push({
      severity: "Critical",
      claim: "alg",
      issue: "Token algoritmasi 'none' olarak ayarlanmis.Imza dogrulamasi atlatilabilir.",
      recommendation: "Backend tarafinda 'none' algoritmasini kesinlikle reddedin."
    });
  } else if (header.alg === "HS256") {
    findings.push({
      severity: "Medium",
      claim: "alg",
      issue: "Simetrik algoritma (HS256) kullanilmis.",
      recommendation: "Eger token 3. partilere verilebilecekse asimetrik (RS256) kullanilmasi daha guvenlidir."
    });
  }

  if (header.kid) {
    findings.push({
      severity: "High",
      claim: "kid",
      issue: "'kid' (Key ID) kullanılmış. Eğer backend bu değeri kontrolsüzce path/URL üretmekte kullanırsa SSRF zafiyeti doğar.",
      recommendation: "'kid' değerini backend tarafında her zaman statik bir beyaz liste (whitelist) üzerinden doğrulayın."
    });
  }

  if (!payload.jti) {
    findings.push({
      severity: "Medium",
      claim: "jti",
      issue: "Token da 'jti' bulunmuyor. Calismasi durumunda suresi dolana kadar tekrar kullanilabilir (Replay Attack).",
      recommendation: "Her token'a benzersiz bir JTI ekleyin ve backend'de kara liste / nonce kontrolu yapin."
    });
  }

  const payloadString = JSON.stringify(payload);

  if (payloadString.length > 2000) {
    findings.push({
      severity: "Medium",
      claim: "payload_size",
      issue: "Token payload'u cok buyuk,HTTP Header sinirlarini zorlayabilir (DoS riski).",
      recommendation: "Bu kadar fazla veriyi token'a gömmek yerine Opaque Token (Referans Token) mimarisine geçmeyi değerlendirin."
    });
  }

  return findings;

}