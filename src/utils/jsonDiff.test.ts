import { describe, it, expect } from 'vitest'
import { compareJSON, countDiffs, getDiffPaths } from './jsonDiff'

describe('jsonDiff utility', () => {
  describe('compareJSON', () => {
    it('should return unchanged for identical primitive values', () => {
      const result = compareJSON(42, 42)
      expect(result).toEqual({ type: 'unchanged', value: 42 })
    })

    it('should return unchanged for identical objects', () => {
      const obj = { a: 1, b: 'test' }
      const result = compareJSON(obj, { ...obj })
      expect(result).toEqual({ type: 'unchanged', value: obj })
    })

    it('should return modified when types differ', () => {
      const result = compareJSON({ a: 1 }, "string")
      expect(result.type).toBe('modified')
      expect(result.oldValue).toEqual({ a: 1 })
      expect(result.newValue).toBe("string")
    })

    it('should correctly identify added properties', () => {
      const oldObj = { a: 1 }
      const newObj = { a: 1, b: 2 }
      const result = compareJSON(oldObj, newObj)
      expect(result.type).toBe('modified')
      expect(result.children?.b).toEqual({ type: 'added', value: 2 })
      expect(result.children?.a).toEqual({ type: 'unchanged', value: 1 })
    })

    it('should correctly identify removed properties', () => {
      const oldObj = { a: 1, b: 2 }
      const newObj = { a: 1 }
      const result = compareJSON(oldObj, newObj)
      expect(result.type).toBe('modified')
      expect(result.children?.b).toEqual({ type: 'removed', value: 2 })
      expect(result.children?.a).toEqual({ type: 'unchanged', value: 1 })
    })

    it('should correctly identify modified properties', () => {
      const oldObj = { a: 1 }
      const newObj = { a: 2 }
      const result = compareJSON(oldObj, newObj)
      expect(result.type).toBe('modified')
      expect(result.children?.a).toEqual({ type: 'modified', oldValue: 1, newValue: 2 })
    })

    it('should handle nested objects', () => {
      const oldObj = { nested: { a: 1, b: 2 } }
      const newObj = { nested: { a: 1, c: 3 } }
      const result = compareJSON(oldObj, newObj)
      expect(result.type).toBe('modified')
      expect(result.children?.nested?.type).toBe('modified')
      expect(result.children?.nested?.children?.b).toEqual({ type: 'removed', value: 2 })
      expect(result.children?.nested?.children?.c).toEqual({ type: 'added', value: 3 })
      expect(result.children?.nested?.children?.a).toEqual({ type: 'unchanged', value: 1 })
    })

    it('should handle array comparisons (index-based)', () => {
      const oldObj = [1, 2]
      const newObj = [1, 3, 4]
      const result = compareJSON(oldObj, newObj)
      expect(result.type).toBe('modified')
      expect(result.children?.['0']).toEqual({ type: 'unchanged', value: 1 })
      expect(result.children?.['1']).toEqual({ type: 'modified', oldValue: 2, newValue: 3 })
      expect(result.children?.['2']).toEqual({ type: 'added', value: 4 })
    })
  })

  describe('countDiffs', () => {
    it('should correctly count added, removed, and modified nodes', () => {
      const oldObj = { a: 1, b: 2, c: { d: 3 } }
      const newObj = { a: 1, x: 99, c: { d: 4, e: 5 } }
      const diff = compareJSON(oldObj, newObj)
      const counts = countDiffs(diff)
      
      expect(counts.added).toBe(2) // x, c.e
      expect(counts.removed).toBe(1) // b
      expect(counts.modified).toBe(1) // c.d
    })
  })

  describe('getDiffPaths', () => {
    it('should return paths for specific diff types', () => {
      const oldObj = { a: 1, b: 2, c: { d: 3 } }
      const newObj = { a: 1, x: 99, c: { d: 4, e: 5 } }
      const diff = compareJSON(oldObj, newObj)
      
      const addedPaths = getDiffPaths(diff, 'added')
      expect(addedPaths).toContain('root.x')
      expect(addedPaths).toContain('root.c.e')
      
      const removedPaths = getDiffPaths(diff, 'removed')
      expect(removedPaths).toEqual(['root.b'])
      
      const modifiedPaths = getDiffPaths(diff, 'modified')
      expect(modifiedPaths).toEqual(['root.c.d'])
    })
  })
})
