import { describe, it, expect } from 'vitest'
import { compareJSON, countDiffs, getDiffPaths } from '../jsonDiff'

describe('jsonDiff utility', () => {
  it('should return unchanged for identical objects', () => {
    const obj1 = { a: 1, b: 'test' }
    const obj2 = { a: 1, b: 'test' }
    const result = compareJSON(obj1, obj2)
    
    expect(result.type).toBe('unchanged')
    expect(result.value).toEqual(obj1)
  })

  it('should detect added fields', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 1, b: 2 }
    const result = compareJSON(obj1, obj2)
    
    expect(result.type).toBe('modified')
    expect(result.children?.b).toBeDefined()
    expect(result.children?.b.type).toBe('added')
    expect(result.children?.b.value).toBe(2)
    
    const counts = countDiffs(result)
    expect(counts.added).toBe(1)
  })

  it('should detect removed fields', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1 }
    const result = compareJSON(obj1, obj2)
    
    expect(result.type).toBe('modified')
    expect(result.children?.b).toBeDefined()
    expect(result.children?.b.type).toBe('removed')
    expect(result.children?.b.value).toBe(2)
    
    const counts = countDiffs(result)
    expect(counts.removed).toBe(1)
  })

  it('should detect modified fields', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 2 }
    const result = compareJSON(obj1, obj2)
    
    expect(result.type).toBe('modified')
    expect(result.children?.a).toBeDefined()
    expect(result.children?.a.type).toBe('modified')
    expect(result.children?.a.oldValue).toBe(1)
    expect(result.children?.a.newValue).toBe(2)
    
    const counts = countDiffs(result)
    expect(counts.modified).toBe(1)
  })

  it('should return correct diff paths', () => {
    const obj1 = { x: { y: 1 } }
    const obj2 = { x: { y: 2, z: 3 } }
    const result = compareJSON(obj1, obj2)
    
    const addedPaths = getDiffPaths(result, 'added')
    expect(addedPaths).toContain('root.x.z')
    
    const modifiedPaths = getDiffPaths(result, 'modified')
    expect(modifiedPaths).toContain('root.x.y')
  })
})
