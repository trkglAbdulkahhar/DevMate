import React, { useState, useEffect, useMemo } from 'react'
import { compareJSON, countDiffs, getDiffPaths, getModifiedFields, type DiffNode, type DiffType } from '../utils/jsonDiff'
import {
  ArrowLeft,
  Trash2,
  FileCode2,
  Settings,
  Zap,
  ChevronUp,
  ChevronDown,
  XCircle,
  FileJson
} from 'lucide-react'
import { DiffViewer } from './compare_json/DiffViewer'
import { JsonEditor } from './compare_json/JsonEditor'
import { DiffSummary } from './compare_json/DiffSummary'

export function JsonCompareScreen({ onBack }: { onBack: () => void }) {
  const [origText, setOrigText] = useState('')
  const [modText, setModText] = useState('')
  const [diffNode, setDiffNode] = useState<DiffNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ added: 0, removed: 0, modified: 0 })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  const [activeFilter, setActiveFilter] = useState<DiffType | null>(null)
  const [activeDiffIndex, setActiveDiffIndex] = useState(0)

  const [isDraggingOrig, setIsDraggingOrig] = useState(false)
  const [isDraggingMod, setIsDraggingMod] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setter(ev.target?.result as string)
      reader.readAsText(file)
    }
    e.target.value = ''
  }

  const diffPaths = useMemo(() => {
    if (!diffNode || !activeFilter) return []
    return getDiffPaths(diffNode, activeFilter)
  }, [diffNode, activeFilter])

  const activeDiffId = activeFilter && diffPaths.length > 0
    ? `diff-${activeFilter}-${diffPaths[activeDiffIndex]}`
    : null

  useEffect(() => {
    if (activeDiffId) {
      const elements = document.querySelectorAll(`[data-diff-id="${activeDiffId}"]`)
      elements.forEach(el => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }, [activeDiffId])

  const handleFilterClick = (type: DiffType) => {
    if (activeFilter === type) {
      setActiveFilter(null)
    } else {
      setActiveFilter(type)
      setActiveDiffIndex(0)
    }
  }

  const handleNextDiff = () => {
    if (diffPaths.length > 0) {
      setActiveDiffIndex((prev) => (prev + 1) % diffPaths.length)
    }
  }

  const handlePrevDiff = () => {
    if (diffPaths.length > 0) {
      setActiveDiffIndex((prev) => (prev - 1 + diffPaths.length) % diffPaths.length)
    }
  }

  const handleClear = () => {
    setOrigText('')
    setModText('')
    setDiffNode(null)
    setError(null)
    setStats({ added: 0, removed: 0, modified: 0 })
    setActiveFilter(null)
    setActiveDiffIndex(0)
    setAiAnalysis(null)
  }

  const handleSampleData = () => {
    setOrigText(JSON.stringify({
      id: "usr_99x",
      status: "active",
      role: "engineer",
      preferences: { theme: "dark" }
    }, null, 2))
    setModText(JSON.stringify({
      id: "usr_99x",
      role: "lead_engineer",
      preferences: { theme: "dark", notifications: true }
    }, null, 2))
    setDiffNode(null)
    setError(null)
    setActiveFilter(null)
  }

  const handleFormat = () => {
    try {
      if (origText) setOrigText(JSON.stringify(JSON.parse(origText), null, 2))
      if (modText) setModText(JSON.stringify(JSON.parse(modText), null, 2))
      setError(null)
    } catch (err: any) {
      setError(`Format error: ${err.message}`)
    }
  }

  const handleCompare = () => {
    if (!origText || !modText) {
      setError('Both Original and Modified JSON are required.')
      return
    }
    try {
      const oldObj = JSON.parse(origText)
      const newObj = JSON.parse(modText)
      const diff = compareJSON(oldObj, newObj)
      setAiAnalysis(null)
      setDiffNode(diff)
      setStats(countDiffs(diff))
      setError(null)
      setActiveFilter(null)
      setActiveDiffIndex(0)
    } catch (err: any) {
      setError(`Invalid JSON: ${err.message}`)
      setDiffNode(null)
    }
  }

  const handleAnalyzeRisks = async () => {
    if (!diffNode) return;
    setIsAnalyzing(true);
    setError(null);
    setAiAnalysis(null);

    try {
      // const requestPayload = {
      //   differences: {
      //     added: getDiffPaths(diffNode, 'added'),
      //     removed: getDiffPaths(diffNode, 'removed'),
      //     modified: getDiffPaths(diffNode, 'modified').map(path => ({
      //       path, oldValue: "eski", newValue: "yeni"
      //     }))
      //   }
      // };
      const requestPayload = {
        differences: {
          added: getDiffPaths(diffNode, 'added'),
          removed: getDiffPaths(diffNode, 'removed'),
          modified: getModifiedFields(diffNode)
        }
      }
      const res = await fetch("http://localhost:5242/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      if (!res.ok) {
        if (res.status === 429) throw new Error("Çok fazla istek attınız (Rate Limit). Lütfen biraz bekleyin.");
        if (res.status === 413) throw new Error("Gönderdiğiniz veri çok büyük (Maks 5MB).");
        if (res.status === 401) throw new Error("Sunucuda API kimlik doğrulama hatası (Unauthorized).");
        if (res.status === 504) throw new Error("AI servisi zaman aşımına uğradı (Timeout). Lütfen tekrar deneyin.");
        if (res.status === 502) throw new Error("AI servisinden geçersiz yanıt alındı (Bad Gateway).");
        if (res.status === 500) throw new Error("Sunucu hatası oluştu (Internal Server Error).");
        
        let errorMessage = "API'den hata döndü!";
        try {
          const errorData = await res.json();
          if (errorData?.detail) errorMessage = errorData.detail;
        } catch {
          // Eğer dönen yanıt JSON değilse (örneğin sadece raw status code dönmüşse) yutuyoruz.
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setAiAnalysis(data);
    } catch (err: any) {
      console.error("Ai baglanti hatasi:", err)
      setError(err.message || "Yapay zeka analizi sırasında bir hata oluştu.");
    }
    setIsAnalyzing(false);
  };

  const handleDrop = (e: React.DragEvent, setter: (val: string) => void, setDragging: (val: boolean) => void) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/json' || file.name.endsWith('.json') || file.name.endsWith('.txt'))) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setter(ev.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleDragOver = (e: React.DragEvent, setDragging: (val: boolean) => void) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent, setDragging: (val: boolean) => void) => {
    e.preventDefault()
    setDragging(false)
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-[#d7ba7d]">
            <FileJson className="w-4 h-4" />
            <span className="text-sm font-medium">Workspace / JSON Compare</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleClear} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <button onClick={handleSampleData} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <FileCode2 className="w-4 h-4" /> Sample Data
          </button>
          <button onClick={handleFormat} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Settings className="w-4 h-4" /> Format
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <JsonEditor
          title="Original JSON"
          value={origText}
          onChange={setOrigText}
          isDragging={isDraggingOrig}
          onDragOver={(e) => handleDragOver(e, setIsDraggingOrig)}
          onDragLeave={(e) => handleDragLeave(e, setIsDraggingOrig)}
          onDrop={(e) => handleDrop(e, setOrigText, setIsDraggingOrig)}
          onFileUpload={(e) => handleFileUpload(e, setOrigText)}
        >
          {diffNode && <DiffViewer node={diffNode} side="orig" activeDiffId={activeDiffId} />}
        </JsonEditor>

        <JsonEditor
          title="Modified JSON"
          value={modText}
          onChange={setModText}
          isDragging={isDraggingMod}
          onDragOver={(e) => handleDragOver(e, setIsDraggingMod)}
          onDragLeave={(e) => handleDragLeave(e, setIsDraggingMod)}
          onDrop={(e) => handleDrop(e, setModText, setIsDraggingMod)}
          onFileUpload={(e) => handleFileUpload(e, setModText)}
        >
          {diffNode && <DiffViewer node={diffNode} side="mod" activeDiffId={activeDiffId} />}
        </JsonEditor>

        <DiffSummary
          error={error}
          stats={stats}
          activeFilter={activeFilter}
          onFilterClick={handleFilterClick}
          isAnalyzing={isAnalyzing}
          onAnalyzeRisks={handleAnalyzeRisks}
          aiAnalysis={aiAnalysis}
        />

        {/* Central Compare Trigger */}
        <div className="absolute bottom-8 left-0 right-80 flex justify-center pointer-events-none">
          <button
            onClick={handleCompare}
            className="pointer-events-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95 border border-primary-foreground/10 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 fill-current" /> COMPARE JSON
          </button>

        </div>




        {/* Floating Navigation Bar */}
        {activeFilter && (
          <div className="fixed bottom-24 left-[calc(50%-10rem)] -translate-x-1/2 z-50 bg-card border border-primary/50 shadow-[0_0_30px_rgba(0,122,204,0.3)] rounded-full px-6 py-3 flex items-center gap-6 pointer-events-auto">
            <span className="text-sm font-medium text-foreground uppercase tracking-wider flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeFilter === 'added' ? 'bg-diff-add-text' : activeFilter === 'removed' ? 'bg-diff-del-text' : 'bg-diff-mod-text'}`} />
              {activeFilter}
            </span>
            <div className="h-6 w-[1px] bg-border" />
            <span className="text-sm font-semibold text-foreground min-w-[3rem] text-center">
              {diffPaths.length > 0 ? `${activeDiffIndex + 1} / ${diffPaths.length}` : '0 / 0'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={handlePrevDiff} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronUp className="w-5 h-5" />
              </button>
              <button onClick={handleNextDiff} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="h-6 w-[1px] bg-border" />
            <button onClick={() => setActiveFilter(null)} className="text-sm flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <XCircle className="w-4 h-4" /> Clear
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
