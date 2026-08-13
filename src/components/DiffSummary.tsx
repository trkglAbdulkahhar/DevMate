
import { ShieldAlert } from 'lucide-react'
import { type DiffType } from '../utils/jsonDiff'

interface DiffSummaryProps {
  error: string | null
  stats: { added: number; removed: number; modified: number }
  activeFilter: DiffType | null
  aiAnalysis: any
  isAnalyzing?: boolean
  onAnalyzeRisks?: () => void
  onFilterClick: (type: DiffType) => void
}

export function DiffSummary({ error, stats, activeFilter, onFilterClick, isAnalyzing, onAnalyzeRisks, aiAnalysis }: DiffSummaryProps) {
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

          {/* Eğer henüz analiz yapılmadıysa açıklama ve butonu göster */}
          {!aiAnalysis ? (
            <>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Run an AI analysis to detect potential schema violations, backwards incompatibilities, or security risks in these changes.
              </p>
              <button
                onClick={onAnalyzeRisks}
                disabled={isAnalyzing || stats.added + stats.removed + stats.modified === 0}
                className={`w-full flex items-center justify-center gap-2 bg-[#4c1d95] hover:bg-[#5b21b6] text-white border border-[#7c3aed]/50 transition-colors py-2.5 rounded-md font-medium text-sm shadow-[0_0_15px_rgba(124,58,237,0.2)]
                  ${(isAnalyzing || stats.added + stats.removed + stats.modified === 0) ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}
                `}
              >
                <ShieldAlert className="w-4 h-4" />
                {isAnalyzing ? "Analiz ediliyor..." : "Analyze Risks with AI"}
              </button>
            </>
          ) : (
            /* Eğer analiz yapıldıysa o şık paneli BURANIN İÇİNE çiz */
            <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-border/50">

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#d7ba7d] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> AI Risk Analysis
                </h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded ${aiAnalysis.riskLevel === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                  {aiAnalysis.riskLevel} RİSK
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {aiAnalysis.summary}
              </p>

              {aiAnalysis.breakingChanges?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[10px] uppercase text-red-400 mb-1">Kırılmalar (Breaking)</h4>
                  <ul className="list-disc pl-3 text-xs text-red-400/80 space-y-1">
                    {aiAnalysis.breakingChanges.map((bc: string, i: number) => <li key={i}>{bc}</li>)}
                  </ul>
                </div>
              )}

              {aiAnalysis.recommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-[10px] uppercase text-emerald-400 mb-1">Öneriler</h4>
                  <ul className="list-disc pl-3 text-xs text-emerald-400/80 space-y-1">
                    {aiAnalysis.recommendations.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
