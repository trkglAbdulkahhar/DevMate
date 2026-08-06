export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface DiffNode {
  type: DiffType
  value?: any
  oldValue?: any
  newValue?: any
  children?: Record<string, DiffNode>
}

export function compareJSON(oldObj: any, newObj: any): DiffNode {
  if (oldObj === newObj) {
    return { type: 'unchanged', value: oldObj }
  }

  if (
    typeof oldObj !== typeof newObj ||
    Array.isArray(oldObj) !== Array.isArray(newObj) ||
    typeof oldObj !== 'object' ||
    oldObj === null ||
    newObj === null
  ) {
    return { type: 'modified', oldValue: oldObj, newValue: newObj }
  }

  const children: Record<string, DiffNode> = {}
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  let hasChanges = false

  keys.forEach((key) => {
    // Note: Array comparison uses this index-based order comparison as well.
    // In this MVP, arrays are treated essentially as objects where keys are indices.
    if (!Object.hasOwn(oldObj, key)) {
      children[key] = { type: 'added', value: newObj[key] }
      hasChanges = true
    } else if (!Object.hasOwn(newObj, key)) {
      children[key] = { type: 'removed', value: oldObj[key] }
      hasChanges = true
    } else {
      const childDiff = compareJSON(oldObj[key], newObj[key])
      children[key] = childDiff
      if (childDiff.type !== 'unchanged') {
        hasChanges = true
      }
    }
  })

  if (!hasChanges) {
    return { type: 'unchanged', value: oldObj }
  }

  return { type: 'modified', children }
}

export function countDiffs(node: DiffNode): { added: number; removed: number; modified: number } {
  const counts = { added: 0, removed: 0, modified: 0 }

  function traverse(n: DiffNode) {
    if (n.type === 'added') counts.added++
    if (n.type === 'removed') counts.removed++
    if (n.type === 'modified' && !n.children) counts.modified++
    
    if (n.children) {
      Object.values(n.children).forEach(traverse)
    }
  }

  traverse(node)
  return counts
}

export function getDiffPaths(node: DiffNode, targetType: DiffType, currentPath: string = 'root'): string[] {
  let paths: string[] = []
  
  if (node.type === targetType && !node.children) {
    paths.push(currentPath)
  }

  if (node.children) {
    Object.entries(node.children).forEach(([key, childNode]) => {
      paths = paths.concat(getDiffPaths(childNode, targetType, `${currentPath}.${key}`))
    })
  }

  return paths
}
