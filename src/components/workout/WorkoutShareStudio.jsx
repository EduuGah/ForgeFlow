import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  Copy,
  Download,
  ImagePlus,
  Layers3,
  MessageCircle,
  Move,
  Share2,
  Sparkles,
  X,
} from 'lucide-react'

import forgeflowIcon from '../../assets/forgeflow-icon.png'
import Button from '../ui/Button'
import { isNativeApp } from '../../utils/platformUtils'
import {
  normalizeImageToJpegNative,
  saveImageToGalleryNative,
  shareImageToInstagramStoryNative,
} from '../../utils/shareNativeBridge'
import { formatLocationLabel, getMapsUrl } from '../../services/geolocationService'
import {
  formatDate,
  formatTime,
  formatVolume,
  getSessionCompletedSets,
  getSessionPRDetails,
  getSessionPRsFromSets,
  getSessionVolumeFromSets,
} from '../../features/history/historyUtils'

const SHARE_FORMATS = [
  {
    id: 'story',
    label: 'Story 9:16',
    description: 'Ideal para Instagram Stories, WhatsApp e status.',
    width: 1080,
    height: 1920,
  },
  {
    id: 'feed',
    label: 'Feed 1:1',
    description: 'Quadrado para feed e compartilhamento geral.',
    width: 1080,
    height: 1080,
  },
]

const SHARE_TEMPLATES = [
  {
    id: 'photoStory',
    label: 'Photo Story',
    description: 'Foto grande, título forte e chips premium na base.',
    tag: 'Treino concluído',
  },
  {
    id: 'heroPr',
    label: 'Hero PR',
    description: 'Recordes em destaque com selo e lista curta.',
    tag: 'Novo recorde',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Dados do treino em cards técnicos e modernos.',
    tag: 'Performance',
  },
  {
    id: 'editorial',
    label: 'Editorial Minimal',
    description: 'Clean, elegante e com frase protagonista.',
    tag: 'ForgeFlow editorial',
  },
  {
    id: 'darkGlass',
    label: 'Dark Glass',
    description: 'Gradientes, painéis translúcidos e badges.',
    tag: 'Registro premium',
  },
]

const INFO_LEVELS = [
  {
    id: 'light',
    label: 'Leve',
    description: 'Nome, data e duração.',
  },
  {
    id: 'medium',
    label: 'Médio',
    description: 'Tempo, volume, exercícios e PRs.',
  },
  {
    id: 'full',
    label: 'Completo',
    description: 'Inclui séries, local e detalhes extras.',
  },
]

const SHARE_PHRASES = [
  'Mais um treino concluído.',
  'Progresso não falha.',
  'Hoje foi dia de evoluir.',
  'Treino pago com sucesso.',
  'Disciplina acima da motivação.',
  'Cada série conta.',
  'ForgeFlow registrou mais uma batalha.',
  'Mais volume, mais força, mais evolução.',
  'Sem pressa. Sem pausa.',
  'Força construída série por série.',
]

const SHARE_BACKGROUNDS = [
  { id: 'forgeRed', label: 'Forge Red', description: 'Preto premium com brilho vermelho.' },
  { id: 'obsidian', label: 'Obsidian', description: 'Escuro limpo e elegante.' },
  { id: 'carbonGrid', label: 'Carbon Grid', description: 'Grade técnica sutil.' },
  { id: 'ember', label: 'Ember', description: 'Energia quente de treino pesado.' },
  { id: 'neonFlow', label: 'Neon Flow', description: 'Linhas modernas em alto contraste.' },
  { id: 'nightPr', label: 'Night PR', description: 'Roxo escuro para recordes.' },
  { id: 'topoLines', label: 'Topo Lines', description: 'Linhas orgânicas de progresso.' },
  { id: 'steel', label: 'Steel', description: 'Cinza metálico premium.' },
  { id: 'aurora', label: 'Aurora', description: 'Brilho colorido suave.' },
  { id: 'blackMarble', label: 'Black Marble', description: 'Mármore escuro abstrato.' },
  { id: 'redSmoke', label: 'Red Smoke', description: 'Fumaça vermelha dramática.' },
  { id: 'gymLight', label: 'Gym Light', description: 'Luz de academia cinematográfica.' },
]

const DEFAULT_PHOTO_TRANSFORM = {
  x: 0,
  y: 0,
  scale: 1,
  fit: 'cover',
}

const PHOTO_FIT_TRANSFORM = {
  x: 0,
  y: 0,
  scale: 1,
  fit: 'contain',
}

const DEFAULT_OVERLAY_TRANSFORM = {
  x: 0,
  y: 0,
  scale: 1.16,
}

const PHOTO_MIN_SCALE = 1
const PHOTO_MAX_SCALE = 3.35
const OVERLAY_MIN_SCALE = 0.78
const OVERLAY_MAX_SCALE = 2.2
const IMAGE_CACHE = new Map()

function getExerciseName(exercise = {}) {
  return (
    exercise.exercise?.name ||
    exercise.exerciseName ||
    exercise.name ||
    'Exercício'
  )
}

function safeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getShortDate(dateString) {
  if (!dateString) return 'Sem data'

  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  } catch {
    return 'Sem data'
  }
}

function getWorkoutStats(session = {}, meta = {}) {
  const safeMeta = meta || {}
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const completedSets = Array.isArray(safeMeta.completedSets)
    ? safeMeta.completedSets
    : getSessionCompletedSets({ ...session, exercises })
  const sessionVolume = safeMeta.sessionVolume ?? getSessionVolumeFromSets(completedSets)
  const sessionPRs = Array.isArray(safeMeta.sessionPRs)
    ? safeMeta.sessionPRs
    : getSessionPRDetails(session).length > 0
      ? getSessionPRDetails(session)
      : getSessionPRsFromSets(completedSets)

  const bestSet = completedSets.reduce((best, set) => {
    const weight = safeNumber(set.weight)
    const reps = safeNumber(set.reps)
    const score = weight * Math.max(1, reps)
    const bestScore = safeNumber(best?.weight) * Math.max(1, safeNumber(best?.reps))

    return score > bestScore ? set : best
  }, null)

  const topWeightSet = completedSets.reduce((best, set) => {
    const weight = safeNumber(set.weight)
    const bestWeight = safeNumber(best?.weight)

    return weight > bestWeight ? set : best
  }, null)

  const finishedDate = session.finishedAt || session.createdAt
  const locationLabel = getMapsUrl(session.location) ? formatLocationLabel(session.location) : ''
  const topExercises = exercises.map(getExerciseName).filter(Boolean)

  return {
    workoutName: session.workoutName || session.name || 'Treino ForgeFlow',
    dateLabel: formatDate(finishedDate),
    dateShortLabel: getShortDate(finishedDate),
    durationLabel: formatTime(session.duration || session.durationSeconds || 0),
    volume: sessionVolume,
    volumeLabel: formatVolume(sessionVolume),
    exerciseCount: exercises.length,
    completedSetCount: completedSets.length,
    prCount: sessionPRs.length,
    prs: sessionPRs,
    topExercises: topExercises.slice(0, 6),
    bestSet,
    topWeightSet,
    locationLabel,
  }
}

function getSetLabel(set) {
  if (!set) return 'Sem carga registrada'

  const weight = safeNumber(set.weight)
  const reps = safeNumber(set.reps)
  const name = set.exerciseName || 'Melhor série'

  if (!weight && !reps) return name

  return `${name} ${weight || '-'}kg × ${reps || '-'}`
}

function getPrDisplayValue(pr = {}) {
  const value = safeNumber(pr.value)
  const unit = pr.unit || 'kg'

  if (pr.weight || pr.reps) {
    const weight = safeNumber(pr.weight)
    const reps = safeNumber(pr.reps)
    if (weight && reps) return `${weight}kg × ${reps}`
  }

  if (value) return `${value.toLocaleString('pt-BR')}${unit}`

  if (pr.volume) return `${safeNumber(pr.volume).toLocaleString('pt-BR')}kg`

  return pr.label || 'Recorde'
}

function getPrText(pr = {}) {
  const name = pr.exerciseName || pr.exercise || 'Exercício'
  const label = pr.label || 'PR'
  const value = getPrDisplayValue(pr)

  return `${name} • ${label} ${value}`
}

function buildShareText(stats, caption) {
  const lines = [
    `${stats.workoutName} no ForgeFlow`,
    `${stats.durationLabel} • ${stats.volumeLabel} • ${stats.exerciseCount} exercícios • ${stats.completedSetCount} séries`,
  ]

  if (stats.prCount > 0) {
    lines.push(`${stats.prCount} PR${stats.prCount > 1 ? 's' : ''} nesse treino.`)
  }

  if (stats.topWeightSet) {
    lines.push(`Maior carga: ${getSetLabel(stats.topWeightSet)}.`)
  }

  if (caption) lines.push(caption)

  return lines.join('\n')
}

function isLocalImageSource(src = '') {
  return /^data:|^blob:/i.test(String(src || ''))
}

function loadShareImage(src, options = {}) {
  const { anonymous = false } = options
  const safeSrc = String(src || '')

  if (!safeSrc) return Promise.reject(new Error('Imagem sem origem.'))

  const cacheKey = `${anonymous ? 'anonymous' : 'plain'}:${safeSrc}`
  if (IMAGE_CACHE.has(cacheKey)) return IMAGE_CACHE.get(cacheKey)

  const promise = new Promise((resolve, reject) => {
    const image = new Image()

    if (anonymous && !isLocalImageSource(safeSrc)) {
      image.crossOrigin = 'anonymous'
    }

    image.onload = async () => {
      try {
        if (typeof image.decode === 'function') {
          await image.decode()
        }
      } catch {
        // Alguns WebViews resolvem onload e falham no decode. O canvas ainda consegue desenhar.
      }

      if (!image.naturalWidth && !image.width) {
        reject(new Error('Imagem carregada sem dimensão válida.'))
        return
      }

      resolve(image)
    }

    image.onerror = () => {
      IMAGE_CACHE.delete(cacheKey)
      reject(new Error('Não foi possível carregar a imagem escolhida.'))
    }

    image.src = safeSrc
  })

  IMAGE_CACHE.set(cacheKey, promise)
  return promise
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Falha ao ler a imagem selecionada.'))
    reader.readAsDataURL(file)
  })
}


function getDataUrlMimeType(dataUrl = '') {
  const match = String(dataUrl).match(/^data:([^;,]+)[;,]/i)
  return match?.[1]?.toLowerCase() || ''
}

function isLikelyHeicFile(file) {
  const name = String(file?.name || '').toLowerCase()
  const type = String(file?.type || '').toLowerCase()

  return type.includes('heic') || type.includes('heif') || /\.(heic|heif)$/i.test(name)
}

async function tryNormalizeWithNativeBridge(file, dataUrl) {
  if (!isNativeApp() || !dataUrl) return null

  const result = await normalizeImageToJpegNative({
    dataUrl,
    filename: file?.name || 'forgeflow-photo',
    mimeType: file?.type || getDataUrlMimeType(dataUrl) || 'image/heic',
    maxSide: 2600,
    quality: 90,
  })

  if (!result?.dataUrl) return null

  return {
    src: result.dataUrl,
    width: safeNumber(result.width),
    height: safeNumber(result.height),
  }
}


function canvasToDataUrl(canvas, mimeType = 'image/jpeg', quality = 0.92) {
  try {
    return canvas.toDataURL(mimeType, quality)
  } catch {
    return canvas.toDataURL('image/png')
  }
}

async function normalizeImageFileToDataUrl(file) {
  if (typeof document === 'undefined') {
    return readFileAsDataUrl(file)
  }

  if (typeof createImageBitmap === 'function') {
    try {
      let bitmap
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      } catch {
        bitmap = await createImageBitmap(file)
      }

      const maxSide = 2600
      const ratio = Math.min(1, maxSide / Math.max(bitmap.width || 1, bitmap.height || 1))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * ratio))
      canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
      const ctx = canvas.getContext('2d', { alpha: false })

      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close?.()

      return canvasToDataUrl(canvas, 'image/jpeg', 0.92)
    } catch (error) {
      console.warn('createImageBitmap não conseguiu normalizar a foto:', error)
    }
  }

  return readFileAsDataUrl(file)
}

