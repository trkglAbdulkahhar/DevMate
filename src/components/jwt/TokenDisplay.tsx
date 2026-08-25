

export function TokenDisplay({ token }: { token: string }) {
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
