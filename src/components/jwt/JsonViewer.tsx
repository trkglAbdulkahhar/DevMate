import React from 'react';

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

export function JsonViewer({
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
