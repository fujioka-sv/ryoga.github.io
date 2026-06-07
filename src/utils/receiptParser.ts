// レシート OCR の生テキストから 金額・日付・メモ（店名/品目）を抽出する純粋関数群。
// Tesseract の認識結果はノイズが多い前提で、ヒューリスティックに最も妥当な候補を選ぶ。

export interface ParsedReceipt {
  amount?: number
  date?: string // YYYY-MM-DD
  memo?: string
}

// 全角数字・記号を半角へ正規化
function toHalfWidth(s: string): string {
  return s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
}

// 文字列中の最初の金額（数値）を取り出す。¥・円・カンマ・空白を除去。
function extractAmountFromLine(line: string): number | undefined {
  const cleaned = toHalfWidth(line).replace(/[,，\s]/g, '')
  // ¥1234 / 1234円 / \1234 などにマッチ
  const matches = cleaned.match(/[¥\\￥]?\d{2,7}円?/g)
  if (!matches) return undefined
  const nums = matches
    .map(m => parseInt(m.replace(/[^\d]/g, ''), 10))
    .filter(n => !Number.isNaN(n) && n > 0)
  if (nums.length === 0) return undefined
  // 1行に複数あれば最大（合計行に税抜/税込が並ぶケースを想定）
  return Math.max(...nums)
}

// 合計金額の抽出。合計系キーワード行を優先、なければ全体の最大金額。
function parseAmount(lines: string[]): number | undefined {
  const totalKeywords = /(合\s*計|小\s*計|お買上|お会計|お支払|総額|total)/i
  const excludeKeywords = /(お預|預り|お釣|釣銭|つり|現金|クレジット|ポイント|point|残高|個)/i

  const candidates: number[] = []
  for (const line of lines) {
    if (excludeKeywords.test(line)) continue
    if (totalKeywords.test(line)) {
      const amt = extractAmountFromLine(line)
      if (amt !== undefined) candidates.push(amt)
    }
  }
  if (candidates.length > 0) {
    // 「合計」行は通常最大の値。複数候補は最大を採用。
    return Math.max(...candidates)
  }

  // フォールバック: 除外行以外の最大金額
  let max: number | undefined
  for (const line of lines) {
    if (excludeKeywords.test(line)) continue
    const amt = extractAmountFromLine(line)
    if (amt !== undefined && (max === undefined || amt > max)) max = amt
  }
  return max
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function buildDate(y: number, m: number, d: number): string | undefined {
  if (m < 1 || m > 12 || d < 1 || d > 31) return undefined
  if (y < 2000 || y > 2099) return undefined
  return `${y}-${pad2(m)}-${pad2(d)}`
}

// 和暦 → 西暦（令和/平成のみ簡易対応）
function eraToYear(era: string, year: number): number | undefined {
  if (/令和|^R/i.test(era)) return 2018 + year // 令和1=2019
  if (/平成|^H/i.test(era)) return 1988 + year // 平成1=1989
  return undefined
}

// 日付の抽出。複数表記に対応し YYYY-MM-DD へ正規化。
function parseDate(text: string): string | undefined {
  const t = toHalfWidth(text)

  // 西暦 YYYY年MM月DD日 / YYYY/MM/DD / YYYY-MM-DD / YYYY.MM.DD
  const full = t.match(/(20\d{2})\s*[年./-]\s*(\d{1,2})\s*[月./-]\s*(\d{1,2})/)
  if (full) {
    const d = buildDate(+full[1], +full[2], +full[3])
    if (d) return d
  }

  // 和暦 令和N年M月D日 / RN.M.D
  const wa = t.match(/(令和|平成|R|H)\s*(\d{1,2})\s*[年./-]\s*(\d{1,2})\s*[月./-]\s*(\d{1,2})/i)
  if (wa) {
    const y = eraToYear(wa[1], +wa[2])
    if (y !== undefined) {
      const d = buildDate(y, +wa[3], +wa[4])
      if (d) return d
    }
  }

  // 2桁年 YY/MM/DD（先頭が 20xx でないもの）
  const short = t.match(/(?<!\d)(\d{2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})(?!\d)/)
  if (short) {
    const d = buildDate(2000 + +short[1], +short[2], +short[3])
    if (d) return d
  }

  return undefined
}

// 店名・品目候補をメモ用に抽出。先頭付近の日本語を含む非数値行を採用。
function parseMemo(lines: string[]): string | undefined {
  const picked: string[] = []
  for (const raw of lines.slice(0, 12)) {
    const line = raw.trim()
    if (line.length < 2 || line.length > 30) continue
    // 数字・記号ばかりの行や明細の金額行は除外
    if (!/[ぁ-んァ-ヶ一-龠A-Za-z]/.test(line)) continue
    if (/(合計|小計|お預|お釣|釣銭|領収|税|登録番号|TEL|電話|http)/i.test(line)) continue
    if (parseDate(line)) continue // 日付行は除外
    // 行末尾の価格表記を除去して読みやすくする（例: "牛乳  198" → "牛乳"）
    const cleaned = toHalfWidth(line).replace(/[¥\\￥]?[\d,]+円?\s*[*※]?$/, '').trim()
    picked.push(cleaned.length >= 2 ? cleaned : line)
    if (picked.length >= 2) break
  }
  if (picked.length === 0) return undefined
  return picked.join(' ').slice(0, 50)
}

export function parseReceipt(text: string): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  return {
    amount: parseAmount(lines),
    date: parseDate(text),
    memo: parseMemo(lines),
  }
}