async function createUserPhotoFromFile(file) {
  if (!file) throw new Error('Nenhuma imagem selecionada.')

  const mimeType = String(file.type || '')
  const isHeic = isLikelyHeicFile(file)
  if (mimeType && !mimeType.startsWith('image/') && !isHeic) {
    throw new Error('Selecione um arquivo de imagem válido.')
  }

  let rawDataUrl = ''

  try {
    rawDataUrl = await readFileAsDataUrl(file)
  } catch (error) {
    console.warn('Falha ao ler foto original:', error)
  }

  if (isHeic && rawDataUrl) {
    try {
      const nativePhoto = await tryNormalizeWithNativeBridge(file, rawDataUrl)
      if (nativePhoto?.src) {
        return {
          file,
          src: nativePhoto.src,
          name: file.name || 'foto-do-treino.jpg',
          width: nativePhoto.width,
          height: nativePhoto.height,
        }
      }
    } catch (nativeError) {
      console.warn('Conversão nativa HEIC/HEIF falhou:', nativeError)
    }
  }

  let src
  let image
  let objectUrl = ''

  try {
    src = await normalizeImageFileToDataUrl(file)
    image = await loadShareImage(src)
  } catch (firstError) {
    console.warn('Falha ao carregar foto normalizada:', firstError)

    if (rawDataUrl) {
      try {
        const nativePhoto = await tryNormalizeWithNativeBridge(file, rawDataUrl)
        if (nativePhoto?.src) {
          src = nativePhoto.src
          image = await loadShareImage(src)
        }
      } catch (nativeError) {
        console.warn('Conversão nativa da foto falhou:', nativeError)
      }
    }

    if (!image) {
      try {
        objectUrl = URL.createObjectURL(file)
        image = await loadShareImage(objectUrl)

        const canvas = document.createElement('canvas')
        const width = image.naturalWidth || image.width
        const height = image.naturalHeight || image.height
        const maxSide = 2600
        const ratio = Math.min(1, maxSide / Math.max(width || 1, height || 1))
        canvas.width = Math.max(1, Math.round(width * ratio))
        canvas.height = Math.max(1, Math.round(height * ratio))
        const ctx = canvas.getContext('2d', { alpha: false })
        ctx.fillStyle = '#050505'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        src = canvasToDataUrl(canvas, 'image/jpeg', 0.92)
        image = await loadShareImage(src)
      } catch (secondError) {
        console.warn('Falha ao carregar foto por ObjectURL:', secondError)
        const heicMessage = isHeic
          ? 'O arquivo parece HEIC/HEIF. No APK atualizado o ForgeFlow tenta converter pelo Android antes de desenhar; no navegador alguns HEIC ainda não abrem. Gere o APK de novo e teste pela galeria do celular.'
          : 'Tente outra foto JPG, PNG ou WEBP.'
        throw new Error(`Não foi possível carregar a imagem escolhida. ${heicMessage}`, { cause: secondError })
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }
  }

  return {
    file,
    src,
    name: file.name || 'foto-do-treino',
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  }
}

async function waitForFonts() {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready
    }
  } catch {
    // A geração em canvas continua usando a fonte fallback.
  }
}

function getShareAccentColor() {
  if (typeof window === 'undefined') return '#ef4444'

  const color = getComputedStyle(document.documentElement)
    .getPropertyValue('--ff-accent')
    .trim()

  return color || '#ef4444'
}

function getShareAccentSoftColor() {
  if (typeof window === 'undefined') return 'rgba(239,68,68,0.16)'

  const color = getComputedStyle(document.documentElement)
    .getPropertyValue('--ff-accent-soft')
    .trim()

  return color || 'rgba(239,68,68,0.16)'
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius)
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius)
  ctx.arcTo(x, y + height, x, y, safeRadius)
  ctx.arcTo(x, y, x + width, y, safeRadius)
  ctx.closePath()
}

function truncateText(ctx, text, maxWidth) {
  const value = String(text || '').replace(/\s+/g, ' ').trim()
  if (!value) return ''
  if (ctx.measureText(value).width <= maxWidth) return value

  const suffix = '…'
  let output = value
  const available = Math.max(0, maxWidth - ctx.measureText(suffix).width)

  while (output.length > 1 && ctx.measureText(output).width > available) {
    output = output.slice(0, -1)
  }

  return `${output}${suffix}`
}

function splitLongWord(ctx, word, maxWidth) {
  const chunks = []
  let chunk = ''

  String(word || '').split('').forEach((char) => {
    const next = `${chunk}${char}`
    if (ctx.measureText(next).width > maxWidth && chunk) {
      chunks.push(chunk)
      chunk = char
      return
    }
    chunk = next
  })

  if (chunk) chunks.push(chunk)
  return chunks
}

function getWrappedLines(ctx, text, maxWidth, maxLines = 3) {
  const rawWords = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const words = rawWords.flatMap((word) => (
    ctx.measureText(word).width > maxWidth ? splitLongWord(ctx, word, maxWidth) : [word]
  ))
  const lines = []
  let line = ''

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word

    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
      return
    }

    line = testLine
  })

  if (line) lines.push(line)

  const visibleLines = lines.slice(0, maxLines)
  const overflowed = lines.length > maxLines

  if (overflowed && visibleLines.length) {
    visibleLines[visibleLines.length - 1] = truncateText(ctx, visibleLines[visibleLines.length - 1], maxWidth)
  }

  return {
    lines: visibleLines,
    overflowed,
  }
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3, options = {}) {
  const { align = 'left', baseline = 'alphabetic' } = options
  const { lines } = getWrappedLines(ctx, text, maxWidth, maxLines)
  const visibleLines = lines.length ? lines : ['']
  const previousAlign = ctx.textAlign
  const previousBaseline = ctx.textBaseline

  ctx.textAlign = align
  ctx.textBaseline = baseline

  visibleLines.forEach((line, index) => {
    let lineX = x
    if (align === 'center') lineX = x + maxWidth / 2
    if (align === 'right') lineX = x + maxWidth
    ctx.fillText(line, lineX, y + index * lineHeight)
  })

  ctx.textAlign = previousAlign
  ctx.textBaseline = previousBaseline

  return {
    lines: visibleLines.length,
    height: Math.max(visibleLines.length, 1) * lineHeight,
    nextY: y + Math.max(visibleLines.length, 1) * lineHeight,
  }
}

function drawGlassPanel(ctx, x, y, width, height, radius = 42, options = {}) {
  const {
    fill = 'rgba(255,255,255,0.075)',
    stroke = 'rgba(255,255,255,0.13)',
    shadow = true,
  } = options

  ctx.save()
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.28)'
    ctx.shadowBlur = 26
    ctx.shadowOffsetY = 12
  }
  drawRoundRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

function drawBadge(ctx, text, x, y, options = {}) {
  const {
    color = '#ffffff',
    fill = 'rgba(255,255,255,0.1)',
    stroke = 'rgba(255,255,255,0.14)',
    fontSize = 23,
    padX = 24,
    height = 58,
  } = options

  ctx.save()
  ctx.font = `900 ${fontSize}px Inter, Arial, sans-serif`
  const width = Math.min(options.maxWidth || 520, ctx.measureText(text).width + padX * 2)
  drawRoundRect(ctx, x, y, width, height, height / 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fillText(truncateText(ctx, text, width - padX * 2), x + padX, y + height / 2 + fontSize * 0.34)
  ctx.restore()

  return width
}

function drawMetricChip(ctx, metric, x, y, width, height, options = {}) {
  const {
    accentColor = '#ef4444',
    compact = false,
    fill = 'rgba(255,255,255,0.086)',
  } = options

  drawGlassPanel(ctx, x, y, width, height, compact ? 24 : 31, {
    fill,
    stroke: 'rgba(255,255,255,0.13)',
    shadow: false,
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${compact ? 25 : 32}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, metric.value, width - 44), x + 22, y + (compact ? 35 : 44))

  ctx.fillStyle = accentColor
  ctx.font = `900 ${compact ? 15 : 18}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, String(metric.label || '').toUpperCase(), width - 44), x + 22, y + height - 19)
}

function drawMetricGrid(ctx, metrics, x, y, width, options = {}) {
  const { columns = 2, gap = 18, itemHeight = 92, compact = false, accentColor = '#ef4444' } = options
  const itemWidth = (width - gap * (columns - 1)) / columns

  metrics.forEach((metric, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    drawMetricChip(ctx, metric, x + col * (itemWidth + gap), y + row * (itemHeight + gap), itemWidth, itemHeight, {
      compact,
      accentColor,
    })
  })

  return y + Math.ceil(metrics.length / columns) * itemHeight + Math.max(0, Math.ceil(metrics.length / columns) - 1) * gap
}

function drawBrand(ctx, iconImage, x, y, scale = 1, options = {}) {
  const { muted = false, label = 'treino registrado' } = options
  const iconSize = 68 * scale
  const radius = 18 * scale

  ctx.save()
  drawRoundRect(ctx, x, y, iconSize, iconSize, radius)
  ctx.fillStyle = muted ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.38)'
  ctx.fill()
  ctx.clip()

  if (iconImage) {
    ctx.drawImage(iconImage, x, y, iconSize, iconSize)
  } else {
    ctx.fillStyle = '#ef4444'
    ctx.font = `${42 * scale}px Inter, Arial, sans-serif`
    ctx.fillText('F', x + 22 * scale, y + 49 * scale)
  }

  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${28 * scale}px Inter, Arial, sans-serif`
  ctx.fillText('ForgeFlow', x + iconSize + 18 * scale, y + 31 * scale)
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = `800 ${18 * scale}px Inter, Arial, sans-serif`
  ctx.fillText(label, x + iconSize + 18 * scale, y + 58 * scale)
}

function seededRandom(seed) {
  const value = Math.sin(seed * 9999) * 10000
  return value - Math.floor(value)
}

function drawNoise(ctx, width, height, alpha = 0.035) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffffff'

  for (let i = 0; i < 260; i += 1) {
    const x = seededRandom(i + 1) * width
    const y = seededRandom(i + 77) * height
    const size = 1 + seededRandom(i + 313) * 2.2
    ctx.fillRect(x, y, size, size)
  }

  ctx.restore()
}

function drawCircuitLines(ctx, width, height, color = 'rgba(239,68,68,0.18)') {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.globalAlpha = 0.7

  for (let i = 0; i < 12; i += 1) {
    const y = 118 + i * 146
    ctx.beginPath()
    ctx.moveTo(70, y)
    ctx.lineTo(width * 0.28, y)
    ctx.lineTo(width * 0.41, y + 54)
    ctx.lineTo(width - 76, y + 54)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(width * 0.41, y + 54, 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function drawTopographicLines(ctx, width, height) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255,255,255,0.075)'
  ctx.lineWidth = 3

  const centers = [
    [width * 0.08, height * 0.25],
    [width * 0.92, height * 0.64],
    [width * 0.55, height * 0.06],
  ]

  centers.forEach(([cx, cy]) => {
    for (let i = 0; i < 10; i += 1) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, 110 + i * 54, 58 + i * 36, i * 0.08, 0, Math.PI * 2)
      ctx.stroke()
    }
  })

  ctx.restore()
}

function drawPremiumBackground(ctx, width, height, selectedBackground, accentSoftColor, accentColor) {
  const style = selectedBackground || 'forgeRed'
  const bg = ctx.createLinearGradient(0, 0, width, height)

  if (style === 'obsidian') {
    bg.addColorStop(0, '#05070b')
    bg.addColorStop(0.54, '#12151c')
    bg.addColorStop(1, '#020203')
  } else if (style === 'carbonGrid') {
    bg.addColorStop(0, '#07090d')
    bg.addColorStop(0.48, '#171a1f')
    bg.addColorStop(1, '#050505')
  } else if (style === 'ember') {
    bg.addColorStop(0, '#190804')
    bg.addColorStop(0.52, '#20100b')
    bg.addColorStop(1, '#050404')
  } else if (style === 'neonFlow') {
    bg.addColorStop(0, '#020914')
    bg.addColorStop(0.46, '#101827')
    bg.addColorStop(1, '#030506')
  } else if (style === 'nightPr') {
    bg.addColorStop(0, '#10081f')
    bg.addColorStop(0.5, '#17111f')
    bg.addColorStop(1, '#050408')
  } else if (style === 'topoLines') {
    bg.addColorStop(0, '#061012')
    bg.addColorStop(0.48, '#121719')
    bg.addColorStop(1, '#030505')
  } else if (style === 'steel') {
    bg.addColorStop(0, '#151922')
    bg.addColorStop(0.5, '#2a2f38')
    bg.addColorStop(1, '#05070a')
  } else if (style === 'aurora') {
    bg.addColorStop(0, '#07111f')
    bg.addColorStop(0.42, '#12241d')
    bg.addColorStop(1, '#080611')
  } else if (style === 'blackMarble') {
    bg.addColorStop(0, '#070707')
    bg.addColorStop(0.5, '#151515')
    bg.addColorStop(1, '#020202')
  } else if (style === 'redSmoke') {
    bg.addColorStop(0, '#140506')
    bg.addColorStop(0.56, '#121113')
    bg.addColorStop(1, '#040404')
  } else if (style === 'gymLight') {
    bg.addColorStop(0, '#18100d')
    bg.addColorStop(0.48, '#111827')
    bg.addColorStop(1, '#050505')
  } else {
    bg.addColorStop(0, '#05070b')
    bg.addColorStop(0.48, '#151518')
    bg.addColorStop(1, '#070707')
  }

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  const topGlow = ctx.createRadialGradient(width * 0.78, height * 0.14, 20, width * 0.78, height * 0.14, width * 0.78)
  topGlow.addColorStop(0, style === 'nightPr' ? 'rgba(168,85,247,0.38)' : style === 'aurora' ? 'rgba(34,211,238,0.25)' : accentSoftColor)
  topGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = topGlow
  ctx.fillRect(0, 0, width, height)

  const lowGlow = ctx.createRadialGradient(width * 0.16, height * 0.88, 30, width * 0.16, height * 0.88, width * 0.72)
  lowGlow.addColorStop(0, style === 'ember' ? 'rgba(249,115,22,0.32)' : style === 'aurora' ? 'rgba(74,222,128,0.16)' : 'rgba(255,255,255,0.055)')
  lowGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = lowGlow
  ctx.fillRect(0, 0, width, height)

  if (style === 'carbonGrid') {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.045)'
    ctx.lineWidth = 2
    const step = 72
    for (let x = -step; x < width + step; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + height * 0.22, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  if (style === 'neonFlow') {
    drawCircuitLines(ctx, width, height, 'rgba(14,165,255,0.16)')
    drawCircuitLines(ctx, width, height, 'rgba(239,68,68,0.12)')
  }

  if (style === 'topoLines') drawTopographicLines(ctx, width, height)

  if (style === 'blackMarble') {
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.065)'
    ctx.lineWidth = 4
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath()
      const startY = height * seededRandom(i + 20)
      ctx.moveTo(-40, startY)
      for (let x = 0; x <= width + 80; x += 120) {
        const y = startY + Math.sin((x + i * 90) / 150) * 48 + (seededRandom(i + x) - 0.5) * 70
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  if (style === 'redSmoke' || style === 'gymLight') {
    ctx.save()
    for (let i = 0; i < 7; i += 1) {
      const cx = width * seededRandom(i + 40)
      const cy = height * seededRandom(i + 82)
      const r = width * (0.12 + seededRandom(i + 71) * 0.18)
      const smoke = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      smoke.addColorStop(0, style === 'gymLight' ? 'rgba(255,255,255,0.09)' : 'rgba(239,68,68,0.14)')
      smoke.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = smoke
      ctx.fillRect(0, 0, width, height)
    }
    ctx.restore()
  }

  ctx.save()
  ctx.translate(width * 0.56, -height * 0.06)
  ctx.rotate(0.19)
  drawRoundRect(ctx, 0, 0, width * 0.44, height * 1.08, 76)
  ctx.fillStyle = style === 'nightPr' ? 'rgba(168,85,247,0.14)' : 'rgba(255,255,255,0.04)'
  ctx.fill()
  ctx.restore()

  drawNoise(ctx, width, height)

  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, height * 0.72)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.42)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(width * 0.08, height * 0.2)
  ctx.bezierCurveTo(width * 0.4, height * 0.08, width * 0.64, height * 0.4, width * 0.94, height * 0.26)
  ctx.stroke()
  ctx.restore()
}

