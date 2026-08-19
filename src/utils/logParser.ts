export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG'

export interface LogEntry {
  id: number
  level: LogLevel
  timestamp: string
  source: string
  exceptionType: string
  rootCause: string
  raw: string
}

export function parseLogLevel(line: string): LogLevel | null {
  // Hem boşluklu " ERROR " hem de köşeli parantezli "[ERROR]" formatlarını destekleyelim
  if (line.includes(' ERROR ') || line.includes('[ERROR]')) return 'ERROR'
  if (line.includes(' WARN ') || line.includes('[WARN]')) return 'WARN'
  if (line.includes(' INFO ') || line.includes('[INFO]')) return 'INFO'
  if (line.includes(' DEBUG ') || line.includes('[DEBUG]')) return 'DEBUG'

  return null;
}

export function parseLogs(raw: string): LogEntry[] {
  const lines = raw.split('\n');
  const entries: LogEntry[] = []
  let id = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const level = parseLogLevel(line)
    if (!level) continue

    const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)/)
    const timestamp = tsMatch ? tsMatch[1] : ''

    // Source'u bulmak için " - " karakterinden hemen önceki son köşeli parantezi alalım
    const sourceMatch = line.match(/\[([^\]]+)\]\s*-/)
    const source = sourceMatch ? sourceMatch[1] : 'Unknown'

    const msgMatch = line.match(/\]\s*-\s*(.+)$/)
    const msg = msgMatch ? msgMatch[1] : line

    let exceptionType = ''
    let rootCause = ''

    // 5 satır sınırını kaldırdık! Artık bir sonraki ana log satırını (INFO/ERROR) görene kadar aşağı inecek.
    // Çok uzun stack trace'ler için maksimum 200 satırlık bir güvenlik sınırı koyduk.
    for (let j = i + 1; j < Math.min(i + 200, lines.length); j++) {
      const next = lines[j].trim()
      
      // Eğer alt satırda yeni bir log başlığı (ERROR/WARN) bulursak incelemeyi bırak (başka loga geçtik)
      if (parseLogLevel(next)) break
      
      // Satır boşsa kırma, atla (belki adam boşluk bırakıp loga devam etmiştir)
      if (!next) continue

      if (!exceptionType && /^[a-zA-Z][\w.]+Exception|^[a-zA-Z][\w.]+Error/.test(next)) {
        const colonIdx = next.indexOf(':')
        exceptionType = colonIdx > -1 ? next.substring(0, colonIdx) : next;
        rootCause = colonIdx > -1 ? next.substring(colonIdx + 2) : ''
      }

      // En alttaki asıl "Caused by" kök nedendir, o yüzden (!rootCause) kontrolünü de kaldırdık
      // Böylece her bulduğu "Caused by" ile eski sebebi ezecek ve en dipteki asıl sebebi bulacak.
      if (next.startsWith('Caused by: ')) {
        rootCause = next.replace('Caused by: ', '')
      }
    }

    if (!exceptionType) {
      exceptionType = level === 'ERROR' ? 'ApplicationError' : level === 'WARN' ? 'Warning' : 'LogEvent'
      rootCause = msg
    }


    entries.push({
      id: id++,
      level,
      timestamp,
      source,
      exceptionType,
      rootCause,
      raw: line
    })
  }

  return entries;
}
