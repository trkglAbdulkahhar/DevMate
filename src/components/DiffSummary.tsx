
import { ShieldAlert } from 'lucide-react'
import { type DiffType } from '../utils/jsonDiff'

interface DiffSummaryProps {
  error: string | null
  stats: { added: number; removed: number; modified: number }
  activeFilter: DiffType | null
  onFilterClick: (type: DiffType) => void
}

export function DiffSummary({ error, stats, activeFilter, onFilterClick }: DiffSummaryProps) {
  return (
    <div className="w-80 bg-card flex flex-col shrink-0">
      <div className="h-10 border-b border-border flex items-center px-4 shrink-0">
        <span className="text-xs font-medium text-foreground uppercase tracking-wider">Comparison Summary</span>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        {error && (
          <div className="bg-[#f14c4c]/10 border border-[#f14c4c]/30 text-[#f14c4c] p-3 rounded text-sm font-medium">
            {error}
          </div>
        )}
      
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => onFilterClick('removed')}
            className={`flex items-center justify-between p-2.5 rounded border transition-all ${activeFilter === 'removed' ? 'border-diff-del-text bg-diff-del-bg/50 ring-1 ring-diff-del-text' : 'border-diff-del-text/20 hover:border-diff-del-text/50'}`}
          >
            <span className="text-sm font-medium text-foreground">Deletions</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-diff-del-text bg-diff-del-text/10 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-diff-del-text" /> {stats.removed} Field{stats.removed !== 1 ? 's' : ''} Deleted
            </span>
          </button>

          <button 
            onClick={() => onFilterClick('added')}
            className={`flex items-center justify-between p-2.5 rounded border transition-all ${activeFilter === 'added' ? 'border-diff-add-text bg-diff-add-bg/50 ring-1 ring-diff-add-text' : 'border-diff-add-text/20 hover:border-diff-add-text/50'}`}
          >
            <span className="text-sm font-medium text-foreground">Additions</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-diff-add-text bg-diff-add-text/10 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-diff-add-text" /> {stats.added} Field{stats.added !== 1 ? 's' : ''} Added
            </span>
          </button>

          <button 
            onClick={() => onFilterClick('modified')}
            className={`flex items-center justify-between p-2.5 rounded border transition-all ${activeFilter === 'modified' ? 'border-diff-mod-text bg-diff-mod-bg/50 ring-1 ring-diff-mod-text' : 'border-diff-mod-text/20 hover:border-diff-mod-text/50'}`}
          >
            <span className="text-sm font-medium text-foreground">Modifications</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-diff-mod-text bg-diff-mod-text/10 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-diff-mod-text" /> {stats.modified} Value{stats.modified !== 1 ? 's' : ''} Modified
            </span>
          </button>
        </div>

        <div className="mt-auto border-t border-border pt-6">
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Run an AI analysis to detect potential schema violations, backwards incompatibilities, or security risks in these changes.
          </p>
          <button className="w-full flex items-center justify-center gap-2 bg-[#4c1d95] hover:bg-[#5b21b6] text-white border border-[#7c3aed]/50 transition-colors py-2.5 rounded-md font-medium text-sm shadow-[0_0_15px_rgba(124,58,237,0.2)] opacity-50 cursor-not-allowed">
            <ShieldAlert className="w-4 h-4" /> Analyze Risks with AI (Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
