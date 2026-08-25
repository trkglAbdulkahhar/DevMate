import { type LogLevel } from '../../utils/logParser'
import { LEVEL_CONFIG } from './logLevelConfig'

export function Badge({ level }: { level: LogLevel }) {
  const cfg = LEVEL_CONFIG[level]
  return (
    <span
      className="inline-flex items-center gap-[5px] px-[10px] py-[2px] rounded-full text-[10px] font-bold tracking-[0.1em] font-mono border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full shrink-0"
        style={{ backgroundColor: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
      />
      {level}
    </span>
  )
}
