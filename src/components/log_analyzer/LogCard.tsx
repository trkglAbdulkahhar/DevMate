import { useState } from 'react'
import { type LogEntry } from '../../utils/logParser'
import { LEVEL_CONFIG } from './logLevelConfig'
import { Badge } from './Badge'

export function LogCard({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const cfg = LEVEL_CONFIG[entry.level]

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-[#1e1e1e] rounded-md px-4 py-3.5 cursor-pointer transition-all duration-150"
      style={{
        border: `1px solid ${(expanded || hovered) ? cfg.border : '#2a2a2a'}`,
        borderLeft: `3px solid ${cfg.color}`,
        boxShadow: expanded ? `0 0 0 1px ${cfg.ring}, 0 4px 20px rgba(0,0,0,0.4)` : hovered ? `0 4px 16px rgba(0,0,0,0.4)` : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <Badge level={entry.level} />
        <span className="text-[11px] text-[#5a5a5a] font-mono leading-5 shrink-0">
          {entry.timestamp}
        </span>
        <span className="text-[11px] text-[#4fc3f7] font-mono leading-5 ml-auto opacity-80">
          {entry.source.split('.').pop()}
        </span>
      </div>

      <div className="mt-2.5">
        <div className="text-[13px] font-semibold text-[#e2e2e2] font-mono mb-1">
          {entry.exceptionType}
        </div>
        <div className={`text-[12px] text-[#858585] font-sans leading-relaxed overflow-hidden ${expanded ? '' : 'line-clamp-2'}`}>
          {entry.rootCause}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 px-3 py-2.5 bg-[#141414] rounded border border-[#2a2a2a]">
          <div className="text-[10px] text-[#5a5a5a] mb-1.5 uppercase tracking-[0.08em]">
            Full Source Path
          </div>
          <code className="text-[11px] text-[#4fc3f7] font-mono break-all mb-3 block">
            {entry.source}
          </code>

          {entry.fullStackTrace && entry.fullStackTrace.length > 0 && (
            <>
              <div className="text-[10px] text-[#5a5a5a] mb-1.5 mt-3 uppercase tracking-[0.08em]">
                Stack Trace Context
              </div>
              <div className="bg-[#0a0a0a] rounded border border-[#1e1e1e] p-2.5 max-h-[250px] overflow-y-auto">
                <code className="text-[11px] text-[#c8c8c8] font-mono whitespace-pre block">
                  {entry.fullStackTrace.join('\n')}
                </code>
              </div>
            </>
          )}

          {entry.isTruncated && (
            <div className="mt-2.5 bg-orange-500/10 border border-orange-500/30 rounded px-2.5 py-1.5 flex items-start gap-2">
              <span className="text-orange-400 mt-0.5">⚠️</span>
              <p className="text-[11px] text-orange-200/80 leading-relaxed font-sans">
                <strong>Warning:</strong> This stack trace was truncated at 200 lines for performance reasons. The deepest root cause may not be visible.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-[10px] text-[#404040] text-right">
        {expanded ? '↑ collapse' : '↓ expand'}
      </div>
    </div>
  )
}
