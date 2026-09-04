import { decodeJwt, getDeterministicChecks, MaskPii, JwtDecodedData, DeterministicFinding } from "./core/jwtDecoder";
import { parseLogs, LogEntry } from "./core/logParser";
import { compareJSON, countDiffs, getDiffPaths, getModifiedFields } from "./core/jsonDiff";

// Ortam değişkeninden dinamik okuma (Node.js ve Tarayıcı uyumlu)
const getApiUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.DEVMATE_API_URL) {
    return process.env.DEVMATE_API_URL;
  }
  return 'http://localhost:5242';
};

/**
 * Token'i önce lokalde (deterministik ve maskeleme) işler, ardından C# backend'e AI analizi için yollar.
 */
export async function analyzeJwtWithAi(token: string) {
  const parsed = decodeJwt(token);
  
  if (!parsed.header || !parsed.payload) {
    throw new Error("Invalid token format for AI analysis.");
  }
  
  const deterministicChecks = getDeterministicChecks(parsed.header, parsed.payload);
  const maskedPayload = MaskPii(parsed.payload);

  const response = await fetch(`${getApiUrl()}/api/jwt/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Header: parsed.header,
      Payload: maskedPayload,
      DeterministicFindings: deterministicChecks
    })
  });

  if (!response.ok) {
    throw new Error(`AI Analysis failed with status: ${response.status}`);
  }

  const data = await response.json();
  return {
    localAnalysis: {
      parsed,
      deterministicChecks,
      maskedPayload
    },
    aiInsights: data
  };
}

/**
 * Logları lokalde parse eder ve ardından C# backend'e AI analizi için yollar.
 */
export async function analyzeLogWithAi(rawLogs: string, levelFilter?: string) {
  const allLogs = parseLogs(rawLogs);
  
  let logsToSend = allLogs;
  if (levelFilter) {
    logsToSend = allLogs.filter(l => l.level === levelFilter.toUpperCase());
  }
  
  const response = await fetch(`${getApiUrl()}/api/logs/analyze-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Logs: logsToSend })
  });

  if (!response.ok) {
    throw new Error(`Log AI Analysis failed with status: ${response.status}`);
  }

  const data = await response.json();
  return {
    allLogs,
    sentLogs: logsToSend,
    aiInsights: data
  };
}

/**
 * İki JSON objesi arasındaki farkları lokalde çıkarır ve C# backend'e AI analizi için yollar.
 */
export async function analyzeJsonWithAi(oldObj: any, newObj: any) {
  const diffNode = compareJSON(oldObj, newObj);
  
  const differencesPayload = {
    Added: getDiffPaths(diffNode, 'added'),
    Removed: getDiffPaths(diffNode, 'removed'),
    Modified: getModifiedFields(diffNode).map(f => ({
      Path: f.path,
      OldValue: f.oldValue,
      NewValue: f.newValue
    }))
  };

  const response = await fetch(`${getApiUrl()}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Differences: differencesPayload })
  });

  if (!response.ok) {
    throw new Error(`JSON AI Analysis failed with status: ${response.status}`);
  }

  const data = await response.json();
  return {
    localAnalysis: diffNode,
    aiInsights: data
  };
}

// Tüm modülleri tek bir noktadan dışa aktarıyoruz (Library kullanımı için)
export { decodeJwt, getDeterministicChecks, MaskPii, parseLogs, compareJSON, countDiffs, getDiffPaths, getModifiedFields };
