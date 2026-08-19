import { describe, it, expect } from 'vitest'
import { parseLogs, isNewLogEntry } from '../logParser'

describe('logParser Utilities', () => {
  
  describe('isNewLogEntry', () => {
    it('should correctly identify valid log headers', () => {
      expect(isNewLogEntry('2026-08-18 14:45:01.102 [INFO] [App] - Hello')).toBe(true)
      expect(isNewLogEntry('2026-08-18 14:45:01 ERROR Something went wrong')).toBe(true)
      expect(isNewLogEntry('2026-08-18 14:45:01 [TRACE] Tracing details')).toBe(true)
    })

    it('should reject lines that are just messages containing log level words', () => {
      expect(isNewLogEntry('java.lang.Error: Critical failure')).toBe(false)
      expect(isNewLogEntry('The process failed with ERROR code 5')).toBe(false)
      expect(isNewLogEntry('	at org.example.INFO.service(INFO.java:22)')).toBe(false)
    })
  })

  describe('parseLogs', () => {
    it('should handle empty or whitespace input safely', () => {
      expect(parseLogs('')).toEqual([])
      expect(parseLogs('   \n  \n')).toEqual([])
    })

    it('should correctly parse all supported log levels including TRACE', () => {
      const raw = `
2026-08-18 10:00:00 [INFO]  - Info log
2026-08-18 10:00:01 [WARN]  - Warn log
2026-08-18 10:00:02 [DEBUG] - Debug log
2026-08-18 10:00:03 [TRACE] - Trace log
2026-08-18 10:00:04 [ERROR] - Error log
`
      const entries = parseLogs(raw)
      expect(entries).toHaveLength(5)
      expect(entries.map(e => e.level)).toEqual(['INFO', 'WARN', 'DEBUG', 'TRACE', 'ERROR'])
    })

    it('should parse multiple log entries back-to-back', () => {
      const raw = `
2026-08-18 10:00:00 [INFO] [App] - First
2026-08-18 10:00:01 [INFO] [App] - Second
`
      const entries = parseLogs(raw)
      expect(entries).toHaveLength(2)
      expect(entries[0].rootCause).toBe('First')
      expect(entries[1].rootCause).toBe('Second')
    })

    it('should attach lines without timestamps to the previous log entry (Stack Trace)', () => {
      const raw = `
2026-08-18 10:00:00 [ERROR] [App] - First Error
java.lang.NullPointerException: Object is null
	at com.test.Main(Main.java:10)
2026-08-18 10:00:01 [INFO] [App] - Second Log
`
      const entries = parseLogs(raw)
      expect(entries).toHaveLength(2)
      expect(entries[0].fullStackTrace).toHaveLength(2) // The Exception line and the 'at' line
      expect(entries[0].exceptionType).toBe('java.lang.NullPointerException')
      expect(entries[0].rootCause).toBe('java.lang.NullPointerException: Object is null') // Because no Caused by
    })

    it('should extract the deepest (last) Caused by in multiple Caused by scenario', () => {
      const raw = `
2026-08-18 10:00:00 [ERROR] [DB] - Database Failure
org.hibernate.exception.ConstraintViolationException: Could not execute JDBC batch update
	at org.hibernate...
Caused by: java.sql.BatchUpdateException: Duplicate entry '1' for key 'PRIMARY'
	at java.sql...
Caused by: java.sql.SQLIntegrityConstraintViolationException: Duplicate entry
	at com.mysql...
`
      const entries = parseLogs(raw)
      expect(entries).toHaveLength(1)
      const e = entries[0]
      expect(e.exceptionType).toBe('org.hibernate.exception.ConstraintViolationException')
      expect(e.rootCause).toBe('java.sql.SQLIntegrityConstraintViolationException: Duplicate entry')
      expect(e.fullStackTrace).toHaveLength(7) // All stack trace lines
    })

    it('should truncate stack trace if it exceeds 1000 lines', () => {
      // Create a log with a 1005 line stack trace
      let raw = '2026-08-18 10:00:00 [ERROR] [App] - Massive Error\n'
      for (let i = 0; i < 1005; i++) {
        raw += '\tat some.deep.CallStack(CallStack.java:10)\n'
      }

      const entries = parseLogs(raw)
      expect(entries).toHaveLength(1)
      expect(entries[0].fullStackTrace.length).toBeLessThanOrEqual(1000)
      expect(entries[0].isTruncated).toBe(true)
    })
    
    it('should ignore arbitrary colons and not produce false root causes', () => {
      const raw = `
2026-08-18 10:00:00 [INFO] [App] - User payload: {"id": 5}
      `
      const entries = parseLogs(raw)
      expect(entries).toHaveLength(1)
      // Since it's a normal log without an exception, the rootCauseCandidate falls back to the message itself
      expect(entries[0].rootCause).toBe('User payload: {"id": 5}')
      expect(entries[0].exceptionType).toBe('LogEvent') // It's INFO, so LogEvent
    })
  })
})
