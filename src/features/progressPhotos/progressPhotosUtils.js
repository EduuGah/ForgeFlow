export const PHOTO_ANGLE_OPTIONS = [
  { value: 'front', label: 'Frente' },
  { value: 'side', label: 'Lado' },
  { value: 'back', label: 'Costas' },
  { value: 'flexed', label: 'Flexionado' },
  { value: 'free', label: 'Livre' },
  { value: 'other', label: 'Outro' },
]

export const MEASUREMENT_FIELDS = [
  { key: 'waist', label: 'Cintura', unit: 'cm' },
  { key: 'chest', label: 'Peito', unit: 'cm' },
  { key: 'arm', label: 'Braço', unit: 'cm' },
  { key: 'hip', label: 'Quadril', unit: 'cm' },
  { key: 'thigh', label: 'Coxa', unit: 'cm' },
]

const STORAGE_DATE_SUFFIX = 'T12:00:00'

export function safeNumber(value) {
  if (value === null || value === undefined || value === '') return null

  const number = Number(String(value).replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

export function normalizeMeasurements(measurements = {}) {
  return MEASUREMENT_FIELDS.reduce((result, field) => {
    const value = safeNumber(measurements?.[field.key])

    if (value !== null && value >= 0) {
      result[field.key] = value
    }

    return result
  }, {})
}

export function normalizeProgressPhoto(photo = {}) {
  const rawDate = photo.date || photo.createdAt || new Date().toISOString()
  const bodyWeight = safeNumber(photo.bodyWeight ?? photo.weight)
  const measurements = normalizeMeasurements(photo.measurements)
  const imageUrl = photo.imageUrl || photo.imageData || ''

  return {
    ...photo,
    id: String(photo._id || photo.id || `local-${Date.now()}`),
    imageUrl,
    imageData: photo.imageData || '',
    publicId: photo.publicId || '',
    date: rawDate ? String(rawDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    angle: normalizePhotoAngle(photo.angle),
    weight: bodyWeight ?? '',
    bodyWeight: bodyWeight ?? '',
    measurements,
    note: String(photo.note || '').trim(),
    isPrivate: photo.isPrivate !== false,
    privacyMode: photo.privacyMode || 'private',
    storage: photo.storage || (photo.imageData ? 'local' : 'database'),
    createdAt: photo.createdAt || rawDate || new Date().toISOString(),
  }
}

export function normalizeProgressPhotoFromApi(photo = {}) {
  return normalizeProgressPhoto(photo)
}

export function normalizePhotoAngle(angle) {
  const allowed = PHOTO_ANGLE_OPTIONS.map((option) => option.value)
  return allowed.includes(angle) ? angle : 'other'
}

export function getAngleLabel(angle) {
  return PHOTO_ANGLE_OPTIONS.find((option) => option.value === angle)?.label || 'Livre'
}

export function formatDate(dateString, options = {}) {
  if (!dateString) return 'Sem data'

  const date = new Date(`${String(dateString).slice(0, 10)}${STORAGE_DATE_SUFFIX}`)

  if (Number.isNaN(date.getTime())) return 'Sem data'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: options.shortYear ? '2-digit' : 'numeric',
  })
}

export function formatLongDate(dateString) {
  if (!dateString) return 'Sem data'

  const date = new Date(`${String(dateString).slice(0, 10)}${STORAGE_DATE_SUFFIX}`)

  if (Number.isNaN(date.getTime())) return 'Sem data'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function getDateKey(dateString) {
  return String(dateString || '').slice(0, 10) || 'sem-data'
}

export function getDateGroupTitle(dateString) {
  if (!dateString || dateString === 'sem-data') return 'Sem data'

  const date = new Date(`${dateString}${STORAGE_DATE_SUFFIX}`)
  if (Number.isNaN(date.getTime())) return 'Sem data'

  const today = new Date()
  const yesterday = new Date()

  yesterday.setDate(today.getDate() - 1)

  const key = date.toISOString().slice(0, 10)
  const todayKey = today.toISOString().slice(0, 10)
  const yesterdayKey = yesterday.toISOString().slice(0, 10)

  if (key === todayKey) return 'Hoje'
  if (key === yesterdayKey) return 'Ontem'

  return formatLongDate(dateString)
}

export function getDaysBetween(startDate, endDate) {
  if (!startDate || !endDate) return null

  const start = new Date(`${String(startDate).slice(0, 10)}${STORAGE_DATE_SUFFIX}`)
  const end = new Date(`${String(endDate).slice(0, 10)}${STORAGE_DATE_SUFFIX}`)
  const diff = Math.round((end - start) / 86400000)

  return Number.isFinite(diff) ? diff : null
}

export function getDaysSince(dateString) {
  if (!dateString) return null

  return getDaysBetween(dateString, new Date().toISOString().slice(0, 10))
}

export function sortPhotosByDateDesc(a, b) {
  const dateA = new Date(a.date || a.createdAt || 0)
  const dateB = new Date(b.date || b.createdAt || 0)

  return dateB - dateA
}

export function groupPhotosByAngle(photos = []) {
  return photos.reduce((groups, photo) => {
    const angle = normalizePhotoAngle(photo.angle)

    if (!groups[angle]) groups[angle] = []
    groups[angle].push(photo)

    return groups
  }, {})
}

export function groupPhotosByDate(photos = []) {
  const groups = new Map()

  photos.forEach((photo) => {
    const key = getDateKey(photo.date)

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(photo)
  })

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    title: getDateGroupTitle(dateKey),
    photos: items.sort(sortPhotosByDateDesc),
  }))
}

