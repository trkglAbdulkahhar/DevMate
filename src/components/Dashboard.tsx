
import {
  Code2,
  FileJson,
  TerminalSquare,
  KeyRound,
  ChevronRight,
  User
} from 'lucide-react'

export function Dashboard({ onSelectCompare }: { onSelectCompare: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-semibold text-white text-lg tracking-tight">DevMate</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground overflow-hidden">
          <User className="w-5 h-5" />
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto p-8">
        <div className="mb-12">
          <h2 className="text-3xl font-medium text-white mb-3">Welcome back, Developer</h2>
          <p className="text-muted-foreground text-lg">Select a module to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Active Card: JSON Compare */}
          <button
            onClick={onSelectCompare}
            className="group relative flex flex-col text-left bg-[#2b271a] border border-[#d7ba7d]/30 rounded-2xl p-10 min-h-[300px] hover:border-[#d7ba7d] transition-all hover:shadow-[0_0_20px_rgba(215,186,125,0.1)] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#d7ba7d]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
            <div className="w-14 h-14 rounded-xl bg-[#3d331f] border border-[#d7ba7d]/40 flex items-center justify-center mb-8 z-10">
              <FileJson className="w-6 h-6 text-[#d7ba7d]" />
            </div>
            <h3 className="text-lg font-medium text-[#d7ba7d] mb-2 z-10 group-hover:text-[#e8c888] transition-colors">JSON Compare</h3>
            <p className="text-[#a89b7e] text-sm z-10">Deep diffing, schema validation, and visual comparison for complex JSON payloads.</p>
            <div className="mt-6 flex items-center text-[#d7ba7d] text-sm font-medium z-10 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
              Launch Workspace <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>

          {/* Disabled Card: Log Analyzer */}
          <div className="relative flex flex-col bg-[#1a2b21] border border-[#23d18b]/20 rounded-2xl p-10 min-h-[300px] opacity-60 cursor-not-allowed">
            <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-md text-xs font-bold text-muted-foreground tracking-wider uppercase">
              404 / Soon
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#1f3d2d] border border-[#23d18b]/30 flex items-center justify-center mb-8">
              <TerminalSquare className="w-6 h-6 text-[#23d18b]" />
            </div>
            <h3 className="text-lg font-medium text-[#23d18b] mb-2">AI Log Analyzer</h3>
            <p className="text-[#7ea892] text-sm">Ingest, parse, and identify anomalies in application logs using local AI models.</p>
          </div>

          {/* Disabled Card: JWT Decoder */}
          <div className="relative flex flex-col bg-[#1a252b] border border-[#007acc]/20 rounded-2xl p-10 min-h-[300px] opacity-60 cursor-not-allowed">
            <div className="absolute top-6 right-6 bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-md text-xs font-bold text-muted-foreground tracking-wider uppercase">
              404 / Soon
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#1f333d] border border-[#007acc]/30 flex items-center justify-center mb-8">
              <KeyRound className="w-6 h-6 text-[#007acc]" />
            </div>
            <h3 className="text-lg font-medium text-[#007acc] mb-2 flex items-center gap-2">
              JWT Decoder
            </h3>
            <p className="text-[#7e9ba8] text-sm font-mono text-xs break-all leading-relaxed mb-1 text-ellipsis overflow-hidden line-clamp-3">
              eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI...
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
