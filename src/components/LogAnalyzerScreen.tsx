import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { type LogLevel, type LogEntry, parseLogs } from '../utils/logParser'
import { LogCard } from './LogCard'
import { LevelToggle } from './LevelToggle'

const SAMPLE_LOG = `2024-01-15 09:23:41.112 ERROR [com.app.services.PaymentService] - Payment processing failed
java.lang.NullPointerException: Cannot invoke method charge() on null object reference
	at com.app.services.PaymentService.processPayment(PaymentService.java:142)
	Caused by: com.stripe.exception.InvalidRequestException: No such customer

2024-01-15 09:24:02.330 WARN [com.app.middleware.AuthFilter] - JWT token expiring soon for user session #88421
Token expiry: 2024-01-15T09:29:02Z — refresh recommended

2024-01-15 09:24:15.881 INFO [com.app.controllers.UserController] - User profile updated successfully
userId=usr_9182, fields=[email, avatar], requestId=req_abc123

2024-01-15 09:25:03.004 ERROR [com.app.db.ConnectionPool] - Database connection timeout after 30000ms
java.sql.SQLTimeoutException: Connection pool exhausted — all 20 connections in use
	at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)
	Caused by: java.net.SocketTimeoutException: Read timed out

2024-01-15 09:25:44.219 WARN [com.app.cache.RedisClient] - Cache miss rate exceeded threshold: 78.3% (threshold: 60%)
Affected keys: user:profile:*, session:data:*

2024-01-15 09:26:11.557 INFO [com.app.services.EmailService] - Queued 3 transactional emails for dispatch
batchId=batch_7734, recipients=3, template=order_confirmation

2024-01-15 09:27:09.888 ERROR [com.app.api.ExternalApiClient] - Third-party API request failed after 3 retries
java.net.ConnectException: Connection refused to https://api.payments.io/v2/charge
	Caused by: javax.net.ssl.SSLHandshakeException: PKIX path building failed`