function getPhotoDrawBox(image, canvasWidth, canvasHeight, transform = DEFAULT_PHOTO_TRANSFORM) {
  const fit = transform.fit === 'contain' ? 'contain' : 'cover'
  const baseScale = fit === 'contain'
    ? Math.min(canvasWidth / image.width, canvasHeight / image.height)
    : Math.max(canvasWidth / image.width, canvasHeight / image.height)
  const scale = clamp(safeNumber(transform.scale) || 1, PHOTO_MIN_SCALE, PHOTO_MAX_SCALE)
  const finalScale = baseScale * scale
  const width = image.width * finalScale
  const height = image.height * finalScale

  return {
    x: (canvasWidth - width) / 2 + safeNumber(transform.x),
    y: (canvasHeight - height) / 2 + safeNumber(transform.y),
    width,
    height,
    fit,
    scale,
  }
}

function clampPhotoTransform(transform, photo, canvasWidth, canvasHeight) {
  if (!photo?.width || !photo?.height) {
    return {
      ...DEFAULT_PHOTO_TRANSFORM,
      ...transform,
      scale: clamp(safeNumber(transform?.scale) || 1, PHOTO_MIN_SCALE, PHOTO_MAX_SCALE),
    }
  }

  const imageLike = { width: photo.width, height: photo.height }
  const next = {
    ...DEFAULT_PHOTO_TRANSFORM,
    ...transform,
    scale: clamp(safeNumber(transform?.scale) || 1, PHOTO_MIN_SCALE, PHOTO_MAX_SCALE),
    fit: transform?.fit === 'contain' ? 'contain' : 'cover',
  }
  const box = getPhotoDrawBox(imageLike, canvasWidth, canvasHeight, next)
  const overflowX = Math.max(0, (box.width - canvasWidth) / 2)
  const overflowY = Math.max(0, (box.height - canvasHeight) / 2)

  return {
    ...next,
    x: clamp(safeNumber(next.x), -overflowX, overflowX),
    y: clamp(safeNumber(next.y), -overflowY, overflowY),
  }
}

function drawPhotoBackground(ctx, image, canvasWidth, canvasHeight, photoTransform = DEFAULT_PHOTO_TRANSFORM) {
  const transform = {
    ...DEFAULT_PHOTO_TRANSFORM,
    ...photoTransform,
  }

  if (transform.fit === 'contain') {
    const coverBox = getPhotoDrawBox(image, canvasWidth, canvasHeight, { x: 0, y: 0, scale: 1, fit: 'cover' })
    ctx.save()
    ctx.globalAlpha = 0.34
    ctx.drawImage(image, coverBox.x, coverBox.y, coverBox.width, coverBox.height)
    ctx.restore()

    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
  }

  const box = getPhotoDrawBox(image, canvasWidth, canvasHeight, transform)
  ctx.drawImage(image, box.x, box.y, box.width, box.height)

  const photoOverlay = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  photoOverlay.addColorStop(0, 'rgba(0,0,0,0.06)')
  photoOverlay.addColorStop(0.36, 'rgba(0,0,0,0.10)')
  photoOverlay.addColorStop(0.7, 'rgba(0,0,0,0.18)')
  photoOverlay.addColorStop(1, 'rgba(0,0,0,0.46)')
  ctx.fillStyle = photoOverlay
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)
}

function getMetricsForLevel(stats, infoLevel) {
  const base = [
    { label: 'Duração', value: stats.durationLabel },
    { label: 'Data', value: stats.dateShortLabel },
  ]

  if (infoLevel === 'light') return base

  const medium = [
    { label: 'Duração', value: stats.durationLabel },
    { label: 'Volume', value: stats.volumeLabel },
    { label: 'Exercícios', value: String(stats.exerciseCount) },
    { label: 'PRs', value: String(stats.prCount) },
  ]

  if (infoLevel === 'medium') return medium

  return [
    ...medium,
    { label: 'Séries', value: String(stats.completedSetCount) },
    { label: 'Local', value: stats.locationLabel || 'Sem local' },
  ]
}

function getVisibleMetrics(stats, infoLevel, maxCount) {
  return getMetricsForLevel(stats, infoLevel).slice(0, maxCount)
}

function drawFooter(ctx, width, height, pad, text = 'Built with ForgeFlow') {
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '850 23px Inter, Arial, sans-serif'
  ctx.fillText(truncateText(ctx, text, width - pad * 2), pad, height - pad)
}


function clampOverlayTransform(transform, canvasWidth, canvasHeight) {
  const next = {
    ...DEFAULT_OVERLAY_TRANSFORM,
    ...transform,
    scale: clamp(safeNumber(transform?.scale) || 1, OVERLAY_MIN_SCALE, OVERLAY_MAX_SCALE),
  }

  return {
    ...next,
    x: clamp(safeNumber(next.x), -canvasWidth * 0.42, canvasWidth * 0.42),
    y: clamp(safeNumber(next.y), -canvasHeight * 0.42, canvasHeight * 0.42),
  }
}

function drawStickerPill(ctx, text, x, y, options = {}) {
  const {
    fontSize = 26,
    height = 62,
    padX = 24,
    maxWidth = 540,
    color = '#ffffff',
    fill = 'rgba(8,10,14,0.76)',
    stroke = 'rgba(255,255,255,0.18)',
    align = 'left',
  } = options

  ctx.save()
  ctx.font = `950 ${fontSize}px Inter, Arial, sans-serif`
  const width = Math.min(maxWidth, Math.max(height, ctx.measureText(text).width + padX * 2))
  const drawX = align === 'right' ? x - width : x
  drawRoundRect(ctx, drawX, y, width, height, height / 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fillText(truncateText(ctx, text, width - padX * 2), drawX + padX, y + height / 2 + fontSize * 0.34)
  ctx.restore()

  return { x: drawX, y, width, height }
}

function drawStickerMetric(ctx, metric, x, y, options = {}) {
  const {
    width = 238,
    height = 112,
    accentColor = '#ef4444',
    compact = false,
    fill = 'rgba(7,9,13,0.74)',
    valueSize = compact ? 28 : 38,
    labelSize = compact ? 15 : 18,
  } = options

  drawGlassPanel(ctx, x, y, width, height, compact ? 28 : 34, {
    fill,
    stroke: 'rgba(255,255,255,0.18)',
    shadow: true,
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${valueSize}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, metric.value, width - 38), x + 20, y + height * 0.48)
  ctx.fillStyle = accentColor
  ctx.font = `950 ${labelSize}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, String(metric.label || '').toUpperCase(), width - 38), x + 20, y + height - 22)
}

function getCoreStickerMetrics(stats, infoLevel, maxCount = 3) {
  const metrics = getMetricsForLevel(stats, infoLevel)
  const prioritized = [
    metrics.find((item) => item.label === 'Duração'),
    metrics.find((item) => item.label === 'Volume'),
    metrics.find((item) => item.label === 'PRs'),
    metrics.find((item) => item.label === 'Exercícios'),
    metrics.find((item) => item.label === 'Séries'),
  ].filter(Boolean)

  return prioritized.slice(0, maxCount)
}

function drawTinyBrandSticker(ctx, iconImage, x, y, options = {}) {
  const { scale = 1, label = 'ForgeFlow' } = options
  const width = 250 * scale
  const height = 68 * scale
  const iconSize = 46 * scale

  drawGlassPanel(ctx, x, y, width, height, height / 2, {
    fill: 'rgba(5,7,10,0.68)',
    stroke: 'rgba(255,255,255,0.16)',
    shadow: true,
  })

  ctx.save()
  drawRoundRect(ctx, x + 13 * scale, y + 11 * scale, iconSize, iconSize, 14 * scale)
  ctx.fillStyle = 'rgba(239,68,68,0.22)'
  ctx.fill()
  ctx.clip()
  if (iconImage) {
    ctx.drawImage(iconImage, x + 13 * scale, y + 11 * scale, iconSize, iconSize)
  }
  ctx.restore()

  ctx.fillStyle = '#fff'
  ctx.font = `950 ${22 * scale}px Inter, Arial, sans-serif`
  ctx.fillText(label, x + 70 * scale, y + 39 * scale)
  ctx.fillStyle = 'rgba(255,255,255,0.56)'
  ctx.font = `850 ${13 * scale}px Inter, Arial, sans-serif`
  ctx.fillText('workout sticker', x + 70 * scale, y + 56 * scale)
}

function drawPhotoStoryStickerOverlay(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 70 : 54
  const clusterW = isStory ? width - pad * 2 : width - pad * 2
  const metricCount = isStory ? 3 : 3
  const metrics = getCoreStickerMetrics(stats, infoLevel, metricCount)
  const chipGap = isStory ? 16 : 12
  const chipH = isStory ? 92 : 76
  const chipW = (clusterW - chipGap * (metrics.length - 1)) / Math.max(1, metrics.length)
  const quoteH = isStory ? 178 : 132
  const startY = height - (isStory ? 455 : 315)

  drawTinyBrandSticker(ctx, iconImage, pad, startY - (isStory ? 88 : 74), { scale: isStory ? 1 : 0.78 })

  drawGlassPanel(ctx, pad, startY, clusterW, quoteH, isStory ? 44 : 34, {
    fill: 'rgba(5,7,10,0.60)',
    stroke: 'rgba(255,255,255,0.18)',
    shadow: true,
  })

  ctx.fillStyle = '#fff'
  ctx.font = `950 ${isStory ? 40 : 30}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, caption || 'Mais um treino concluído.', pad + 30, startY + (isStory ? 58 : 44), clusterW - 60, isStory ? 48 : 36, 2)

  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 22 : 17}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, stats.workoutName.toUpperCase(), clusterW - 60), pad + 30, startY + quoteH - 30)

  metrics.forEach((metric, index) => {
    drawStickerMetric(ctx, metric, pad + index * (chipW + chipGap), startY + quoteH + (isStory ? 18 : 14), {
      width: chipW,
      height: chipH,
      accentColor,
      compact: true,
    })
  })
}