export function getPhotoStats(photos = []) {
  const normalized = photos.map(normalizeProgressPhoto).sort(sortPhotosByDateDesc)
  const angleSet = new Set(normalized.map((photo) => photo.angle).filter(Boolean))
  const weekSet = new Set(
    normalized.map((photo) => {
      const date = new Date(`${photo.date}${STORAGE_DATE_SUFFIX}`)
      if (Number.isNaN(date.getTime())) return ''
      const firstDay = new Date(date.getFullYear(), 0, 1)
      const week = Math.ceil((((date - firstDay) / 86400000) + firstDay.getDay() + 1) / 7)
      return `${date.getFullYear()}-${week}`
    }).filter(Boolean)
  )

  return {
    total: normalized.length,
    angles: angleSet.size,
    weeks: weekSet.size,
    lastPhoto: normalized[0] || null,
    firstPhoto: normalized[normalized.length - 1] || null,
    lastDate: normalized[0]?.date || '',
  }
}

export function calculateMeasurementDiff(firstPhoto, latestPhoto) {
  if (!firstPhoto || !latestPhoto) return []

  const diffs = []
  const firstWeight = safeNumber(firstPhoto.bodyWeight ?? firstPhoto.weight)
  const latestWeight = safeNumber(latestPhoto.bodyWeight ?? latestPhoto.weight)

  if (firstWeight !== null && latestWeight !== null) {
    diffs.push({
      key: 'bodyWeight',
      label: 'Peso',
      unit: 'kg',
      value: Number((latestWeight - firstWeight).toFixed(1)),
    })
  }

  MEASUREMENT_FIELDS.forEach((field) => {
    const first = safeNumber(firstPhoto.measurements?.[field.key])
    const latest = safeNumber(latestPhoto.measurements?.[field.key])

    if (first !== null && latest !== null) {
      diffs.push({
        key: field.key,
        label: field.label,
        unit: field.unit,
        value: Number((latest - first).toFixed(1)),
      })
    }
  })

  return diffs
}

