
import { type DiffNode } from '../utils/jsonDiff'

export function DiffViewer({ node, side, indent = 0, name = '', path = 'root', activeDiffId = null }: { node: DiffNode, side: 'orig' | 'mod', indent?: number, name?: string, path?: string, activeDiffId?: string | null }) {
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
            <DiffViewer key={childName} name={childName} node={childNode} side={side} indent={indent + 1} path={currentPath} activeDiffId={activeDiffId} />
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
