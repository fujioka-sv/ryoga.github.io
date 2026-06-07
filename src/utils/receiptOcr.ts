// レシート画像をブラウザ内 OCR（Tesseract.js）でテキスト化する。
// 画像は端末外へ送信されない。言語データ/WASM は初回のみ CDN から取得しキャッシュされる。
import Tesseract from 'tesseract.js'

const MAX_EDGE = 1500 // 認識精度と速度のバランスを取る長辺の上限(px)

// 画像をグレースケール化＋リサイズして OCR 向けに前処理した Blob を返す。
async function preprocess(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file // 取得失敗時はそのまま渡す
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = data[i + 1] = data[i + 2] = gray
  }
  ctx.putImageData(img, 0, 0)

  return new Promise<Blob>(resolve => {
    canvas.toBlob(b => resolve(b ?? file), 'image/png')
  })
}

// 画像ファイルを OCR して生テキストを返す。onProgress には 0-100 の進捗を渡す。
export async function runReceiptOcr(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const blob = await preprocess(file)
  const { data } = await Tesseract.recognize(blob, 'jpn', {
    logger: m => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  return data.text
}
