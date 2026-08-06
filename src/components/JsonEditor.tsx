import React from 'react'
import { UploadCloud } from 'lucide-react'

interface JsonEditorProps {
  title: string
  value: string
  onChange: (val: string) => void
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  children?: React.ReactNode // for rendering DiffViewer
}

export function JsonEditor({
  title,
  value,
  onChange,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileUpload,
  children
}: JsonEditorProps) {
  return (
    <div className="flex-1 flex flex-col border-r border-border bg-background">
      <div className="h-10 bg-secondary/50 border-b border-border flex items-center justify-between px-4 shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <label className="text-xs flex items-center gap-1.5 text-foreground bg-secondary hover:bg-secondary/80 border border-border px-2 py-1 rounded cursor-pointer transition-colors">
          <UploadCloud className="w-3.5 h-3.5" /> Upload File
          <input type="file" accept=".json,.txt" className="hidden" onChange={onFileUpload} />
        </label>
      </div>
      <div 
        className={`flex-1 flex overflow-hidden relative p-4 transition-colors ${isDragging ? 'border-2 border-dashed border-primary bg-primary/10' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {children ? (
          <div className="flex-1 overflow-auto font-mono text-[13px] leading-relaxed">
            {children}
          </div>
        ) : (
          <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Paste ${title.toLowerCase()} here or drag and drop a file...`}
            className="flex-1 w-full h-full bg-transparent border-none outline-none font-mono text-[13px] text-foreground resize-none"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}