export function buildPhotoInsights(photos = []) {
  const normalized = photos.map(normalizeProgressPhoto).sort(sortPhotosByDateDesc)

  if (normalized.length === 0) {
    return ['Adicione sua primeira foto para acompanhar sua evolução visual ao longo do tempo.']
  }

  const stats = getPhotoStats(normalized)
  const insights = []
  const lastDays = getDaysSince(stats.lastDate)
  const byAngle = groupPhotosByAngle(normalized)
  const mostUsedAngle = Object.entries(byAngle)
    .sort((a, b) => b[1].length - a[1].length)[0]

  insights.push(`Você registrou fotos em ${stats.weeks} semana${stats.weeks === 1 ? '' : 's'} diferente${stats.weeks === 1 ? '' : 's'}.`)

  if (lastDays !== null) {
    insights.push(lastDays === 0 ? 'Sua última foto foi registrada hoje.' : `Sua última foto foi há ${lastDays} dia${lastDays === 1 ? '' : 's'}.`)
  }

  if (mostUsedAngle) {
    insights.push(`Seu ângulo mais registrado é ${getAngleLabel(mostUsedAngle[0])}.`)
  }

  const diffs = calculateMeasurementDiff(stats.firstPhoto, stats.lastPhoto)

  diffs.slice(0, 3).forEach((diff) => {
    if (diff.value === 0) return
    const verb = diff.value > 0 ? 'aumentou' : 'reduziu'
    insights.push(`${diff.label} ${verb} ${Math.abs(diff.value).toLocaleString('pt-BR')} ${diff.unit} desde a primeira foto registrada.`)
  })

  return insights
}

export function getComparablePhotoOptions(photos = [], targetAngle = '') {
  const sorted = photos.map(normalizeProgressPhoto).sort(sortPhotosByDateDesc)

  if (!targetAngle) return sorted

  const sameAngle = sorted.filter((photo) => photo.angle === targetAngle)
  const otherAngles = sorted.filter((photo) => photo.angle !== targetAngle)

  return [...sameAngle, ...otherAngles]
}

export function createEmptyMeasurements() {
  return MEASUREMENT_FIELDS.reduce((result, field) => {
    result[field.key] = ''
    return result
  }, {})
}

export async function compressProgressImage(file, options = {}) {
  if (!file) throw new Error('Selecione uma imagem.')

  const maxSize = options.maxSize || 1280
  const quality = options.quality || 0.82
  const maxBytes = options.maxBytes || 1.2 * 1024 * 1024
  const type = 'image/jpeg'

  if (!file.type?.startsWith('image/')) {
    throw new Error('Formato de imagem inválido.')
  }

  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Não foi possível carregar a imagem escolhida.'))
      img.src = imageUrl
    })

    const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * ratio))
    const height = Math.max(1, Math.round(image.height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar a imagem.')

    context.drawImage(image, 0, 0, width, height)

    let nextQuality = quality
    let blob = await canvasToBlob(canvas, type, nextQuality)

    while (blob.size > maxBytes && nextQuality > 0.58) {
      nextQuality -= 0.08
      blob = await canvasToBlob(canvas, type, nextQuality)
    }

    const compressedFile = new File(
      [blob],
      `${file.name.replace(/\.[a-z0-9]+$/i, '') || 'forgeflow-photo'}.jpg`,
      { type, lastModified: Date.now() }
    )

    const dataUrl = await blobToDataUrl(blob)

    return {
      file: compressedFile,
      dataUrl,
      width,
      height,
      originalSize: file.size,
      size: blob.size,
    }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível comprimir a imagem.'))
        return
      }

      resolve(blob)
    }, type, quality)
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Não foi possível preparar a prévia da imagem.'))
    reader.readAsDataURL(blob)
  })
}

export function mergeRemoteAndLocalPhotos(remotePhotos = [], cachedPhotos = []) {
  const remote = remotePhotos.map(normalizeProgressPhoto)
  const remoteIds = new Set(remote.map((photo) => photo.id))
  const localOnly = cachedPhotos
    .map(normalizeProgressPhoto)
    .filter((photo) => photo.storage === 'local' || String(photo.id).startsWith('local-'))
    .filter((photo) => !remoteIds.has(photo.id))

  return [...remote, ...localOnly].sort(sortPhotosByDateDesc)
}