function drawHeroPrStickerOverlay(ctx, stats, options) {
  const { width, height, caption, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 72 : 58
  const hasPr = stats.prCount > 0
  const cardW = width - pad * 2
  const cardH = isStory ? 310 : 222
  const cardX = pad
  const cardY = isStory ? height - 650 : height - 452
  const badgeSize = isStory ? 188 : 132
  const contentX = cardX + badgeSize + (isStory ? 34 : 24)
  const contentW = cardW - badgeSize - (isStory ? 68 : 50)
  const visiblePrs = hasPr ? stats.prs.slice(0, isStory ? 2 : 1) : []

  drawTinyBrandSticker(ctx, iconImage, pad, cardY - (isStory ? 96 : 74), {
    scale: isStory ? 0.92 : 0.72,
    label: hasPr ? 'Hero PR' : 'Treino feito',
  })

  drawGlassPanel(ctx, cardX, cardY, cardW, cardH, isStory ? 58 : 42, {
    fill: hasPr ? 'rgba(22,14,4,0.76)' : 'rgba(7,9,13,0.72)',
    stroke: hasPr ? 'rgba(250,204,21,0.42)' : 'rgba(255,255,255,0.18)',
    shadow: true,
  })

  ctx.save()
  const badgeX = cardX + (isStory ? 30 : 22)
  const badgeY = cardY + (cardH - badgeSize) / 2
  const gradient = ctx.createRadialGradient(
    badgeX + badgeSize * 0.35,
    badgeY + badgeSize * 0.3,
    badgeSize * 0.12,
    badgeX + badgeSize * 0.5,
    badgeY + badgeSize * 0.5,
    badgeSize * 0.62,
  )
  gradient.addColorStop(0, hasPr ? 'rgba(254,240,138,0.96)' : 'rgba(239,68,68,0.96)')
  gradient.addColorStop(1, hasPr ? 'rgba(180,83,9,0.94)' : 'rgba(127,29,29,0.94)')
  drawRoundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, badgeSize * 0.28)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.24)'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = hasPr ? '#1f1304' : '#fff'
  ctx.font = `950 ${isStory ? 66 : 46}px Inter, Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(hasPr ? String(stats.prCount) : '✓', badgeX + badgeSize / 2, badgeY + badgeSize * 0.53)
  ctx.font = `950 ${isStory ? 25 : 18}px Inter, Arial, sans-serif`
  ctx.fillText(hasPr ? `PR${stats.prCount > 1 ? 's' : ''}` : 'OK', badgeX + badgeSize / 2, badgeY + badgeSize * 0.73)
  ctx.textAlign = 'left'
  ctx.restore()

  ctx.fillStyle = hasPr ? '#fde68a' : accentColor
  ctx.font = `950 ${isStory ? 23 : 17}px Inter, Arial, sans-serif`
  ctx.fillText(hasPr ? 'NOVO RECORDE' : 'TREINO CONCLUÍDO', contentX, cardY + (isStory ? 66 : 50))

  ctx.fillStyle = '#fff'
  ctx.font = `950 ${isStory ? 42 : 30}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, hasPr ? 'Evolução registrada.' : 'Mais uma sessão paga.', contentX, cardY + (isStory ? 122 : 88), contentW, isStory ? 48 : 36, 2)

  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = `850 ${isStory ? 23 : 17}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, hasPr ? getPrText(stats.prs[0]) : caption, contentX, cardY + cardH - (isStory ? 76 : 55), contentW, isStory ? 30 : 22, 2)

  const listY = cardY + cardH + (isStory ? 18 : 14)
  visiblePrs.slice(1).forEach((item, index) => {
    drawStickerPill(ctx, getPrText(item), cardX, listY + index * (isStory ? 68 : 52), {
      maxWidth: cardW,
      fontSize: isStory ? 22 : 17,
      height: isStory ? 54 : 42,
      fill: 'rgba(7,9,13,0.70)',
      stroke: 'rgba(250,204,21,0.22)',
      color: '#fde68a',
    })
  })

  if (hasPr && stats.prs.length > visiblePrs.length) {
    drawStickerPill(ctx, `+${stats.prs.length - visiblePrs.length} PRs escondidos`, cardX, listY + Math.max(0, visiblePrs.length - 1) * (isStory ? 68 : 52), {
      maxWidth: isStory ? 330 : 245,
      fontSize: isStory ? 21 : 16,
      height: isStory ? 52 : 40,
      fill: 'rgba(250,204,21,0.17)',
      stroke: 'rgba(250,204,21,0.30)',
      color: '#fde68a',
    })
  }
}

function drawPerformanceStickerOverlay(ctx, stats, options) {
  const { width, height, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 68 : 52
  const cardW = isStory ? width - pad * 2 : width - pad * 2
  const cardH = isStory ? 430 : 305
  const cardX = pad
  const cardY = height - (isStory ? 610 : 430)

  drawGlassPanel(ctx, cardX, cardY, cardW, cardH, isStory ? 50 : 38, {
    fill: 'rgba(5,8,14,0.72)',
    stroke: 'rgba(255,255,255,0.18)',
    shadow: true,
  })

  drawTinyBrandSticker(ctx, iconImage, cardX + 26, cardY + 24, { scale: isStory ? 0.82 : 0.64, label: 'Performance' })

  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 22 : 17}px Inter, Arial, sans-serif`
  ctx.fillText('VOLUME TOTAL', cardX + 32, cardY + (isStory ? 132 : 98))
  ctx.fillStyle = '#fff'
  ctx.font = `950 ${isStory ? 74 : 52}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, stats.volumeLabel, cardW - 64), cardX + 32, cardY + (isStory ? 208 : 152))

  const metrics = getCoreStickerMetrics(stats, infoLevel, 4).filter((metric) => metric.label !== 'Volume').slice(0, 3)
  const chipW = (cardW - 64 - 18 * 2) / 3
  const chipY = cardY + (isStory ? 270 : 198)
  metrics.forEach((metric, index) => {
    drawStickerMetric(ctx, metric, cardX + 32 + index * (chipW + 18), chipY, {
      width: chipW,
      height: isStory ? 102 : 78,
      accentColor,
      compact: true,
      fill: 'rgba(255,255,255,0.072)',
    })
  })

  const best = stats.topWeightSet ? getSetLabel(stats.topWeightSet) : stats.workoutName
  drawStickerPill(ctx, best, cardX + 32, cardY + cardH + (isStory ? 20 : 14), {
    maxWidth: cardW - 64,
    fontSize: isStory ? 23 : 18,
    height: isStory ? 58 : 46,
    fill: 'rgba(239,68,68,0.74)',
    stroke: 'rgba(255,255,255,0.22)',
  })
}

function drawEditorialStickerOverlay(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 76 : 60
  const cardW = isStory ? width - pad * 2 : width - pad * 2
  const cardH = isStory ? 390 : 282
  const cardX = pad
  const cardY = height - (isStory ? 560 : 392)

  drawGlassPanel(ctx, cardX, cardY, cardW, cardH, isStory ? 46 : 36, {
    fill: 'rgba(255,255,255,0.92)',
    stroke: 'rgba(255,255,255,0.78)',
    shadow: true,
  })

  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 24 : 18}px Inter, Arial, sans-serif`
  ctx.fillText('FORGEFLOW NOTE', cardX + 34, cardY + (isStory ? 58 : 44))

  ctx.fillStyle = '#0f1115'
  ctx.font = `950 ${isStory ? 48 : 34}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, caption || 'Disciplina acima da motivação.', cardX + 34, cardY + (isStory ? 126 : 94), cardW - 68, isStory ? 58 : 42, isStory ? 3 : 2)

  ctx.fillStyle = 'rgba(15,17,21,0.68)'
  ctx.font = `850 ${isStory ? 26 : 19}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, `${stats.workoutName} • ${stats.durationLabel}`, cardW - 68), cardX + 34, cardY + cardH - (isStory ? 52 : 40))

  const metrics = getCoreStickerMetrics(stats, infoLevel, 2)
  const chipY = cardY + cardH + (isStory ? 18 : 14)
  metrics.forEach((metric, index) => {
    drawStickerPill(ctx, `${metric.value} ${metric.label}`, index === 0 ? cardX : width - pad, chipY + index * 0, {
      align: index === 0 ? 'left' : 'right',
      maxWidth: isStory ? 340 : 245,
      fontSize: isStory ? 22 : 17,
      height: isStory ? 54 : 42,
      fill: 'rgba(8,10,14,0.70)',
      color: '#fff',
    })
  })

  drawTinyBrandSticker(ctx, iconImage, cardX, cardY - (isStory ? 86 : 68), { scale: isStory ? 0.82 : 0.64 })
}

function drawDarkGlassStickerOverlay(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 70 : 54
  const startY = height - (isStory ? 640 : 455)
  const metrics = getCoreStickerMetrics(stats, infoLevel, 4)

  drawTinyBrandSticker(ctx, iconImage, pad, startY - (isStory ? 92 : 72), { scale: isStory ? 0.9 : 0.7, label: 'Dark Glass' })

  drawStickerPill(ctx, stats.prCount > 0 ? `${stats.prCount} PR${stats.prCount > 1 ? 's' : ''} no treino` : 'Treino registrado', width - pad, startY - (isStory ? 92 : 70), {
    align: 'right',
    maxWidth: isStory ? 380 : 280,
    fontSize: isStory ? 24 : 18,
    height: isStory ? 60 : 46,
    fill: 'rgba(239,68,68,0.78)',
    stroke: 'rgba(255,255,255,0.22)',
  })

  drawGlassPanel(ctx, pad, startY, width - pad * 2, isStory ? 215 : 150, isStory ? 42 : 32, {
    fill: 'rgba(7,9,13,0.66)',
    stroke: 'rgba(255,255,255,0.18)',
    shadow: true,
  })

  ctx.fillStyle = '#fff'
  ctx.font = `950 ${isStory ? 38 : 28}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, stats.workoutName, pad + 30, startY + (isStory ? 62 : 46), width - pad * 2 - 60, isStory ? 46 : 34, 2)

  ctx.fillStyle = 'rgba(255,255,255,0.70)'
  ctx.font = `850 ${isStory ? 24 : 18}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, caption, pad + 30, startY + (isStory ? 160 : 112), width - pad * 2 - 60, isStory ? 32 : 24, 1)

  const gridY = startY + (isStory ? 240 : 170)
  const gap = isStory ? 16 : 12
  const chipW = (width - pad * 2 - gap) / 2
  metrics.slice(0, 4).forEach((metric, index) => {
    const x = pad + (index % 2) * (chipW + gap)
    const y = gridY + Math.floor(index / 2) * (isStory ? 108 : 82)
    drawStickerMetric(ctx, metric, x, y, {
      width: chipW,
      height: isStory ? 92 : 70,
      accentColor,
      compact: true,
      fill: 'rgba(255,255,255,0.075)',
    })
  })
}

function drawStickerOverlayContent(ctx, stats, options) {
  if (options.template === 'heroPr') {
    drawHeroPrStickerOverlay(ctx, stats, options)
    return
  }

  if (options.template === 'performance') {
    drawPerformanceStickerOverlay(ctx, stats, options)
    return
  }

  if (options.template === 'editorial') {
    drawEditorialStickerOverlay(ctx, stats, options)
    return
  }

  if (options.template === 'darkGlass') {
    drawDarkGlassStickerOverlay(ctx, stats, options)
    return
  }

  drawPhotoStoryStickerOverlay(ctx, stats, options)
}

function drawTransformedOverlay(ctx, stats, options) {
  const { width, height, overlayTransform } = options
  const transform = clampOverlayTransform(overlayTransform, width, height)

  ctx.save()
  ctx.translate(width / 2 + transform.x, height / 2 + transform.y)
  ctx.scale(transform.scale, transform.scale)
  ctx.translate(-width / 2, -height / 2)
  drawStickerOverlayContent(ctx, stats, options)
  ctx.restore()
}


function getStickerBottomTarget(format, canvasWidth, canvasHeight) {
  if (format === 'story') return canvasHeight - 270
  return canvasHeight - 140
}

function getStickerOverlayBounds(template, format, stats = {}) {
  const selectedFormat = SHARE_FORMATS.find((item) => item.id === format) || SHARE_FORMATS[0]
  const { width, height } = selectedFormat
  const isStory = format === 'story'
  const pad = isStory ? 70 : 54

  if (template === 'heroPr') {
    const cardW = isStory ? width - pad * 2 : width - pad * 2
    const cardH = isStory ? 310 : 222
    const cardY = isStory ? height - 650 : height - 452
    const itemCount = Math.min(stats?.prCount > 0 ? 2 : 1, isStory ? 2 : 1)
    const extraRow = stats?.prCount > itemCount ? 1 : 0
    return {
      left: pad,
      top: cardY - (isStory ? 96 : 74),
      right: pad + cardW,
      bottom: cardY + cardH + (itemCount + extraRow) * (isStory ? 70 : 54) + (isStory ? 22 : 18),
    }
  }

  if (template === 'performance') {
    const cardW = width - pad * 2
    const cardH = isStory ? 430 : 305
    const cardY = height - (isStory ? 610 : 430)
    return {
      left: pad,
      top: cardY,
      right: pad + cardW,
      bottom: cardY + cardH + (isStory ? 84 : 62),
    }
  }

  if (template === 'editorial') {
    const cardW = width - pad * 2
    const cardH = isStory ? 390 : 282
    const cardY = height - (isStory ? 560 : 392)
    return {
      left: pad,
      top: cardY - (isStory ? 90 : 70),
      right: pad + cardW,
      bottom: cardY + cardH + (isStory ? 80 : 58),
    }
  }

  if (template === 'darkGlass') {
    const startY = height - (isStory ? 640 : 455)
    const metricRows = 2
    return {
      left: pad,
      top: startY - (isStory ? 98 : 76),
      right: width - pad,
      bottom: startY + (isStory ? 240 : 170) + metricRows * (isStory ? 108 : 82),
    }
  }

  const quoteH = isStory ? 178 : 132
  const chipH = isStory ? 92 : 76
  const startY = height - (isStory ? 455 : 315)
  return {
    left: pad,
    top: startY - (isStory ? 92 : 76),
    right: width - pad,
    bottom: startY + quoteH + (isStory ? 18 : 14) + chipH,
  }
}

