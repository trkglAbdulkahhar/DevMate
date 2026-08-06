import React, { useState, useEffect, useMemo } from 'react'
import { compareJSON, countDiffs, getDiffPaths, type DiffNode, type DiffType } from './utils/jsonDiff'
import {
  Code2,
  FileJson,
  TerminalSquare,
  KeyRound,
  ArrowLeft,
  Settings,
  Trash2,
  FileCode2,
  UploadCloud,
  ChevronRight,
  ShieldAlert,
  Zap,
  ChevronUp,
  ChevronDown,
  XCircle
} from 'lucide-react'

type Screen = 'dashboard' | 'compare'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard')

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {currentScreen === 'dashboard' && (
        <DashboardScreen onSelectCompare={() => setCurrentScreen('compare')} />
      )}
      {currentScreen === 'compare' && (
        <JsonCompareScreen onBack={() => setCurrentScreen('dashboard')} />
      )}
    </div>
  )
}


function DashboardScreen({ onSelectCompare }: { onSelectCompare: () => void }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-primary" />
          <span className="font-semibold text-white text-lg tracking-tight">DevMate</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
          <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=64&h=64&fit=crop" alt="User Profile" className="w-full h-full object-cover" />
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

function JsonViewer({ node, side, indent = 0, name = '', path = 'root', activeDiffId = null }: { node: DiffNode, side: 'orig' | 'mod', indent?: number, name?: string, path?: string, activeDiffId?: string | null }) {
  const pad = '  '.repeat(indent)
  const isOrig = side === 'orig'
  const currentPath = name ? `${path}.${name}` : path
  
  if (node.type === 'added' && isOrig) return null
  if (node.type === 'removed' && !isOrig) return null

  let bgClass = ''
  let textClass = 'text-foreground'
  let strikethrough = false

  const diffId = `diff-${node.type}-${currentPath}`
  const isActive = activeDiffId === diffId

  if (node.type === 'added') {
    bgClass = 'bg-diff-add-bg relative border-l-2 border-diff-add-text'
    textClass = 'text-diff-add-text'
  } else if (node.type === 'removed') {
    bgClass = 'bg-diff-del-bg relative border-l-2 border-diff-del-text'
    textClass = 'text-diff-del-text'
    strikethrough = true
  } else if (node.type === 'modified' && !node.children) {
    bgClass = 'bg-diff-mod-bg relative border-l-2 border-diff-mod-text'
    textClass = 'text-diff-mod-text'
  }

  const activeClasses = isActive ? ' ring-2 ring-primary ring-inset bg-primary/20 z-10 rounded shadow-md ' : ''
  const wrapperClass = `pl-2 -ml-2 my-0.5 ${bgClass} ${activeClasses}`
  const propName = name ? `"${name}": ` : ''

  if (node.children) {
    const childEntries = Object.entries(node.children)
    return (
      <div className={wrapperClass} data-diff-id={diffId}>
        <span className="text-foreground whitespace-pre">{pad}{propName}{`{`}</span>
        <div>
          {childEntries.map(([childName, childNode]) => (
            <JsonViewer key={childName} name={childName} node={childNode} side={side} indent={indent + 1} path={currentPath} activeDiffId={activeDiffId} />
          ))}
        </div>
        <span className="text-foreground whitespace-pre">{pad}{`}`}</span>
      </div>
    )
  }

  const val = isOrig ? (node.oldValue !== undefined ? node.oldValue : node.value) : (node.newValue !== undefined ? node.newValue : node.value)
  const formattedVal = typeof val === 'string' ? `"${val}"` : String(val)

  return (
    <div className={wrapperClass} data-diff-id={diffId}>
      <span className={textClass}>
        <span className="whitespace-pre text-muted-foreground">{pad}</span>
        {propName}
        <span className={strikethrough ? 'line-through opacity-70' : ''}>
          {formattedVal}
        </span>
        {','}
      </span>
    </div>
  )
}

function JsonCompareScreen({ onBack }: { onBack: () => void }) {
  const [origText, setOrigText] = useState('')
  const [modText, setModText] = useState('')
  const [diffNode, setDiffNode] = useState<DiffNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({ added: 0, removed: 0, modified: 0 })

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
        {/* Left Column: Original */}
        <div className="flex-1 flex flex-col border-r border-border bg-background">
          <div className="h-10 bg-secondary/50 border-b border-border flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Original JSON</span>
            <label className="text-xs flex items-center gap-1.5 text-foreground bg-secondary hover:bg-secondary/80 border border-border px-2 py-1 rounded cursor-pointer transition-colors">
              <UploadCloud className="w-3.5 h-3.5" /> Upload File
              <input type="file" accept=".json,.txt" className="hidden" onChange={(e) => handleFileUpload(e, setOrigText)} />
            </label>
          </div>
          <div 
            className={`flex-1 flex overflow-hidden relative p-4 transition-colors ${isDraggingOrig ? 'border-2 border-dashed border-primary bg-primary/10' : ''}`}
            onDragOver={(e) => handleDragOver(e, setIsDraggingOrig)}
            onDragLeave={(e) => handleDragLeave(e, setIsDraggingOrig)}
            onDrop={(e) => handleDrop(e, setOrigText, setIsDraggingOrig)}
          >
            {diffNode ? (
              <div className="flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
                <JsonViewer node={diffNode} side="orig" activeDiffId={activeDiffId} />
              </div>
            ) : (
              <textarea 
                value={origText}
                onChange={(e) => setOrigText(e.target.value)}
                placeholder="Paste original JSON here or drag and drop a file..."
                className="flex-1 w-full h-full bg-transparent border-none outline-none font-mono text-[13px] text-foreground resize-none"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Middle Column: Modified */}
        <div className="flex-1 flex flex-col border-r border-border bg-background">
          <div className="h-10 bg-secondary/50 border-b border-border flex items-center justify-between px-4 shrink-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modified JSON</span>
            <label className="text-xs flex items-center gap-1.5 text-foreground bg-secondary hover:bg-secondary/80 border border-border px-2 py-1 rounded cursor-pointer transition-colors">
              <UploadCloud className="w-3.5 h-3.5" /> Upload File
              <input type="file" accept=".json,.txt" className="hidden" onChange={(e) => handleFileUpload(e, setModText)} />
            </label>
          </div>
          <div 
            className={`flex-1 flex overflow-hidden relative p-4 transition-colors ${isDraggingMod ? 'border-2 border-dashed border-primary bg-primary/10' : ''}`}
            onDragOver={(e) => handleDragOver(e, setIsDraggingMod)}
            onDragLeave={(e) => handleDragLeave(e, setIsDraggingMod)}
            onDrop={(e) => handleDrop(e, setModText, setIsDraggingMod)}
          >
            {diffNode ? (
              <div className="flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
                <JsonViewer node={diffNode} side="mod" activeDiffId={activeDiffId} />
              </div>
            ) : (
              <textarea 
                value={modText}
                onChange={(e) => setModText(e.target.value)}
                placeholder="Paste modified JSON here or drag and drop a file..."
                className="flex-1 w-full h-full bg-transparent border-none outline-none font-mono text-[13px] text-foreground resize-none"
                spellCheck={false}
              />
            )}
          </div>
        </div>

        {/* Right Column: Summary Panel */}
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
                onClick={() => handleFilterClick('removed')}
                className={`flex items-center justify-between p-2.5 rounded border transition-all ${activeFilter === 'removed' ? 'border-diff-del-text bg-diff-del-bg/50 ring-1 ring-diff-del-text' : 'border-diff-del-text/20 hover:border-diff-del-text/50'}`}
              >
                <span className="text-sm font-medium text-foreground">Deletions</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-diff-del-text bg-diff-del-text/10 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-diff-del-text" /> {stats.removed} Field{stats.removed !== 1 ? 's' : ''} Deleted
                </span>
              </button>

              <button 
                onClick={() => handleFilterClick('added')}
                className={`flex items-center justify-between p-2.5 rounded border transition-all ${activeFilter === 'added' ? 'border-diff-add-text bg-diff-add-bg/50 ring-1 ring-diff-add-text' : 'border-diff-add-text/20 hover:border-diff-add-text/50'}`}
              >
                <span className="text-sm font-medium text-foreground">Additions</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-diff-add-text bg-diff-add-text/10 px-2 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-diff-add-text" /> {stats.added} Field{stats.added !== 1 ? 's' : ''} Added
                </span>
              </button>

              <button 
                onClick={() => handleFilterClick('modified')}
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
