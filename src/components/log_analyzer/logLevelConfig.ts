import { type LogLevel } from '../../utils/logParser'

export const LEVEL_CONFIG: Record<LogLevel, { color: string; bg: string; border: string; ring: string; dot: string }> = {
  ERROR: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.1)',
    border: 'rgba(248,113,113,0.22)',
    ring: 'rgba(248,113,113,0.35)',
    dot: '#f87171',
  },
  WARN: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
    border: 'rgba(251,191,36,0.22)',
    ring: 'rgba(251,191,36,0.35)',
    dot: '#fbbf24',
  },
  INFO: {
    color: '#4fc3f7',
    bg: 'rgba(79,195,247,0.1)',
    border: 'rgba(79,195,247,0.22)',
    ring: 'rgba(79,195,247,0.35)',
    dot: '#4fc3f7',
  },
  DEBUG: {
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.22)',
    ring: 'rgba(167,139,250,0.35)',
    dot: '#a78bfa',
  },
  TRACE: {
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.1)',
    border: 'rgba(148,163,184,0.22)',
    ring: 'rgba(148,163,184,0.35)',
    dot: '#94a3b8',
  },
}