function getTransformedOverlayBounds(bounds, transform, canvasWidth, canvasHeight) {
  const scale = clamp(safeNumber(transform?.scale) || 1, OVERLAY_MIN_SCALE, OVERLAY_MAX_SCALE)
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2
  const offsetX = safeNumber(transform?.x)
  const offsetY = safeNumber(transform?.y)

  return {
    left: centerX + offsetX + scale * (bounds.left - centerX),
    right: centerX + offsetX + scale * (bounds.right - centerX),
    top: centerY + offsetY + scale * (bounds.top - centerY),
    bottom: centerY + offsetY + scale * (bounds.bottom - centerY),
  }
}

function getOverlayTranslationForCenter(bounds, transform, canvasWidth, canvasHeight, axis) {
  const scale = clamp(safeNumber(transform?.scale) || 1, OVERLAY_MIN_SCALE, OVERLAY_MAX_SCALE)

  if (axis === 'x') {
    const boundsCenterX = (bounds.left + bounds.right) / 2
    return -scale * (boundsCenterX - canvasWidth / 2)
  }

  const boundsCenterY = (bounds.top + bounds.bottom) / 2
  return -scale * (boundsCenterY - canvasHeight / 2)
}

function drawPhotoStoryTemplate(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 76 : 58
  const contentWidth = width - pad * 2
  const bottomPad = isStory ? 94 : 66
  const chips = getVisibleMetrics(stats, infoLevel, isStory ? 4 : 3)
  const columns = isStory ? 2 : Math.min(3, chips.length)
  const chipHeight = isStory ? 94 : 84
  const chipGap = 18
  const rows = Math.ceil(chips.length / columns)
  const chipsHeight = rows * chipHeight + Math.max(0, rows - 1) * chipGap
  const footerY = height - bottomPad
  const chipsY = footerY - 58 - chipsHeight
  const phraseLines = isStory ? 2 : 1
  const phraseLineHeight = isStory ? 40 : 34
  const phraseY = chipsY - 42 - phraseLineHeight * phraseLines
  const titleLineHeight = isStory ? 88 : 66
  const titleMaxLines = isStory ? 2 : 2
  const titleY = Math.max(pad + 160, phraseY - 54 - titleLineHeight * titleMaxLines)

  drawBrand(ctx, iconImage, pad, pad, isStory ? 1 : 0.82, { label: 'share premium' })

  drawBadge(ctx, 'TREINO CONCLUÍDO', pad, titleY - 82, {
    color: accentColor,
    fill: 'rgba(0,0,0,0.32)',
    stroke: 'rgba(255,255,255,0.14)',
    fontSize: isStory ? 23 : 18,
    height: isStory ? 56 : 46,
    maxWidth: 420,
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${isStory ? 78 : 58}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, stats.workoutName, pad, titleY, contentWidth, titleLineHeight, titleMaxLines)

  if (caption && phraseY > titleY + titleLineHeight) {
    ctx.fillStyle = 'rgba(255,255,255,0.86)'
    ctx.font = `850 ${isStory ? 34 : 28}px Inter, Arial, sans-serif`
    drawWrappedText(ctx, caption, pad, phraseY, contentWidth, phraseLineHeight, phraseLines)
  }

  drawMetricGrid(ctx, chips, pad, chipsY, contentWidth, {
    columns,
    gap: chipGap,
    itemHeight: chipHeight,
    compact: !isStory,
    accentColor,
  })

  drawFooter(ctx, width, height, pad, `ForgeFlow • ${stats.completedSetCount} séries • ${stats.prCount} PRs`)
}

function drawHeroPrTemplate(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 76 : 58
  const contentWidth = width - pad * 2
  const prCount = stats.prCount
  const hasPr = prCount > 0
  const titleText = hasPr ? `${prCount} PR${prCount === 1 ? '' : 's'}` : 'Treino\nconcluído'
  const topY = isStory ? 104 : 64

  drawBrand(ctx, iconImage, pad, topY, isStory ? 1 : 0.82, { label: hasPr ? 'novo recorde' : 'treino finalizado' })

  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 270 : 170}px Inter, Arial, sans-serif`
  ctx.fillText('PR', pad - 18, isStory ? 575 : 360)
  ctx.restore()

  const heroY = isStory ? 560 : 330
  drawBadge(ctx, hasPr ? 'NOVO RECORDE' : 'SEM PR NESTE TREINO', pad, heroY - (isStory ? 138 : 95), {
    color: hasPr ? '#fde68a' : accentColor,
    fill: hasPr ? 'rgba(250,204,21,0.12)' : 'rgba(239,68,68,0.12)',
    stroke: hasPr ? 'rgba(250,204,21,0.24)' : 'rgba(239,68,68,0.22)',
    fontSize: isStory ? 26 : 20,
    height: isStory ? 62 : 48,
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${isStory ? 154 : 96}px Inter, Arial, sans-serif`
  if (hasPr) {
    ctx.fillText(titleText, pad, heroY)
  } else {
    drawWrappedText(ctx, titleText, pad, heroY - 78, contentWidth, isStory ? 128 : 82, 2)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = `850 ${isStory ? 33 : 25}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, stats.workoutName, pad, heroY + (hasPr ? 70 : 112), contentWidth, isStory ? 42 : 32, 1)

  const panelHeight = isStory ? 560 : 440
  const panelY = height - panelHeight - (isStory ? 94 : 58)
  drawGlassPanel(ctx, pad, panelY, contentWidth, panelHeight, isStory ? 54 : 42, {
    fill: 'rgba(8,10,14,0.72)',
    stroke: 'rgba(255,255,255,0.14)',
  })

  let cursorY = panelY + (isStory ? 78 : 56)
  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 31 : 24}px Inter, Arial, sans-serif`
  ctx.fillText(hasPr ? 'PRINCIPAIS RECORDES' : 'RESUMO DO TREINO', pad + 38, cursorY)
  cursorY += isStory ? 54 : 42

  if (hasPr) {
    const visiblePrs = stats.prs.slice(0, isStory ? 3 : 2)
    visiblePrs.forEach((pr, index) => {
      const itemY = cursorY + index * (isStory ? 84 : 68)
      ctx.fillStyle = index === 0 ? '#fde68a' : 'rgba(255,255,255,0.88)'
      ctx.font = `900 ${isStory ? 29 : 22}px Inter, Arial, sans-serif`
      ctx.fillText(truncateText(ctx, getPrText(pr), contentWidth - 94), pad + 38, itemY)
    })

    if (stats.prs.length > visiblePrs.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.58)'
      ctx.font = `850 ${isStory ? 27 : 21}px Inter, Arial, sans-serif`
      ctx.fillText(`+${stats.prs.length - visiblePrs.length} PRs registrados no histórico`, pad + 38, cursorY + visiblePrs.length * (isStory ? 84 : 68))
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = `850 ${isStory ? 34 : 26}px Inter, Arial, sans-serif`
    drawWrappedText(ctx, caption, pad + 38, cursorY, contentWidth - 76, isStory ? 44 : 34, isStory ? 3 : 2)
  }

  const metrics = getVisibleMetrics(stats, infoLevel, isStory ? 4 : 3)
  const metricY = panelY + panelHeight - (isStory ? 190 : 138)
  drawMetricGrid(ctx, metrics, pad + 38, metricY, contentWidth - 76, {
    columns: isStory ? 2 : 3,
    gap: 14,
    itemHeight: isStory ? 86 : 74,
    compact: true,
    accentColor,
  })

  drawFooter(ctx, width, height, pad, 'ForgeFlow • recordes protegidos contra texto sobreposto')
}

function drawPerformanceTemplate(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 72 : 56
  const contentWidth = width - pad * 2

  drawBrand(ctx, iconImage, pad, isStory ? 84 : 58, isStory ? 0.94 : 0.78, { label: 'performance report' })

  const headerY = isStory ? 290 : 190
  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 28 : 21}px Inter, Arial, sans-serif`
  ctx.fillText('RELATÓRIO DO TREINO', pad, headerY)

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${isStory ? 66 : 48}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, stats.workoutName, pad, headerY + (isStory ? 80 : 54), contentWidth, isStory ? 75 : 55, 2)

  const heroPanelY = isStory ? 560 : 360
  const heroPanelH = isStory ? 310 : 220
  drawGlassPanel(ctx, pad, heroPanelY, contentWidth, heroPanelH, isStory ? 50 : 38, {
    fill: 'rgba(255,255,255,0.072)',
    stroke: 'rgba(255,255,255,0.14)',
  })

  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.font = `900 ${isStory ? 24 : 18}px Inter, Arial, sans-serif`
  ctx.fillText('VOLUME TOTAL', pad + 36, heroPanelY + (isStory ? 62 : 48))
  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${isStory ? 92 : 68}px Inter, Arial, sans-serif`
  ctx.fillText(truncateText(ctx, stats.volumeLabel, contentWidth - 72), pad + 36, heroPanelY + (isStory ? 154 : 118))

  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = `850 ${isStory ? 29 : 22}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, caption, pad + 36, heroPanelY + (isStory ? 218 : 162), contentWidth - 72, isStory ? 38 : 30, 2)

  const metrics = getVisibleMetrics(stats, infoLevel, isStory ? 6 : 4)
  const metricsY = isStory ? 940 : 640
  drawMetricGrid(ctx, metrics, pad, metricsY, contentWidth, {
    columns: 2,
    gap: isStory ? 20 : 16,
    itemHeight: isStory ? 110 : 88,
    compact: !isStory,
    accentColor,
  })

  const listY = isStory ? 1375 : 910
  const availableH = height - listY - (isStory ? 176 : 120)
  if (availableH > 130) {
    drawGlassPanel(ctx, pad, listY, contentWidth, availableH, isStory ? 42 : 32, {
      fill: 'rgba(0,0,0,0.26)',
      stroke: 'rgba(255,255,255,0.11)',
      shadow: false,
    })

    ctx.fillStyle = accentColor
    ctx.font = `950 ${isStory ? 26 : 20}px Inter, Arial, sans-serif`
    ctx.fillText('EXERCÍCIOS PRINCIPAIS', pad + 32, listY + (isStory ? 58 : 44))

    const maxItems = isStory ? 4 : 2
    stats.topExercises.slice(0, maxItems).forEach((exercise, index) => {
      ctx.fillStyle = 'rgba(255,255,255,0.84)'
      ctx.font = `850 ${isStory ? 28 : 21}px Inter, Arial, sans-serif`
      ctx.fillText(truncateText(ctx, exercise, contentWidth - 64), pad + 32, listY + (isStory ? 112 : 86) + index * (isStory ? 42 : 32))
    })

    if (stats.topExercises.length > maxItems) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = `800 ${isStory ? 24 : 18}px Inter, Arial, sans-serif`
      ctx.fillText(`+${stats.topExercises.length - maxItems} exercícios`, pad + 32, listY + (isStory ? 112 : 86) + maxItems * (isStory ? 42 : 32))
    }
  }

  drawFooter(ctx, width, height, pad, `ForgeFlow • ${stats.dateShortLabel}`)
}

function drawEditorialTemplate(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 82 : 64
  const contentWidth = width - pad * 2
  const cardY = isStory ? 310 : 168
  const cardH = isStory ? 1050 : 710

  drawGlassPanel(ctx, pad, cardY, contentWidth, cardH, isStory ? 56 : 42, {
    fill: 'rgba(255,255,255,0.09)',
    stroke: 'rgba(255,255,255,0.16)',
  })

  drawBrand(ctx, iconImage, pad + 42, cardY + 48, isStory ? 0.86 : 0.68, { muted: true, label: 'editorial minimal' })

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${isStory ? 72 : 52}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, caption, pad + 42, cardY + (isStory ? 260 : 190), contentWidth - 84, isStory ? 84 : 62, isStory ? 4 : 3)

  const separatorY = cardY + cardH - (isStory ? 340 : 250)
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(pad + 42, separatorY)
  ctx.lineTo(width - pad - 42, separatorY)
  ctx.stroke()

  ctx.fillStyle = accentColor
  ctx.font = `950 ${isStory ? 29 : 22}px Inter, Arial, sans-serif`
  ctx.fillText('TREINO', pad + 42, separatorY + (isStory ? 68 : 50))

  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.font = `900 ${isStory ? 38 : 29}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, stats.workoutName, pad + 42, separatorY + (isStory ? 126 : 94), contentWidth - 84, isStory ? 46 : 36, 2)

  const metrics = getVisibleMetrics(stats, infoLevel, isStory ? 3 : 3)
  const metricY = cardY + cardH - (isStory ? 180 : 130)
  drawMetricGrid(ctx, metrics, pad + 42, metricY, contentWidth - 84, {
    columns: 3,
    gap: 12,
    itemHeight: isStory ? 88 : 72,
    compact: true,
    accentColor,
  })

  drawFooter(ctx, width, height, pad, 'ForgeFlow • disciplina acima da motivação')
}

