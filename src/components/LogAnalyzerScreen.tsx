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

interface AiAnalysisResult {
  overallSummary: string;
  keyIssues: {
    title: string;
    rootCause: string;
    solution: string;
  }[];
}

export function LogAnalyzerScreen({ onBack }: { onBack: () => void }) {
  const [rawLog, setRawLog] = useState('')
  const [analyzed, setAnalyzed] = useState(false)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [activeFilters, setActiveFilters] = useState<Set<LogLevel>>(new Set(['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']))
  const [sourceFilter, setSourceFilter] = useState('All Sources')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // AI States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null)
  const [selectedAiLevels, setSelectedAiLevels] = useState<Set<LogLevel>>(new Set(['ERROR', 'WARN']))

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
      
      // Reset AI panel on new parse
      setAiResult(null)
      setIsAiAnalyzing(false)
      setSelectedAiLevels(new Set(['ERROR', 'WARN']))
    }, 600)
  }

  const handleClear = () => {
    setRawLog('')
    setAnalyzed(false)
    setEntries([])
    setAiResult(null)
    setIsAnalyzing(false)
    setIsAiAnalyzing(false)
  }

  const handleLoadSample = () => {
    setRawLog(SAMPLE_LOG)
    setAnalyzed(false)
    setEntries([])
    setAiResult(null)
  }

  const levelCounts = useMemo(() => {
    const counts: Record<LogLevel, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0 }
    entries.forEach((e) => {
      if (counts[e.level] !== undefined) counts[e.level]++
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

  const toggleAiLevel = (lvl: LogLevel) => {
    setSelectedAiLevels(prev => {
      const next = new Set(prev)
      if (next.has(lvl)) next.delete(lvl)
      else next.add(lvl)
      return next
    })
  }

  const handleAiAnalyze = async () => {
    if (selectedAiLevels.size === 0) {
      alert("Please select at least one log level to analyze.");
      return;
    }
    
    const logsToSend = entries.filter(e => selectedAiLevels.has(e.level));
    if (logsToSend.length === 0) {
      alert("No logs found for the selected levels.");
      return;
    }

    setIsAiAnalyzing(true);
    setAiResult(null);

    try {
      // Backend URL (C# API'ye gidecek)
      const response = await fetch('http://localhost:5242/api/logs/analyze-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend })
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze logs with AI. Check the browser console and the C# backend terminal (port 5242) for errors. (Model name or API Key might be invalid)");
    } finally {
      setIsAiAnalyzing(false);
    }
  }

  const LEVELS: LogLevel[] = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']

  return (
    <div className="min-h-screen bg-[#141414] font-sans flex flex-col">
      {/* Header */}
      <header className="px-6 py-3.5 border-b border-[#252526] flex items-center gap-3 bg-[#1e1e1e] sticky top-0 z-20">
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

      <main className="flex-1 p-6 max-w-[1800px] w-full mx-auto flex gap-6 items-start">
        
        {/* SOL TARAF (%70) - Ham Loglar ve Filtreler */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Top Section — Editor */}
          <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg overflow-hidden shrink-0">
            <div className="px-3.5 py-2 border-b border-[#252526] flex items-center gap-2 bg-[#252526]">
              <div className="flex gap-[5px]">
                {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full opacity-80" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[11px] text-[#6a6a6a] font-mono ml-1.5">
                application.log
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="text-[10px] text-[#f87171] bg-[#f87171]/10 border border-[#f87171]/20 rounded px-2.5 py-1 cursor-pointer font-mono tracking-[0.04em] transition-all duration-150 hover:bg-[#f87171]/20"
                >
                  Clear
                </button>
                <button
                  onClick={handleLoadSample}
                  className="text-[10px] text-[#4fc3f7] bg-[#4fc3f7]/10 border border-[#4fc3f7]/20 rounded px-2.5 py-1 cursor-pointer font-mono tracking-[0.04em] transition-all duration-150 hover:bg-[#4fc3f7]/20"
                >
                  Load sample
                </button>
              </div>
            </div>

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
            <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 flex items-center gap-2.5 flex-wrap shrink-0">
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
            <div className="py-12 px-6 text-center text-[#404040] font-mono text-[12px] border border-dashed border-[#252526] rounded-lg shrink-0">
              Paste log data above and click <span className="text-[#4fc3f7]">Analyze Log</span> to parse entries.
            </div>
          )}
        </div>

        {/* SAĞ TARAF (%30) - AI Paneli */}
        {analyzed && (
          <aside className="w-[30%] shrink-0 sticky top-[80px] bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg flex flex-col overflow-hidden max-h-[calc(100vh-100px)]">
            {/* AI Panel Header */}
            <div className="flex items-center gap-2 border-b border-[#2a2a2a] p-4 bg-[#252526] shrink-0">
              <span className="text-[18px]">🤖</span>
              <h3 className="text-[#e2e2e2] text-[14px] font-semibold font-mono tracking-[0.04em]">
                AI Insights
              </h3>
              {aiResult && (
                <button 
                  onClick={() => setAiResult(null)} 
                  className="ml-auto text-[10px] text-[#858585] hover:text-white transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* AI Panel Content */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
              {isAiAnalyzing ? (
                /* Loading State */
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  <span className="text-[#a78bfa] text-[12px] font-mono animate-pulse">
                    Analyzing logs with Groq AI...
                  </span>
                </div>
              ) : aiResult ? (
                /* Results State */
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h4 className="text-[10px] text-[#5a5a5a] uppercase tracking-[0.1em] mb-2 font-mono">
                      Overall Summary
                    </h4>
                    <p className="text-[13px] text-[#e2e2e2] leading-relaxed font-sans">
                      {aiResult.overallSummary}
                    </p>
                  </div>
                  
                  <div className="h-[1px] w-full bg-[#2a2a2a]" />
                  
                  <div>
                    <h4 className="text-[10px] text-[#5a5a5a] uppercase tracking-[0.1em] mb-3 font-mono">
                      Key Issues Found
                    </h4>
                    <div className="flex flex-col gap-4">
                      {aiResult.keyIssues.map((issue, idx) => (
                        <div key={idx} className="bg-[#141414] border border-[#2a2a2a] rounded p-3 relative overflow-hidden group hover:border-[#a78bfa]/30 transition-colors">
                          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-purple-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <h5 className="text-[12px] font-bold text-purple-300 mb-1.5 leading-snug">
                            {issue.title}
                          </h5>
                          <div className="mb-2.5">
                            <span className="text-[10px] text-[#858585] font-mono block mb-0.5">ROOT CAUSE</span>
                            <p className="text-[12px] text-[#c8c8c8] leading-relaxed">
                              {issue.rootCause}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#858585] font-mono block mb-0.5">SOLUTION</span>
                            <p className="text-[12px] text-[#a78bfa]/90 leading-relaxed">
                              {issue.solution}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Selection / Idle State */
                <>
                  <p className="text-[#858585] text-[12px] leading-relaxed">
                    Select the log levels you want to analyze. The AI will examine the stack traces and find the root cause across the entire batch.
                  </p>

                  <div className="flex flex-col gap-2 bg-[#141414] border border-[#2a2a2a] rounded-md p-3">
                    <span className="text-[10px] text-[#5a5a5a] font-mono uppercase tracking-[0.1em] mb-1">
                      Target Levels
                    </span>
                    {LEVELS.map(lvl => (
                      <label key={lvl} className="flex items-center gap-2.5 cursor-pointer group w-fit">
                        <div className="relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            checked={selectedAiLevels.has(lvl)}
                            onChange={() => toggleAiLevel(lvl)}
                            className="w-3.5 h-3.5 rounded-sm border-[#3e3e3e] bg-[#1e1e1e] appearance-none cursor-pointer peer checked:bg-purple-500 checked:border-purple-500 transition-colors"
                          />
                          <svg className="absolute w-2 h-2 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7L6 10L11 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className={`text-[12px] font-mono transition-colors ${selectedAiLevels.has(lvl) ? 'text-[#e2e2e2]' : 'text-[#858585] group-hover:text-[#a0a0a0]'}`}>
                          {lvl}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleAiAnalyze}
                    className="mt-2 w-full py-2.5 rounded-md text-[12px] font-bold font-mono tracking-[0.06em] transition-all duration-200 
                      bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30
                      hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  >
                    Analyze Selected Logs
                  </button>
                </>
              )}
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}