export function LogAnalyzerScreen({ onBack }: { onBack: () => void }) {
  const [rawLog, setRawLog] = useState('')
  const [analyzed, setAnalyzed] = useState(false)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']))
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    if (!rawLog.trim()) return
    setIsAnalyzing(true)
    setTimeout(() => {
      const parsed = parseLogs(rawLog)
      setEntries(parsed)
      setAnalyzed(true)
      setIsAnalyzing(false)
      setActiveFilters(new Set(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']))
      setSourceFilter('All Sources')
    }, 600)
  }

  const handleLoadSample = () => {
    setRawLog(SAMPLE_LOG)
    setAnalyzed(false)
    setEntries([])
  }

  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0 }
    entries.forEach((e) => {
      if(counts[e.level] !== undefined) counts[e.level]++
    })
    return counts
  }, [entries])

  const detectedSources = useMemo(() => {
    const s = new Set(entries.map((e) => e.source))
    return ['All Sources', ...Array.from(s)]
  }, [entries])

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (!activeFilters.has(e.level)) return false
      if (sourceFilter !== 'All Sources' && e.source !== sourceFilter) return false
      return true
    })
  }, [entries, activeFilters, sourceFilter])

  const toggleFilter = (level: LogLevel) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(level)) {
        if (next.size > 1) next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }

  const LEVELS: LogLevel[] = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']

  return (
    <div className="min-h-screen bg-[#141414] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 py-3.5 border-b border-[#252526] flex items-center gap-3 bg-[#1e1e1e] sticky top-0 z-10">
        <button
          onClick={onBack}
          className="mr-2 p-1.5 hover:bg-white/5 rounded-md transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-7 h-7 rounded-md border border-[#4fc3f7]/30 flex items-center justify-center bg-gradient-to-br from-[#4fc3f7]/25 to-[#4fc3f7]/5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="#4fc3f7" />
            <rect x="1" y="5.5" width="8" height="1.5" rx="0.75" fill="#4fc3f7" opacity="0.7" />
            <rect x="1" y="9" width="10" height="1.5" rx="0.75" fill="#f87171" />
            <rect x="1" y="11.5" width="6" height="1.5" rx="0.75" fill="#f87171" opacity="0.6" />
          </svg>
        </div>
        <div>
          <span className="font-mono font-bold text-[13px] text-[#e2e2e2] tracking-[0.02em]">
            Log Analyzer
          </span>
          <span className="text-[11px] text-[#5a5a5a] ml-2">v1.0.0</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {analyzed && (
            <span className="text-[11px] text-[#858585] font-mono bg-[#252526] px-2.5 py-1 rounded border border-[#2a2a2a]">
              {entries.length} events parsed
            </span>
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-[#4fc3f7] shadow-[0_0_8px_rgba(79,195,247,0.7)]" />
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[960px] w-full mx-auto flex flex-col gap-4">
        {/* Top Section — Editor */}
        <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg overflow-hidden">
          {/* Editor titlebar */}
          <div className="px-3.5 py-2 border-b border-[#252526] flex items-center gap-2 bg-[#252526]">
            <div className="flex gap-[5px]">
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div key={c} className="w-2.5 h-2.5 rounded-full opacity-80" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="text-[11px] text-[#6a6a6a] font-mono ml-1.5">
              application.log
            </span>
            <button
              onClick={handleLoadSample}
              className="ml-auto text-[10px] text-[#4fc3f7] bg-[#4fc3f7]/10 border border-[#4fc3f7]/20 rounded px-2.5 py-1 cursor-pointer font-mono tracking-[0.04em] transition-all duration-150 hover:bg-[#4fc3f7]/20"
            >
              Load sample
            </button>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={rawLog}
              onChange={(e) => {
                setRawLog(e.target.value)
                setAnalyzed(false)
              }}
              placeholder={`Paste your application logs here...\n\n2024-01-15 09:23:41.112 ERROR [com.app.PaymentService] - Payment failed\njava.lang.NullPointerException: Cannot invoke method on null\n\t at com.app.PaymentService.processPayment(PaymentService.java:142)`}
              className="w-full h-[240px] bg-transparent border-none resize-y p-4 font-mono text-[12px] leading-[1.7] text-[#c8c8c8] caret-[#4fc3f7] outline-none"
              spellCheck={false}
            />
          </div>

          {/* Analyze button area */}
          <div className="px-4 py-3 border-t border-[#252526] flex items-center gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!rawLog.trim() || isAnalyzing}
              className={`px-6 py-2 rounded-md text-[12px] font-semibold font-mono tracking-[0.06em] transition-all duration-150 flex items-center gap-2 border
                ${rawLog.trim() && !isAnalyzing 
                  ? 'cursor-pointer border-[#4fc3f7]/40 text-[#4fc3f7] bg-gradient-to-br from-[#4fc3f7]/20 to-[#4fc3f7]/10 hover:shadow-[0_0_24px_rgba(79,195,247,0.3)] hover:border-[#4fc3f7]/70 shadow-[0_0_16px_rgba(79,195,247,0.15)]' 
                  : 'cursor-not-allowed border-[#4fc3f7]/40 bg-[#4fc3f7]/5 text-[#3a3a3a] shadow-none'}`}
            >
              {isAnalyzing ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                    <path d="M2 2L10 6L2 10V2Z" fill="currentColor" />
                  </svg>
                  Analyze Log
                </>
              )}
            </button>
            <span className="text-[11px] text-[#404040] font-mono">
              {rawLog.trim()
                ? `${rawLog.split('\n').filter((l) => l.trim()).length} lines · ${(new Blob([rawLog]).size / 1024).toFixed(1)} KB`
                : 'No log loaded'}
            </span>
          </div>
        </section>

        {/* Middle Section — Filter Bar */}
        {analyzed && (
          <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] text-[#5a5a5a] font-mono uppercase tracking-[0.1em] shrink-0">
              Filter
            </span>

            <div className="flex gap-1.5 flex-wrap flex-1">
              {LEVELS.map((level) => (
                <LevelToggle
                  key={level}
                  level={level}
                  active={activeFilters.has(level)}
                  count={levelCounts[level]}
                  onToggle={() => toggleFilter(level)}
                />
              ))}
            </div>

            <div className="h-5 w-[1px] bg-[#2a2a2a] shrink-0" />

            {/* Source dropdown */}
            <div className="relative shrink-0">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="appearance-none bg-[#252526] border border-[#3e3e3e] rounded-md py-1.5 pr-7 pl-3 text-[11px] font-mono text-[#858585] cursor-pointer transition-colors hover:border-[#5a5a5a] min-w-[180px] outline-none"
              >
                {detectedSources.map((s) => (
                  <option key={s} value={s} className="bg-[#252526]">
                    {s === 'All Sources' ? '— All Sources' : s.split('.').pop() ?? s}
                  </option>
                ))}
              </select>
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <path d="M1 1L5 5L9 1" stroke="#5a5a5a" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <span className="text-[11px] text-[#404040] font-mono ml-auto shrink-0">
              {filtered.length} / {entries.length} shown
            </span>
          </section>
        )}

        {/* Bottom Section — Results */}
        {analyzed && (
          <section className="flex flex-col gap-2">
            {filtered.length === 0 ? (
              <div className="py-12 px-6 text-center text-[#404040] font-mono text-[12px] bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
                No log entries match the current filters.
              </div>
            ) : (
              filtered.map((entry) => <LogCard key={entry.id} entry={entry} />)
            )}
          </section>
        )}

        {!analyzed && !isAnalyzing && (
          <div className="py-12 px-6 text-center text-[#404040] font-mono text-[12px] border border-dashed border-[#252526] rounded-lg">
            Paste log data above and click <span className="text-[#4fc3f7]">Analyze Log</span> to parse entries.
          </div>
        )}
      </main>
    </div>
  )
}
