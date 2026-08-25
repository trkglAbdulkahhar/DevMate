import { useState } from 'react'
import { type LogLevel } from '../../utils/logParser'
import { LEVEL_CONFIG } from './logLevelConfig'

export function LevelToggle({ level, active, count, onToggle }: { level: LogLevel, active: boolean, count: number, onToggle: () => void }) {
  const cfg = LEVEL_CONFIG[level]
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-[7px] px-3.5 py-1 rounded-full text-[11px] font-bold tracking-[0.08em] font-mono transition-all duration-150 border"
      style={{
        borderColor: (active || hovered) ? cfg.color : '#3e3e3e',
        backgroundColor: active ? cfg.bg : 'transparent',
        color: (active || hovered) ? cfg.color : '#5a5a5a',
        boxShadow: active ? `0 0 8px ${cfg.ring}` : 'none',
      }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full shrink-0 transition-all duration-150"
        style={{
          backgroundColor: active ? cfg.dot : '#3e3e3e',
          boxShadow: active ? `0 0 5px ${cfg.dot}` : 'none',
        }}
      />
      {level}
      <span
        className="text-[10px] px-1.5 rounded-full font-semibold leading-4"
        style={{
          backgroundColor: active ? cfg.border : '#2a2a2a',
          color: active ? cfg.color : '#5a5a5a',
        }}
      >
        {count}
      </span>
    </button>
  )
}
