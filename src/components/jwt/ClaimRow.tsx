
import { isExpired, isNotBeforeValid } from '../../utils/jwtDecoder';

export const KNOWN_CLAIMS: Record<string, string> = {
  alg: "Algorithm",
  typ: "Type",
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires At",
  nbf: "Not Before",
  iat: "Issued At",
  jti: "JWT ID",
};

export function formatTimestamp(ts: unknown): string {
  if (typeof ts !== "number") return String(ts);
  try {
    return new Date(ts * 1000).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  } catch {
    return String(ts);
  }
}

export function ClaimRow({
  claimKey,
  value,
}: {
  claimKey: string;
  value: unknown;
}) {
  const label = KNOWN_CLAIMS[claimKey] || claimKey;
  const isTime = ["exp", "iat", "nbf"].includes(claimKey);
  const displayVal = isTime ? formatTimestamp(value) : String(value);
  const expired = claimKey === "exp" ? isExpired(value) : null;
  const nbfValid = claimKey === "nbf" ? isNotBeforeValid(value) : null;

  let badgeNode = null;
  if (expired !== null) {
    badgeNode = (
      <span
        className={`px-1.5 py-0.5 rounded text-xs font-semibold tracking-wide ${
          expired ? "badge-expired" : "badge-valid"
        }`}
        style={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
      >
        {expired ? "EXPIRED" : "VALID"}
      </span>
    );
  } else if (nbfValid !== null) {
    badgeNode = (
      <span
        className={`px-1.5 py-0.5 rounded text-xs font-semibold tracking-wide ${
          nbfValid ? "badge-valid" : "badge-inactive"
        }`}
        style={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
      >
        {nbfValid ? "ACTIVE" : "NOT ACTIVE YET"}
      </span>
    );
  }

  return (
    <div
      className="flex items-start gap-3 py-2.5"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div style={{ minWidth: 120, flex: "0 0 120px" }}>
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            color: "#a855f7",
            textShadow: "0 0 6px rgba(168,85,247,0.4)",
          }}
        >
          {claimKey}
        </span>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
          {label}
        </div>
      </div>
      <div className="flex-1 flex items-center gap-2 flex-wrap">
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
            wordBreak: "break-all",
          }}
        >
          {displayVal}
        </span>
        {badgeNode}
      </div>
    </div>
  );
}
