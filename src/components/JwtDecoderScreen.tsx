import React, { useState, useCallback } from "react";

// ── helpers ──────────────────────────────────────────────────────────────────

function base64UrlDecode(str: string): string {
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

function tryParseJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

interface Parsed {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
  valid: boolean;
}

function parseJwt(token: string): Parsed {
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

// ── syntax highlighting ───────────────────────────────────────────────────────

const JSON_COLORS = {
  key: "#e879f9",
  string: "#86efac",
  number: "#f9a8d4",
  boolean: "#67e8f9",
  null: "#94a3b8",
  punctuation: "rgba(255,255,255,0.35)",
};

function colorizeJson(obj: Record<string, unknown>): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  const entries = Object.entries(obj);

  lines.push(
    <span key="open" style={{ color: JSON_COLORS.punctuation }}>{"{"}{"\n"}</span>
  );

  entries.forEach(([key, val], i) => {
    const isLast = i === entries.length - 1;
    const comma = isLast ? "" : ",";
    let valueEl: React.ReactNode;

    if (val === null) {
      valueEl = <span style={{ color: JSON_COLORS.null }}>null</span>;
    } else if (typeof val === "boolean") {
      valueEl = <span style={{ color: JSON_COLORS.boolean }}>{String(val)}</span>;
    } else if (typeof val === "number") {
      valueEl = <span style={{ color: JSON_COLORS.number }}>{val}</span>;
    } else if (typeof val === "string") {
      valueEl = <span style={{ color: JSON_COLORS.string }}>"{val}"</span>;
    } else {
      valueEl = <span style={{ color: JSON_COLORS.string }}>"{JSON.stringify(val)}"</span>;
    }

    lines.push(
      <span key={key}>
        {"  "}
        <span style={{ color: JSON_COLORS.key }}>"{key}"</span>
        <span style={{ color: JSON_COLORS.punctuation }}>: </span>
        {valueEl}
        <span style={{ color: JSON_COLORS.punctuation }}>{comma}</span>
        {"\n"}
      </span>
    );
  });

  lines.push(
    <span key="close" style={{ color: JSON_COLORS.punctuation }}>{"}"}</span>
  );

  return lines;
}

// ── token colorizer ───────────────────────────────────────────────────────────

function TokenDisplay({ token }: { token: string }) {
  if (!token.trim()) {
    return (
      <div className="token-input p-4 h-full flex items-center justify-center" style={{ minHeight: 160 }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono", fontSize: 13 }}>
          Paste your JWT here...
        </span>
      </div>
    );
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return (
      <div className="token-input p-4" style={{ minHeight: 160, wordBreak: "break-all" }}>
        <span style={{ color: "#ff2d78" }}>{token}</span>
      </div>
    );
  }

  const [h, p, s] = parts;

  return (
    <div
      className="token-input p-4"
      style={{ minHeight: 160, wordBreak: "break-all", whiteSpace: "pre-wrap" }}
    >
      <span style={{ color: "#ff2d78", textShadow: "0 0 8px rgba(255,45,120,0.5)" }}>{h}</span>
      <span style={{ color: "rgba(255,255,255,0.2)" }}>.</span>
      <span style={{ color: "#a855f7", textShadow: "0 0 8px rgba(168,85,247,0.5)" }}>{p}</span>
      <span style={{ color: "rgba(255,255,255,0.2)" }}>.</span>
      <span style={{ color: "#00e5ff", textShadow: "0 0 8px rgba(0,229,255,0.5)" }}>{s}</span>
    </div>
  );
}

// ── claims summary ────────────────────────────────────────────────────────────

const KNOWN_CLAIMS: Record<string, string> = {
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

function formatTimestamp(ts: unknown): string {
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

function isExpired(ts: unknown): boolean {
  if (typeof ts !== "number") return false;
  return Date.now() > ts * 1000;
}

function ClaimRow({
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
        {expired !== null && (
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-semibold tracking-wide ${
              expired ? "badge-expired" : "badge-valid"
            }`}
            style={{ fontFamily: "JetBrains Mono", fontSize: 10 }}
          >
            {expired ? "EXPIRED" : "VALID"}
          </span>
        )}
      </div>
    </div>
  );
}

// ── json viewer block ─────────────────────────────────────────────────────────

function JsonViewer({
  label,
  data,
  colorClass,
  accentColor,
}: {
  label: string;
  data: Record<string, unknown> | null;
  colorClass: string;
  accentColor: string;
}) {
  return (
    <div className={colorClass}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
          />
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 11,
              fontWeight: 600,
              color: accentColor,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              textShadow: `0 0 8px ${accentColor}80`,
            }}
          >
            {label}
          </span>
        </div>
        <div className="json-viewer">
          {data ? colorizeJson(data) : (
            <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────────────────────

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1NiIsImlzcyI6ImF1dGgubXlhcHAuaW8iLCJpYXQiOjE3MTQwMDAwMDAsImV4cCI6MTcxNDAwMzYwMCwibmFtZSI6IkFsZXggQ2hlbiIsInJvbGUiOiJhZG1pbiIsInRpZXIiOiJwcm8ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export function JwtDecoderScreen({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState("");
  const [tokenToDecode, setTokenToDecode] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  const handleLoadSample = useCallback(() => {
    setToken(SAMPLE_JWT);
    setTokenToDecode(SAMPLE_JWT);
  }, []);

  const handleClear = useCallback(() => {
    setToken("");
    setTokenToDecode("");
  }, []);

  let parsed: Parsed | null = null;
  let decodeError: string | null = null;

  if (tokenToDecode.trim()) {
    try {
      parsed = parseJwt(tokenToDecode);
    } catch (err: any) {
      decodeError = err.message || "Geçersiz format.";
    }
  }

  const allClaims = parsed
    ? { ...(parsed.header || {}), ...(parsed.payload || {}) }
    : {};
  const claimKeys = Object.keys(allClaims).filter((k) => KNOWN_CLAIMS[k]);

  return (
    <div
      className="grid-bg"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d0d 0%, #111118 50%, #0d0d0d 100%)",
        padding: "24px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1e1e1e] border border-[#2a2a2a] text-[#858585] hover:text-white hover:border-[#3e3e3e] hover:bg-[#252526] transition-all"
            title="Back to Dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(0,229,255,0.2))",
                border: "1px solid rgba(168,85,247,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                boxShadow: "0 0 16px rgba(168,85,247,0.2)",
              }}
            >
              🔑
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 18,
                  fontWeight: 700,
                  margin: 0,
                  color: "#fff",
                  letterSpacing: "0.04em",
                }}
              >
                JWT{" "}
                <span className="neon-text-purple">DECODER</span>
              </h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.06em" }}>
                JSON WEB TOKEN INSPECTOR
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSample}
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 11,
              padding: "6px 14px",
              borderRadius: 6,
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.3)",
              color: "#a855f7",
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.22)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(168,85,247,0.12)";
            }}
          >
            LOAD SAMPLE
          </button>
          {token && (
            <button
              onClick={handleClear}
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 11,
                padding: "6px 14px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                letterSpacing: "0.06em",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Main two-column layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: "20px",
          alignItems: "start",
        }}
        className="responsive-grid"
      >
        {/* ── LEFT: Input ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Segment legend */}
          <div className="glass-panel" style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", marginBottom: 10, fontFamily: "JetBrains Mono" }}>
              SEGMENT LEGEND
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: "HEADER", color: "#ff2d78", shadow: "rgba(255,45,120,0.6)" },
                { label: "PAYLOAD", color: "#a855f7", shadow: "rgba(168,85,247,0.6)" },
                { label: "SIGNATURE", color: "#00e5ff", shadow: "rgba(0,229,255,0.6)" },
              ].map(({ label, color, shadow }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 6px ${shadow}`,
                    }}
                  />
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color, letterSpacing: "0.08em" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Token input — standard textarea inside glass-panel */}
          <div
            className="glass-panel"
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              border: inputFocused
                ? "1px solid rgba(168,85,247,0.4)"
                : "1px solid rgba(255,255,255,0.08)",
              transition: "border-color 0.2s",
              boxShadow: inputFocused ? "0 0 0 3px rgba(168,85,247,0.08)" : "none",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840" }} />
              </div>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em" }}>
                jwt_input.txt
              </span>
            </div>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2..."
              className="token-input-area"
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <button 
            onClick={() => setTokenToDecode(token)}
            className="decode-btn"
          >
             DECODE TOKEN
          </button>

          {/* Status bar */}
          {tokenToDecode && (
            <div
              className="glass-panel"
              style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: parsed?.valid ? "#00ff88" : "#ff2d78",
                  boxShadow: parsed?.valid ? "0 0 6px #00ff88" : "0 0 6px #ff2d78",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>
                {parsed?.valid
                  ? `PARSED — ${tokenToDecode.trim().length} chars · 3 segments`
                  : `INVALID — ${decodeError}`}
              </span>
            </div>
          )}

          {/* Render the colored view ONLY below as a read-only viewer if it's parsed */}
          {tokenToDecode && parsed?.valid && (
            <div className="glass-panel" style={{ padding: 0 }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                  Token Segments
                </span>
              </div>
              <TokenDisplay token={tokenToDecode} />
            </div>
          )}
        </div>

        {/* ── RIGHT: Decoded panels ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Error Banner */}
          {decodeError && (
            <div className="error-banner p-3 mb-1 flex items-start gap-3">
              <span style={{ fontSize: 16 }}>❌</span>
              <div>
                <strong style={{ color: "#ff2d78", fontFamily: "JetBrains Mono", fontSize: 12 }}>DECODE ERROR</strong>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{decodeError}</p>
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {parsed?.valid && (
            <div className="warning-banner" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <div>
                <div style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.06em", marginBottom: 3 }}>
                  DECODED ≠ VERIFIED
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,166,0,0.75)", lineHeight: 1.5 }}>
                  This tool only decodes the Base64 content. It does <strong style={{ color: "rgba(255,166,0,0.95)" }}>not</strong> verify the cryptographic signature — any payload can be crafted to look valid.
                </div>
              </div>
            </div>
          )}

          {/* Header + Payload JSON */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <JsonViewer
              label="Header"
              data={parsed?.header || null}
              colorClass="glass-panel-pink"
              accentColor="#ff2d78"
            />
            <JsonViewer
              label="Payload"
              data={parsed?.payload || null}
              colorClass="glass-panel-purple"
              accentColor="#a855f7"
            />
          </div>

          {/* Signature */}
          {parsed?.valid && parsed.signature && (
            <div className="glass-panel-cyan" style={{ padding: "14px 16px" }}>
              <div className="flex items-center gap-2 mb-3">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e5ff", boxShadow: "0 0 6px #00e5ff" }} />
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600, color: "#00e5ff", textTransform: "uppercase", letterSpacing: "0.12em", textShadow: "0 0 8px #00e5ff80" }}>
                  Signature
                </span>
              </div>
              <div
                className="json-viewer"
                style={{
                  color: "#00e5ff",
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                  opacity: 0.8,
                  fontSize: 11,
                }}
              >
                {parsed.signature}
              </div>
            </div>
          )}

          {/* Claims Summary */}
          {parsed?.valid && claimKeys.length > 0 && (
            <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12 }}>📋</span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em" }}>
                  CLAIMS SUMMARY
                </span>
              </div>
              <div style={{ padding: "4px 16px 8px" }}>
                {claimKeys.map((k) => (
                  <ClaimRow key={k} claimKey={k} value={allClaims[k]} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!tokenToDecode && (
            <div
              className="glass-panel"
              style={{
                padding: "48px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, opacity: 0.4 }}>🔍</div>
              <p style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0, letterSpacing: "0.06em" }}>
                PASTE A JWT TOKEN TO DECODE
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", margin: 0 }}>
                Header, Payload, and Signature will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