function drawDarkGlassTemplate(ctx, stats, options) {
  const { width, height, caption, infoLevel, iconImage, accentColor, format } = options
  const isStory = format === 'story'
  const pad = isStory ? 72 : 54
  const contentWidth = width - pad * 2

  drawBrand(ctx, iconImage, pad, isStory ? 82 : 56, isStory ? 0.94 : 0.78, { label: 'dark glass' })

  const titlePanelY = isStory ? 280 : 176
  drawGlassPanel(ctx, pad, titlePanelY, contentWidth, isStory ? 360 : 250, isStory ? 52 : 40, {
    fill: 'rgba(255,255,255,0.075)',
    stroke: 'rgba(255,255,255,0.16)',
  })

  drawBadge(ctx, 'REGISTRO PREMIUM', pad + 34, titlePanelY + 38, {
    color: accentColor,
    fill: 'rgba(239,68,68,0.14)',
    stroke: 'rgba(239,68,68,0.26)',
    fontSize: isStory ? 23 : 18,
    height: isStory ? 54 : 42,
  })

  ctx.fillStyle = '#ffffff'
  ctx.font = `950 ${isStory ? 64 : 47}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, stats.workoutName, pad + 34, titlePanelY + (isStory ? 150 : 112), contentWidth - 68, isStory ? 74 : 54, 2)

  ctx.fillStyle = 'rgba(255,255,255,0.70)'
  ctx.font = `850 ${isStory ? 28 : 21}px Inter, Arial, sans-serif`
  drawWrappedText(ctx, caption, pad + 34, titlePanelY + (isStory ? 298 : 214), contentWidth - 68, isStory ? 36 : 28, 1)

  const metrics = getVisibleMetrics(stats, infoLevel, isStory ? 6 : 4)
  const metricsY = isStory ? 735 : 490
  drawMetricGrid(ctx, metrics, pad, metricsY, contentWidth, {
    columns: 2,
    gap: isStory ? 20 : 16,
    itemHeight: isStory ? 112 : 88,
    compact: !isStory,
    accentColor,
  })

  const lowerY = isStory ? 1275 : 850
  const lowerH = height - lowerY - (isStory ? 178 : 118)
  if (lowerH > 130) {
    drawGlassPanel(ctx, pad, lowerY, contentWidth, lowerH, isStory ? 46 : 34, {
      fill: 'rgba(0,0,0,0.28)',
      stroke: 'rgba(255,255,255,0.12)',
      shadow: false,
    })

    ctx.fillStyle = accentColor
    ctx.font = `950 ${isStory ? 27 : 20}px Inter, Arial, sans-serif`
    ctx.fillText(stats.prCount > 0 ? 'DESTAQUES DO TREINO' : 'RESUMO', pad + 34, lowerY + (isStory ? 58 : 44))

    const highlights = stats.prCount > 0
      ? stats.prs.slice(0, isStory ? 3 : 2).map(getPrText)
      : [
        `${stats.completedSetCount} séries concluídas`,
        `${stats.exerciseCount} exercícios registrados`,
        `${stats.volumeLabel} de volume total`,
      ]

    highlights.forEach((item, index) => {
      ctx.fillStyle = 'rgba(255,255,255,0.84)'
      ctx.font = `850 ${isStory ? 28 : 21}px Inter, Arial, sans-serif`
      ctx.fillText(truncateText(ctx, item, contentWidth - 68), pad + 34, lowerY + (isStory ? 116 : 88) + index * (isStory ? 45 : 34))
    })
  }

  drawFooter(ctx, width, height, pad, `ForgeFlow • ${stats.volumeLabel} • ${stats.durationLabel}`)
}

async function drawWorkoutShareCanvas(canvas, options) {
  const {
    session,
    meta,
    template,
    format,
    infoLevel,
    phrase,
    caption,
    backgroundMode,
    selectedBackground,
    userPhoto,
    photoTransform,
    overlayMode = 'fullCard',
    overlayTransform = DEFAULT_OVERLAY_TRANSFORM,
  } = options

  await waitForFonts()

  const ctx = canvas.getContext('2d')
  const stats = getWorkoutStats(session, meta)
  const selectedFormat = SHARE_FORMATS.find((item) => item.id === format) || SHARE_FORMATS[0]
  const selectedTemplate = SHARE_TEMPLATES.find((item) => item.id === template) || SHARE_TEMPLATES[0]
  const { width, height } = selectedFormat
  const accentColor = getShareAccentColor()
  const accentSoftColor = getShareAccentSoftColor()
  const safeCaption = String(phrase ?? caption ?? '').trim() || SHARE_PHRASES[0]

  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)

  let iconImage = null
  let photoImage = null

  try {
    iconImage = await loadShareImage(forgeflowIcon, { anonymous: true })
  } catch {
    // O texto da marca continua sendo desenhado sem o ícone.
  }

  if (backgroundMode === 'photo' && userPhoto?.src) {
    try {
      photoImage = await loadShareImage(userPhoto.src)
    } catch (error) {
      console.warn('Foto própria não pôde ser desenhada no canvas:', error)
      photoImage = null
    }
  }

  if (backgroundMode === 'photo' && photoImage) {
    drawPhotoBackground(ctx, photoImage, width, height, photoTransform)
  } else {
    drawPremiumBackground(ctx, width, height, selectedBackground, accentSoftColor, accentColor)
  }

  const templateOptions = {
    width,
    height,
    caption: safeCaption,
    infoLevel,
    iconImage,
    accentColor,
    accentSoftColor,
    template: selectedTemplate.id,
    format: selectedFormat.id,
    overlayTransform,
  }

  if (overlayMode === 'none') {
    return stats
  }

  if (overlayMode === 'stickers') {
    drawTransformedOverlay(ctx, stats, templateOptions)
  } else if (selectedTemplate.id === 'heroPr') {
    drawHeroPrTemplate(ctx, stats, templateOptions)
  } else if (selectedTemplate.id === 'performance') {
    drawPerformanceTemplate(ctx, stats, templateOptions)
  } else if (selectedTemplate.id === 'editorial') {
    drawEditorialTemplate(ctx, stats, templateOptions)
  } else if (selectedTemplate.id === 'darkGlass') {
    drawDarkGlassTemplate(ctx, stats, templateOptions)
  } else {
    drawPhotoStoryTemplate(ctx, stats, templateOptions)
  }

  return stats
}

function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível gerar a imagem.'))
        return
      }

      resolve(blob)
    }, type, quality)
  })
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

function getFileName(session = {}, template = 'photoStory', format = 'story', extension = 'png') {
  const rawName = String(session.workoutName || session.name || 'treino')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  const safeExtension = String(extension || 'png').replace(/^\./, '').toLowerCase()

  return `forgeflow-${rawName || 'treino'}-${template}-${format}.${safeExtension}`
}

function canShareImageFile(file) {
  return typeof navigator !== 'undefined' && Boolean(navigator.canShare?.({ files: [file] }))
}

function isMobileShareContext() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
}

function triggerImageDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 4500)
}

function openImageFallback(blob) {
  const url = URL.createObjectURL(blob)
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer')

  window.setTimeout(() => URL.revokeObjectURL(url), 30000)
  return Boolean(newWindow)
}

function getDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y)
}

function getCenter(pointA, pointB) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  }
}

function WorkoutShareStudio({ open, session, meta, onClose }) {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const activePointers = useRef(new Map())
  const gestureRef = useRef(null)
  const photoTransformRef = useRef(DEFAULT_PHOTO_TRANSFORM)
  const overlayTransformRef = useRef(DEFAULT_OVERLAY_TRANSFORM)
  const userPhotoRef = useRef(null)
  const selectedFormatRef = useRef(SHARE_FORMATS[0])
  const activeEditLayerRef = useRef('overlay')
  const previewFrameRef = useRef(0)
  const previewRedrawModeRef = useRef('full')
  const fastDrawInProgressRef = useRef(false)
  const fastDrawPendingRef = useRef(false)
  const baseCanvasRef = useRef(null)
  const baseCacheKeyRef = useRef('')
  const snapGuideRef = useRef({ x: false, y: false, bottom: false })

  const [template, setTemplate] = useState('photoStory')
  const [format, setFormat] = useState('story')
  const [infoLevel, setInfoLevel] = useState('medium')
  const [phraseId, setPhraseId] = useState(0)
  const [customCaption, setCustomCaption] = useState('')
  const [backgroundMode, setBackgroundMode] = useState('theme')
  const [selectedBackground, setSelectedBackground] = useState('forgeRed')
  const [overlayMode, setOverlayMode] = useState('stickers')
  const [activeEditLayer, setActiveEditLayer] = useState('overlay')
  const [userPhoto, setUserPhoto] = useState(null)
  const [photoTransform, setPhotoTransform] = useState(DEFAULT_PHOTO_TRANSFORM)
  const [overlayTransform, setOverlayTransform] = useState(DEFAULT_OVERLAY_TRANSFORM)
  const [snapGuide, setSnapGuide] = useState({ x: false, y: false, bottom: false })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  const selectedFormat = SHARE_FORMATS.find((item) => item.id === format) || SHARE_FORMATS[0]
  const selectedPhrase = SHARE_PHRASES[phraseId] || SHARE_PHRASES[0]
  const caption = customCaption.trim() || selectedPhrase
  const hasEditablePhoto = backgroundMode === 'photo' && Boolean(userPhoto?.src)
  const canEditPreview = hasEditablePhoto || overlayMode === 'stickers'
  const snapBottomPercent = `${(getStickerBottomTarget(selectedFormat.id, selectedFormat.width, selectedFormat.height) / selectedFormat.height) * 100}%`

  const stats = useMemo(() => {
    if (!session) return null
    return getWorkoutStats(session, meta)
  }, [meta, session])

  const shareText = useMemo(() => {
    if (!stats) return ''
    return buildShareText(stats, caption)
  }, [caption, stats])

  useEffect(() => {
    photoTransformRef.current = photoTransform
  }, [photoTransform])

  useEffect(() => {
    overlayTransformRef.current = overlayTransform
  }, [overlayTransform])

  useEffect(() => {
    activeEditLayerRef.current = activeEditLayer
  }, [activeEditLayer])

  useEffect(() => {
    userPhotoRef.current = userPhoto
  }, [userPhoto])

  useEffect(() => {
    selectedFormatRef.current = selectedFormat
  }, [selectedFormat])

  useEffect(() => () => {
    if (previewFrameRef.current) {
      window.cancelAnimationFrame(previewFrameRef.current)
      previewFrameRef.current = 0
    }
  }, [])

  useEffect(() => {
    if (!open || !session || !canvasRef.current) return undefined

    let active = true
    setReady(false)
    baseCacheKeyRef.current = ''

    drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto: userPhotoRef.current || userPhoto,
      photoTransform: photoTransformRef.current,
      overlayMode,
      overlayTransform: overlayTransformRef.current,
    })
      .then(() => {
        if (active) setReady(true)
      })
      .catch((error) => {
        console.error(error)
        if (active) {
          setStatus('Não foi possível montar a imagem agora.')
          setReady(false)
        }
      })

    return () => {
      active = false
    }
  }, [backgroundMode, caption, format, infoLevel, meta, open, overlayMode, overlayTransform, photoTransform, selectedBackground, session, template, userPhoto])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('ff-share-studio-open')

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.classList.remove('ff-share-studio-open')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setStatus('')
      setBusy(false)
      activePointers.current.clear()
      gestureRef.current = null
      setActiveEditLayer('overlay')
    }
  }, [open])

  useEffect(() => {
    if (!userPhoto || backgroundMode !== 'photo') return

    setPhotoTransform((current) => clampPhotoTransform(current, userPhoto, selectedFormat.width, selectedFormat.height))
  }, [backgroundMode, selectedFormat.height, selectedFormat.width, userPhoto])

  if (!open || !session || !stats) return null

  function getBaseCacheKey() {
    const photo = userPhotoRef.current
    const photoKey = photo?.src
      ? `${photo.name || 'photo'}:${photo.width || 0}x${photo.height || 0}:${String(photo.src).length}`
      : 'no-photo'
    const transform = photoTransformRef.current

    return [
      format,
      backgroundMode,
      selectedBackground,
      photoKey,
      Math.round(safeNumber(transform.x)),
      Math.round(safeNumber(transform.y)),
      Math.round((safeNumber(transform.scale) || 1) * 1000),
      transform.fit || 'cover',
    ].join('|')
  }

  async function ensurePreviewBaseCanvas() {
    const cacheKey = getBaseCacheKey()

    if (baseCanvasRef.current && baseCacheKeyRef.current === cacheKey) {
      return baseCanvasRef.current
    }

    const baseCanvas = baseCanvasRef.current || document.createElement('canvas')
    baseCanvasRef.current = baseCanvas

    await drawWorkoutShareCanvas(baseCanvas, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto: userPhotoRef.current,
      photoTransform: photoTransformRef.current,
      overlayMode: 'none',
      overlayTransform: overlayTransformRef.current,
    })

    baseCacheKeyRef.current = cacheKey
    return baseCanvas
  }

  async function drawStickerPreviewFast() {
    if (fastDrawInProgressRef.current) {
      fastDrawPendingRef.current = true
      return
    }

    fastDrawInProgressRef.current = true

    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const currentFormat = selectedFormatRef.current
      const baseCanvas = await ensurePreviewBaseCanvas()
      const ctx = canvas.getContext('2d')
      const accentColor = getShareAccentColor()
      const accentSoftColor = getShareAccentSoftColor()
      let iconImage = null

      try {
        iconImage = await loadShareImage(forgeflowIcon, { anonymous: true })
      } catch {
        // Sem ícone, mantém os textos.
      }

      canvas.width = currentFormat.width
      canvas.height = currentFormat.height
      ctx.clearRect(0, 0, currentFormat.width, currentFormat.height)
      ctx.drawImage(baseCanvas, 0, 0)

      drawTransformedOverlay(ctx, stats, {
        width: currentFormat.width,
        height: currentFormat.height,
        caption,
        infoLevel,
        iconImage,
        accentColor,
        accentSoftColor,
        template,
        format,
        overlayTransform: overlayTransformRef.current,
      })
    } finally {
      fastDrawInProgressRef.current = false
      if (fastDrawPendingRef.current) {
        fastDrawPendingRef.current = false
        schedulePreviewRedraw('overlay')
      }
    }
  }

  function drawPreviewWithRefs(options = {}) {
    if (!canvasRef.current) return

    if (options.fastOverlay && overlayMode === 'stickers') {
      drawStickerPreviewFast().catch((error) => {
        console.error(error)
      })
      return
    }

    drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto: userPhotoRef.current,
      photoTransform: photoTransformRef.current,
      overlayMode,
      overlayTransform: overlayTransformRef.current,
    }).catch((error) => {
      console.error(error)
    })
  }

  function schedulePreviewRedraw(mode = 'full') {
    if (mode === 'full') {
      previewRedrawModeRef.current = 'full'
    } else if (previewRedrawModeRef.current !== 'full') {
      previewRedrawModeRef.current = mode
    }

    if (previewFrameRef.current || typeof window === 'undefined') return

    previewFrameRef.current = window.requestAnimationFrame(() => {
      const redrawMode = previewRedrawModeRef.current
      previewFrameRef.current = 0
      previewRedrawModeRef.current = 'full'
      drawPreviewWithRefs({ fastOverlay: redrawMode === 'overlay' })
    })
  }

  function updateSnapGuide(nextGuide) {
    const normalized = {
      x: Boolean(nextGuide?.x),
      y: Boolean(nextGuide?.y),
      bottom: Boolean(nextGuide?.bottom),
    }
    const current = snapGuideRef.current

    if (current.x === normalized.x && current.y === normalized.y && current.bottom === normalized.bottom) return

    snapGuideRef.current = normalized
    setSnapGuide(normalized)
  }

  function applyStickerSnap(transform) {
    const currentFormat = selectedFormatRef.current
    const threshold = Math.max(22, Math.min(currentFormat.width, currentFormat.height) * 0.032)
    const next = {
      ...transform,
      scale: clamp(safeNumber(transform?.scale) || 1, OVERLAY_MIN_SCALE, OVERLAY_MAX_SCALE),
    }
    const guide = { x: false, y: false, bottom: false }
    const bounds = getStickerOverlayBounds(template, currentFormat.id, stats)
    let transformed = getTransformedOverlayBounds(bounds, next, currentFormat.width, currentFormat.height)
    const centerX = (transformed.left + transformed.right) / 2
    const centerY = (transformed.top + transformed.bottom) / 2
    const targetBottom = getStickerBottomTarget(currentFormat.id, currentFormat.width, currentFormat.height)

    if (Math.abs(centerX - currentFormat.width / 2) <= threshold) {
      next.x = getOverlayTranslationForCenter(bounds, next, currentFormat.width, currentFormat.height, 'x')
      guide.x = true
      transformed = getTransformedOverlayBounds(bounds, next, currentFormat.width, currentFormat.height)
    }

    if (Math.abs(centerY - currentFormat.height / 2) <= threshold) {
      next.y = getOverlayTranslationForCenter(bounds, next, currentFormat.width, currentFormat.height, 'y')
      guide.y = true
    } else if (Math.abs(transformed.bottom - targetBottom) <= threshold) {
      next.y += targetBottom - transformed.bottom
      guide.bottom = true
    }

    return { transform: next, guide }
  }

  function getCanvasPoint(event) {
    const rect = canvasRef.current?.getBoundingClientRect()
    const currentFormat = selectedFormatRef.current

    if (!rect || !currentFormat) {
      return { x: 0, y: 0 }
    }

    return {
      x: (event.clientX - rect.left) * (currentFormat.width / rect.width),
      y: (event.clientY - rect.top) * (currentFormat.height / rect.height),
    }
  }

  function getPointerSnapshot(event) {
    return {
      id: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      canvas: getCanvasPoint(event),
    }
  }

  function startGestureFromPointers() {
    const pointers = Array.from(activePointers.current.values())
    const layer = activeEditLayerRef.current === 'photo' && userPhotoRef.current?.src ? 'photo' : 'overlay'
    const currentTransform = layer === 'photo' ? photoTransformRef.current : overlayTransformRef.current
    const currentFormat = selectedFormatRef.current

    if (pointers.length === 1) {
      gestureRef.current = {
        type: 'drag',
        layer,
        pointerId: pointers[0].id,
        startPoint: pointers[0].canvas,
        startTransform: currentTransform,
      }
      return
    }

    if (pointers.length >= 2) {
      const first = pointers[0].canvas
      const second = pointers[1].canvas
      const startCenter = getCenter(first, second)
      const startTransform = currentTransform
      const imageCenter = {
        x: currentFormat.width / 2 + safeNumber(startTransform.x),
        y: currentFormat.height / 2 + safeNumber(startTransform.y),
      }

      gestureRef.current = {
        type: 'pinch',
        layer,
        startDistance: Math.max(1, getDistance(first, second)),
        startCenter,
        startTransform,
        imageCenter,
        centerOffset: {
          x: startCenter.x - imageCenter.x,
          y: startCenter.y - imageCenter.y,
        },
      }
    }
  }

  function applyPhotoTransform(nextTransform, options = {}) {
    const currentPhoto = userPhotoRef.current
    const currentFormat = selectedFormatRef.current
    const clamped = clampPhotoTransform(nextTransform, currentPhoto, currentFormat.width, currentFormat.height)
    photoTransformRef.current = clamped

    if (options.live) {
      schedulePreviewRedraw()
      return clamped
    }

    setPhotoTransform(clamped)
    schedulePreviewRedraw()
    return clamped
  }

  function applyOverlayTransform(nextTransform, options = {}) {
    const currentFormat = selectedFormatRef.current
    let transformToApply = nextTransform

    if (options.snap) {
      const snapped = applyStickerSnap(nextTransform)
      transformToApply = snapped.transform
      updateSnapGuide(snapped.guide)
    } else if (!options.keepGuide) {
      updateSnapGuide({ x: false, y: false, bottom: false })
    }

    const clamped = clampOverlayTransform(transformToApply, currentFormat.width, currentFormat.height)
    overlayTransformRef.current = clamped

    if (options.live) {
      schedulePreviewRedraw('overlay')
      return clamped
    }

    setOverlayTransform(clamped)
    schedulePreviewRedraw('overlay')
    return clamped
  }

  function applyLayerTransform(layer, nextTransform, options = {}) {
    if (layer === 'photo') {
      return applyPhotoTransform(nextTransform, options)
    }

    return applyOverlayTransform(nextTransform, options)
  }

  function handlePointerDown(event) {
    if (!canEditPreview) return

    if (activeEditLayer === 'photo' && !hasEditablePhoto) {
      setActiveEditLayer('overlay')
      activeEditLayerRef.current = 'overlay'
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    activePointers.current.set(event.pointerId, getPointerSnapshot(event))
    startGestureFromPointers()
  }

  function handlePointerMove(event) {
    if (!canEditPreview || !activePointers.current.has(event.pointerId)) return

    event.preventDefault()
    activePointers.current.set(event.pointerId, getPointerSnapshot(event))

    const gesture = gestureRef.current
    if (!gesture) return

    const pointers = Array.from(activePointers.current.values())

    if (gesture.type === 'drag' && pointers.length === 1) {
      const current = activePointers.current.get(gesture.pointerId)
      if (!current) return

      applyLayerTransform(gesture.layer, {
        ...gesture.startTransform,
        x: safeNumber(gesture.startTransform.x) + current.canvas.x - gesture.startPoint.x,
        y: safeNumber(gesture.startTransform.y) + current.canvas.y - gesture.startPoint.y,
      }, {
        live: true,
        snap: gesture.layer === 'overlay',
      })
      return
    }

    if (gesture.type === 'pinch' && pointers.length >= 2) {
      const first = pointers[0].canvas
      const second = pointers[1].canvas
      const currentCenter = getCenter(first, second)
      const distance = Math.max(1, getDistance(first, second))
      const minScale = gesture.layer === 'photo' ? PHOTO_MIN_SCALE : OVERLAY_MIN_SCALE
      const maxScale = gesture.layer === 'photo' ? PHOTO_MAX_SCALE : OVERLAY_MAX_SCALE
      const nextScale = clamp(safeNumber(gesture.startTransform.scale) * (distance / gesture.startDistance), minScale, maxScale)
      const ratio = nextScale / Math.max(minScale, safeNumber(gesture.startTransform.scale) || 1)
      const nextImageCenter = {
        x: currentCenter.x - gesture.centerOffset.x * ratio,
        y: currentCenter.y - gesture.centerOffset.y * ratio,
      }
      const currentFormat = selectedFormatRef.current

      applyLayerTransform(gesture.layer, {
        ...gesture.startTransform,
        scale: nextScale,
        x: nextImageCenter.x - currentFormat.width / 2,
        y: nextImageCenter.y - currentFormat.height / 2,
      }, { live: true })
    }
  }

  function handlePointerUp(event) {
    if (!activePointers.current.has(event.pointerId)) return

    event.preventDefault()
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    } catch {
      // O browser pode liberar automaticamente o capture.
    }

    activePointers.current.delete(event.pointerId)

    if (activePointers.current.size > 0) {
      startGestureFromPointers()
    } else {
      gestureRef.current = null
      setPhotoTransform(photoTransformRef.current)
      setOverlayTransform(overlayTransformRef.current)
      updateSnapGuide({ x: false, y: false, bottom: false })
    }
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus('Carregando foto...')
    setReady(false)

    try {
      const nextPhoto = await createUserPhotoFromFile(file)
      userPhotoRef.current = nextPhoto
      photoTransformRef.current = PHOTO_FIT_TRANSFORM
      overlayTransformRef.current = DEFAULT_OVERLAY_TRANSFORM
      setUserPhoto(nextPhoto)
      setBackgroundMode('photo')
      setOverlayMode('stickers')
      setActiveEditLayer('overlay')
      setPhotoTransform(PHOTO_FIT_TRANSFORM)
      setOverlayTransform(DEFAULT_OVERLAY_TRANSFORM)
      setStatus(isLikelyHeicFile(file) ? 'Foto HEIC convertida pelo Android e aplicada como fundo. As informações ficam em figurinhas por cima.' : 'Foto aplicada como fundo. As informações ficam em figurinhas por cima.')
    } catch (error) {
      console.error(error)
      setStatus(error?.message || 'Não foi possível carregar essa foto.')
    }
  }

  function handleClearPhoto() {
    setUserPhoto(null)
    setBackgroundMode('theme')
    setPhotoTransform(DEFAULT_PHOTO_TRANSFORM)
    setStatus('Foto removida. O card voltou para o fundo temático.')
  }

  function handleResetPhoto() {
    applyPhotoTransform(DEFAULT_PHOTO_TRANSFORM)
    setStatus('Enquadramento resetado.')
  }

  function handlePhotoFill() {
    applyPhotoTransform({ x: 0, y: 0, scale: 1, fit: 'cover' })
    setStatus('Foto preenchendo todo o card.')
  }

  function handlePhotoFit() {
    applyPhotoTransform({ x: 0, y: 0, scale: 1, fit: 'contain' })
    setStatus('Foto ajustada inteira no card, sem cortar o enquadramento principal.')
  }

  function handleResetOverlay() {
    applyOverlayTransform(DEFAULT_OVERLAY_TRANSFORM)
    setStatus('Figurinhas resetadas para a posição original.')
  }

  function handleOverlaySmaller() {
    applyOverlayTransform({ ...overlayTransformRef.current, scale: Math.max(OVERLAY_MIN_SCALE, safeNumber(overlayTransformRef.current.scale) - 0.12) })
  }

  function handleOverlayBigger() {
    applyOverlayTransform({ ...overlayTransformRef.current, scale: Math.min(OVERLAY_MAX_SCALE, safeNumber(overlayTransformRef.current.scale) + 0.12) })
  }

  async function getImageBlob(options = {}) {
    if (!canvasRef.current) throw new Error('Imagem indisponível.')

    const { mimeType = 'image/png', quality = 0.95 } = options

    await drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto: userPhotoRef.current || userPhoto,
      photoTransform: photoTransformRef.current,
      overlayMode,
      overlayTransform: overlayTransformRef.current,
    })

    return canvasToBlob(canvasRef.current, mimeType, quality)
  }

  async function getImageAsset(options = {}) {
    if (!canvasRef.current) throw new Error('Imagem indisponível.')

    const { mimeType = 'image/png', extension = 'png', quality = 0.95 } = options

    await drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto: userPhotoRef.current || userPhoto,
      photoTransform: photoTransformRef.current,
      overlayMode,
      overlayTransform: overlayTransformRef.current,
    })

    const dataUrl = canvasRef.current.toDataURL(mimeType, quality)
    const blob = await canvasToBlob(canvasRef.current, mimeType, quality)
    const filename = getFileName(session, template, format, extension)
    const file = new File([blob], filename, { type: mimeType })

    return { blob, dataUrl, file, filename, mimeType }
  }

  async function handleShare() {
    if (busy) return

    setBusy(true)
    setStatus('')

    try {
      const { file } = await getImageAsset()

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'ForgeFlow',
          text: shareText,
          files: [file],
        })
        setStatus('Compartilhamento aberto com a imagem.')
      } else if (navigator.share) {
        await navigator.share({
          title: 'ForgeFlow',
          text: shareText,
        })
        setStatus('Compartilhamento aberto com o texto. Use Salvar imagem para baixar o card.')
      } else {
        await copyText(shareText)
        setStatus('Compartilhamento indisponível. Legenda copiada.')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        setStatus('Não deu para compartilhar agora. Tente salvar a imagem.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    try {
      await copyText(shareText)
      setStatus('Legenda copiada.')
    } catch (error) {
      console.error(error)
      setStatus('Não foi possível copiar a legenda.')
    }
  }

  async function handleDownload() {
    if (busy) return

    setBusy(true)
    setStatus('')

    try {
      const nativeAssetOptions = { mimeType: 'image/jpeg', extension: 'jpg', quality: 0.88 }
      const { blob, dataUrl, file, filename, mimeType } = isNativeApp()
        ? await getImageAsset(nativeAssetOptions)
        : await getImageAsset()

      if (isNativeApp()) {
        try {
          const result = await saveImageToGalleryNative({ dataUrl, filename, mimeType })
          if (result?.saved !== false) {
            setStatus('Imagem salva na galeria do celular, em Pictures/ForgeFlow.')
            return
          }
        } catch (nativeError) {
          console.warn('ForgeFlowMedia.saveImageToGallery indisponível:', nativeError)
        }

        if (canShareImageFile(file)) {
          await navigator.share({
            title: 'Salvar imagem ForgeFlow',
            text: 'Escolha Galeria, Fotos, Arquivos ou Instagram para salvar/usar a imagem.',
            files: [file],
          })
          setStatus('Não foi possível salvar automaticamente. Use o compartilhamento do sistema para salvar a imagem.')
          return
        }
      }

      if (isMobileShareContext() && canShareImageFile(file)) {
        await navigator.share({
          title: 'Salvar imagem ForgeFlow',
          text: 'Escolha Fotos, Galeria, Arquivos ou Instagram para salvar/usar a imagem.',
          files: [file],
        })
        setStatus('Imagem gerada. Escolha o app onde quer salvar ou postar.')
        return
      }

      triggerImageDownload(blob, filename)
      setStatus(isMobileShareContext()
        ? 'Download iniciado. No navegador mobile, a imagem normalmente vai para Downloads.'
        : 'Download da imagem iniciado.'
      )
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)

        try {
          const fallbackBlob = await getImageBlob()
          const opened = openImageFallback(fallbackBlob)
          setStatus(opened
            ? 'Imagem aberta em nova aba. Segure/toque nela para salvar.'
            : 'Não foi possível salvar a imagem. Tente Compartilhar imagem.'
          )
        } catch {
          setStatus('Não foi possível salvar a imagem. Tente Compartilhar imagem.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleOpenInstagram() {
    if (busy) return

    setBusy(true)
    setStatus('')

    try {
      const nativeAssetOptions = { mimeType: 'image/jpeg', extension: 'jpg', quality: 0.88 }
      const { blob, dataUrl, file, filename, mimeType } = isNativeApp()
        ? await getImageAsset(nativeAssetOptions)
        : await getImageAsset()

      if (isNativeApp()) {
        try {
          const result = await shareImageToInstagramStoryNative({
            dataUrl,
            filename,
            mimeType,
            shareText,
          })

          if (result?.opened !== false) {
            setStatus('Imagem salva em Pictures/ForgeFlow e tentativa de abrir o Instagram Stories iniciada. Se o Story não vier com a imagem, selecione o card no álbum ForgeFlow.')
            return
          }
        } catch (nativeError) {
          console.warn('ForgeFlowMedia.shareImageToInstagramStory indisponível:', nativeError)
        }
      }

      if (canShareImageFile(file)) {
        await navigator.share({
          title: 'Publicar treino no Instagram',
          text: shareText,
          files: [file],
        })
        setStatus('Imagem pronta. Se aparecer a opção, escolha Instagram Stories no compartilhamento.')
        return
      }

      triggerImageDownload(blob, filename)
      setStatus('Imagem baixada. No navegador não há garantia de anexar direto no Story; abra o Instagram e selecione o card na galeria.')
      window.setTimeout(() => {
        window.location.href = 'instagram://story-camera'

        window.setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
        }, 900)
      }, 300)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        setStatus('Não deu para abrir o Instagram com a imagem. Use Salvar imagem ou Compartilhar imagem.')
      }
    } finally {
      setBusy(false)
    }
  }

  const dialog = (
    <div className="ff-share-studio" role="dialog" aria-modal="true" aria-label="Compartilhar treino">
      <div className="ff-share-studio__panel">
        <header className="ff-share-studio__header">
          <div>
            <span><Sparkles size={15} /> ForgeFlow share</span>
            <h2>Compartilhar treino</h2>
            <p>{stats.workoutName} • {stats.volumeLabel} • {stats.durationLabel}</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Fechar compartilhamento">
            <X size={20} />
          </button>
        </header>

        <div className="ff-share-studio__body">
          <section
            className="ff-share-studio__preview"
            aria-label="Prévia da imagem"
            style={{ '--ff-share-snap-bottom': snapBottomPercent }}
          >
            <canvas
              ref={canvasRef}
              className={`ff-share-studio__canvas is-${format} template-${template} bg-${selectedBackground}${canEditPreview ? ' is-editing-photo' : ''} editing-${activeEditLayer}`}
              style={{ aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />

            {snapGuide.x && <span className="ff-share-studio__snap-line is-vertical" aria-hidden="true" />}
            {snapGuide.y && <span className="ff-share-studio__snap-line is-horizontal" aria-hidden="true" />}
            {snapGuide.bottom && <span className="ff-share-studio__snap-line is-bottom" aria-hidden="true" />}

            {!ready && (
              <div className="ff-share-studio__loading">
                Montando imagem...
              </div>
            )}
          </section>

          <section className="ff-share-studio__controls">
            <div className="ff-share-studio__tip-card">
              <strong>Editor premium do card</strong>
              <small>Use sua foto como destaque e deixe as informações como figurinhas por cima, no estilo Story do Instagram.</small>
            </div>

            <div className="ff-share-studio__section-title">
              <Layers3 size={16} />
              <span>Formato</span>
            </div>

            <div className="ff-share-studio__format-grid">
              {SHARE_FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={format === item.id ? 'is-active' : ''}
                  onClick={() => setFormat(item.id)}
                >
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>

            <div className="ff-share-studio__section-title">
              <Move size={16} />
              <span>Camada de informações</span>
            </div>

            <div className="ff-share-studio__overlay-mode">
              <button
                type="button"
                className={overlayMode === 'stickers' ? 'is-active' : ''}
                onClick={() => {
                  setOverlayMode('stickers')
                  setActiveEditLayer('overlay')
                }}
              >
                <strong>Figurinhas</strong>
                <small>Foto em destaque, informações menores por cima.</small>
              </button>
              <button
                type="button"
                className={overlayMode === 'fullCard' ? 'is-active' : ''}
                onClick={() => setOverlayMode('fullCard')}
              >
                <strong>Card inteiro</strong>
                <small>Visual premium ocupando mais espaço.</small>
              </button>
            </div>

            {overlayMode === 'stickers' && (
              <>
                <div className="ff-share-studio__edit-layer" aria-label="Escolha o que editar no preview">
                  <button
                    type="button"
                    className={activeEditLayer === 'overlay' ? 'is-active' : ''}
                    onClick={() => setActiveEditLayer('overlay')}
                  >
                    Informações
                  </button>
                  <button
                    type="button"
                    className={activeEditLayer === 'photo' ? 'is-active' : ''}
                    onClick={() => {
                      if (hasEditablePhoto) {
                        setActiveEditLayer('photo')
                      } else {
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    Foto
                  </button>
                </div>

                <div className="ff-share-studio__overlay-tools">
                  <button type="button" onClick={handleResetOverlay}>Resetar figurinhas</button>
                  <button type="button" onClick={handleOverlaySmaller}>Menor</button>
                  <button type="button" onClick={handleOverlayBigger}>Maior</button>
                </div>
              </>
            )}

            <div className="ff-share-studio__section-title">
              <Layers3 size={16} />
              <span>Template</span>
            </div>

            <div className="ff-share-studio__template-grid">
              {SHARE_TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={template === item.id ? 'is-active' : ''}
                  onClick={() => setTemplate(item.id)}
                >
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>

            <div className="ff-share-studio__section-title">
              <Sparkles size={16} />
              <span>Fundo</span>
            </div>

            <div className="ff-share-studio__background-mode">
              <button
                type="button"
                className={backgroundMode === 'theme' ? 'is-active' : ''}
                onClick={() => setBackgroundMode('theme')}
              >
                Fundo premium
              </button>
              <button
                type="button"
                className={backgroundMode === 'photo' ? 'is-active' : ''}
                onClick={() => {
                  if (userPhoto?.src) {
                    setBackgroundMode('photo')
                    setOverlayMode('stickers')
                    setActiveEditLayer('photo')
                    return
                  }
                  fileInputRef.current?.click()
                }}
              >
                Foto própria
              </button>
            </div>

            {backgroundMode === 'theme' && (
              <div className="ff-share-studio__background-grid">
                {SHARE_BACKGROUNDS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedBackground === item.id ? 'is-active' : ''}
                    onClick={() => setSelectedBackground(item.id)}
                  >
                    <i className={`ff-share-studio__bg-swatch is-${item.id}`} aria-hidden="true" />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="ff-share-studio__section-title">
              <Layers3 size={16} />
              <span>Nível de informação</span>
            </div>

            <div className="ff-share-studio__info-levels">
              {INFO_LEVELS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={infoLevel === item.id ? 'is-active' : ''}
                  onClick={() => setInfoLevel(item.id)}
                >
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>

            <div className="ff-share-studio__section-title">
              <ImagePlus size={16} />
              <span>Foto própria</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              className="sr-only"
              onChange={handlePhotoChange}
            />

            <button
              type="button"
              className={`ff-share-studio__photo-card${userPhoto ? ' has-photo' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="ff-share-studio__photo-icon"><ImagePlus size={20} /></span>
              <span>
                <strong>{userPhoto ? userPhoto.name : 'Selecionar foto do celular'}</strong>
                <small>{userPhoto ? 'Toque para trocar. A foto continua ao mudar template ou formato.' : 'Use uma foto da galeria como fundo e ajuste com gestos.'}</small>
              </span>
            </button>

            {userPhoto && (
              <div className="ff-share-studio__photo-tools">
                <button type="button" onClick={handleResetPhoto}>Resetar foto</button>
                <button type="button" onClick={handlePhotoFill}>Preencher</button>
                <button type="button" onClick={handlePhotoFit}>Ajustar</button>
                <button type="button" onClick={handleClearPhoto}>Remover</button>
              </div>
            )}

            <div className="ff-share-studio__section-title">
              <MessageCircle size={16} />
              <span>Mensagem opcional para aparecer no card</span>
            </div>

            <label className="ff-share-studio__caption">
              <span>Mensagem opcional para aparecer no card</span>
              <textarea
                value={customCaption}
                onChange={(event) => setCustomCaption(event.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Ex: treino pago, progresso construído."
              />
              <small>Deixe vazio para usar uma frase pronta. Textos longos são quebrados e limitados no canvas.</small>
            </label>

            <div className="ff-share-studio__phrase-row" aria-label="Frases prontas">
              {SHARE_PHRASES.map((phrase, index) => (
                <button
                  key={phrase}
                  type="button"
                  className={phraseId === index && !customCaption ? 'is-active' : ''}
                  onClick={() => {
                    setPhraseId(index)
                    setCustomCaption('')
                  }}
                >
                  {phrase}
                </button>
              ))}
            </div>

            <div className="ff-share-studio__stats">
              <span><strong>{stats.completedSetCount}</strong><small>séries</small></span>
              <span><strong>{stats.exerciseCount}</strong><small>exercícios</small></span>
              <span><strong>{stats.prCount}</strong><small>PRs</small></span>
            </div>
          </section>
        </div>

        {status && (
          <p className="ff-share-studio__status">
            <CheckCircle2 size={16} />
            {status}
          </p>
        )}

        <footer className="ff-share-studio__footer">
          <Button type="button" onClick={handleShare} disabled={busy || !ready} className="ff-share-studio__primary">
            <Share2 size={18} />
            {busy ? 'Preparando...' : 'Compartilhar imagem'}
          </Button>

          <Button type="button" variant="secondary" onClick={handleDownload} disabled={busy || !ready}>
            <Download size={18} />
            Salvar na galeria
          </Button>

          <Button type="button" variant="secondary" onClick={handleOpenInstagram} disabled={busy || !ready}>
            <ImagePlus size={18} />
            Instagram/Story
          </Button>

          <Button type="button" variant="secondary" onClick={handleCopy} disabled={!shareText}>
            <Copy size={18} />
            Copiar legenda
          </Button>
        </footer>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return dialog

  return createPortal(dialog, document.body)
}

export default WorkoutShareStudio
