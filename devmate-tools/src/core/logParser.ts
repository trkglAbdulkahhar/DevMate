export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'

export interface LogEntry {
  id: number
  level: LogLevel
  timestamp: string
  source: string
  exceptionType: string
  rootCause: string
  fullStackTrace: string[]
  isTruncated?: boolean
  raw: string
}

export function parseLogLevel(line: string): LogLevel | null {
  if (line.includes(' ERROR ') || line.includes('[ERROR]')) return 'ERROR'
  if (line.includes(' WARN ') || line.includes('[WARN]')) return 'WARN'
  if (line.includes(' INFO ') || line.includes('[INFO]')) return 'INFO'
  if (line.includes(' DEBUG ') || line.includes('[DEBUG]')) return 'DEBUG'
  if (line.includes(' TRACE ') || line.includes('[TRACE]')) return 'TRACE'
  return null;
}

export function isNewLogEntry(line: string): boolean {
  return /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?\s*(?:\[(ERROR|WARN|INFO|DEBUG|TRACE)\]|\b(ERROR|WARN|INFO|DEBUG|TRACE)\b)/.test(line);
}

export function parseLogs(raw: string): LogEntry[] {
  const lines = raw.split('\n');
  const entries: LogEntry[] = []
  let id = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Eğer bu satır gerçek bir log başlangıcı (Header) değilse atla
    if (!isNewLogEntry(line)) continue

    const level = parseLogLevel(line)
    if (!level) continue

    const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?)/)
    const timestamp = tsMatch ? tsMatch[1] : ''

    const sourceMatch = line.match(/\[([^\]]+)\]\s*-/)
    const source = sourceMatch ? sourceMatch[1] : 'Unknown'

    const msgMatch = line.match(/\]\s*-\s*(.+)$/)
    const msg = msgMatch ? msgMatch[1] : line

    let topLevelException = ''
    let topLevelExceptionMessage = ''
    let lastCausedBy = ''
    const fullStackTrace: string[] = []
    let isTruncated = false

    // İç döngü (Lookahead): Logun devamı (stack trace) varsa topla.
    // Çok uzun stack trace'ler için maksimum 200 satırlık bir güvenlik sınırı (Safety Limit) koyduk.
    let j = i + 1;
    let traceCount = 0;
    
    while (j < lines.length && traceCount < 200) {
      const next = lines[j].trim()
      
      // Yeni bir log başladıysa (Header Pattern eşleşirse) alt satırları taramayı bırak
      if (next && isNewLogEntry(next)) break
      
      traceCount++; // Sadece loga ait olan satırları sayıyoruz
      
      if (!next) {
        fullStackTrace.push("")
      } else {
        fullStackTrace.push(next)

        // 1. Top Level Exception arayışı (İlk bulunan alınır)
        if (!topLevelException && /^[a-zA-Z][\w.]+(Exception|Error)/.test(next)) {
          const colonIdx = next.indexOf(':')
          topLevelException = colonIdx > -1 ? next.substring(0, colonIdx) : next;
          topLevelExceptionMessage = next;
        }

        // 2. Caused by arayışı (Gördükçe üzerine yazılır, en sonuncu en derindeki kalır)
        if (next.startsWith('Caused by: ')) {
          lastCausedBy = next.replace('Caused by:', '').trim()
        }
      }
      j++;
    }

    // Eğer tam 200 satır okuduk ve bir sonraki satır hala yeni bir log değilse, demek ki log devam ediyordu (kesildi)
    if (j < lines.length && lines[j].trim() !== '' && !isNewLogEntry(lines[j].trim())) {
      isTruncated = true;
    }

    // 3 & 4 & 6. Root Cause (Kök Neden) Seçim Algoritması
    let rootCauseCandidate = ''
    if (lastCausedBy) {
      rootCauseCandidate = lastCausedBy
    } else if (topLevelExceptionMessage) {
      rootCauseCandidate = topLevelExceptionMessage
    } else {
      // Exception formatı hiç yoksa rootCause boş/unknown kalabilir veya direkt ana mesaj olabilir.
      // Ekranda boş kart çıkmaması için normal loglarda mesajın kendisini gösteriyoruz.
      rootCauseCandidate = msg
    }

    let exceptionType = topLevelException
    if (!exceptionType) {
      exceptionType = level === 'ERROR' ? 'ApplicationError' : level === 'WARN' ? 'Warning' : 'LogEvent'
    }

    entries.push({
      id: id++,
      level,
      timestamp,
      source,
      exceptionType,
      rootCause: rootCauseCandidate,
      fullStackTrace,
      isTruncated,
      raw: line
    })

    // Ana döngüyü iç döngünün bittiği yere taşıyalım, böylece stack trace satırlarını tekrar işlemeyiz (Performans & Bug Fix)
    i = j - 1;
  }

  return entries;
}
