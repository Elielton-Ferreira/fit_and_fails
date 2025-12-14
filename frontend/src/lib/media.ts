type PrepareImageOptions = {
  maxDimension?: number
  maxBytes?: number
  mimeType?: string
  quality?: number
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.onloadend = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })

const canvasToBlob = (canvas: HTMLCanvasElement, mimeType: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Não foi possível processar a imagem.'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality
    )
  })

const loadImage = async (file: File): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

const drawScaled = async ({
  file,
  maxDimension
}: {
  file: File
  maxDimension: number
}): Promise<HTMLCanvasElement> => {
  const bitmap = typeof createImageBitmap === 'function' ? await createImageBitmap(file).catch(() => null) : null

  const sourceWidth = bitmap ? bitmap.width : undefined
  const sourceHeight = bitmap ? bitmap.height : undefined

  const img = !bitmap ? await loadImage(file) : null
  const width = bitmap ? sourceWidth! : img!.naturalWidth
  const height = bitmap ? sourceHeight! : img!.naturalHeight

  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível processar a imagem.')

  if (bitmap) {
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    bitmap.close()
  } else if (img) {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
  }

  return canvas
}

export const prepareImageForUpload = async (file: File, options: PrepareImageOptions = {}) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione uma imagem válida (JPG/PNG/WebP).')
  }

  const maxDimension = options.maxDimension ?? 1600
  const maxBytes = options.maxBytes ?? 2_000_000
  const mimeType = options.mimeType ?? 'image/jpeg'

  const canvas = await drawScaled({ file, maxDimension })

  let quality = options.quality ?? 0.82
  let blob = await canvasToBlob(canvas, mimeType, quality)

  const minQuality = 0.55
  while (blob.size > maxBytes && quality > minQuality) {
    quality = Math.max(minQuality, Math.round((quality - 0.1) * 100) / 100)
    blob = await canvasToBlob(canvas, mimeType, quality)
  }

  if (blob.size > maxBytes) {
    throw new Error('A imagem ficou grande demais. Tente uma foto menor.')
  }

  const dataUrl = await blobToDataUrl(blob)
  return { dataUrl, sizeBytes: blob.size, mimeType }
}

