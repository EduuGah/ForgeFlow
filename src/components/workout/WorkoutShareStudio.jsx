import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  Copy,
  Download,
  ImagePlus,
  Layers3,
  MessageCircle,
  Share2,
  Sparkles,
  X,
} from 'lucide-react'

import forgeflowIcon from '../../assets/forgeflow-icon.png'
import Button from '../ui/Button'
import { isNativeApp } from '../../utils/platformUtils'
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

const SHARE_TEMPLATES = [
  {
    id: 'story',
    label: 'Story',
    description: 'Vertical 9:16 para Instagram, WhatsApp e status.',
    width: 1080,
    height: 1920,
    tag: 'Treino concluído',
  },
  {
    id: 'feed',
    label: 'Feed',
    description: 'Quadrado 1:1 com resumo equilibrado.',
    width: 1080,
    height: 1080,
    tag: 'Resumo do treino',
  },
  {
    id: 'minimal',
    label: 'Minimalista',
    description: 'Pouco texto, visual limpo e elegante.',
    width: 1080,
    height: 1350,
    tag: 'ForgeFlow',
  },
  {
    id: 'pr',
    label: 'Foco PR',
    description: 'Dá destaque aos recordes batidos.',
    width: 1080,
    height: 1350,
    tag: 'Novo recorde',
  },
  {
    id: 'volume',
    label: 'Volume',
    description: 'Mostra o volume total como protagonista.',
    width: 1080,
    height: 1350,
    tag: 'Volume acumulado',
  },
  {
    id: 'quote',
    label: 'Frase',
    description: 'Legenda motivacional em destaque.',
    width: 1080,
    height: 1350,
    tag: 'Registro do dia',
  },
  {
    id: 'photo',
    label: 'Foto',
    description: 'Usa uma foto própria como fundo do story.',
    width: 1080,
    height: 1920,
    tag: 'Treino registrado',
  },
]

const INFO_LEVELS = [
  {
    id: 'light',
    label: 'Poucas',
    description: 'Nome, data e duração.',
  },
  {
    id: 'medium',
    label: 'Médias',
    description: 'Tempo, volume, exercícios e PRs.',
  },
  {
    id: 'full',
    label: 'Completas',
    description: 'Inclui séries, local e frase.',
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
]

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

  const locationLabel = getMapsUrl(session.location) ? formatLocationLabel(session.location) : ''

  return {
    workoutName: session.workoutName || session.name || 'Treino ForgeFlow',
    dateLabel: formatDate(session.finishedAt || session.createdAt),
    durationLabel: formatTime(session.duration || session.durationSeconds || 0),
    volume: sessionVolume,
    volumeLabel: formatVolume(sessionVolume),
    exerciseCount: exercises.length,
    completedSetCount: completedSets.length,
    prCount: sessionPRs.length,
    prs: sessionPRs,
    topExercises: exercises.map(getExerciseName).filter(Boolean).slice(0, 5),
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
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

function drawCoverImage(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.width - sourceWidth) / 2
  const sourceY = (image.height - sourceHeight) / 2

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
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

  visibleLines.forEach((currentLine, index) => {
    const shouldTruncate = index === maxLines - 1 && lines.length > maxLines
    const suffix = shouldTruncate ? '…' : ''
    const availableWidth = shouldTruncate ? maxWidth - ctx.measureText(suffix).width : maxWidth
    let lineText = currentLine

    while (shouldTruncate && ctx.measureText(lineText).width > availableWidth && lineText.length > 1) {
      lineText = lineText.slice(0, -1)
    }

    ctx.fillText(`${lineText}${suffix}`, x, y + index * lineHeight)
  })

  return y + Math.max(visibleLines.length, 1) * lineHeight
}

function drawBrand(ctx, iconImage, x, y, scale = 1, transparent = false) {
  const iconSize = 78 * scale
  const radius = 22 * scale

  ctx.save()
  drawRoundRect(ctx, x, y, iconSize, iconSize, radius)
  ctx.fillStyle = transparent ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.08)'
  ctx.fill()
  ctx.clip()

  if (iconImage) {
    ctx.drawImage(iconImage, x, y, iconSize, iconSize)
  } else {
    ctx.fillStyle = getShareAccentColor()
    ctx.font = `${48 * scale}px Inter, Arial, sans-serif`
    ctx.fillText('F', x + 24 * scale, y + 55 * scale)
  }

  ctx.restore()

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${31 * scale}px Inter, Arial, sans-serif`
  ctx.fillText('ForgeFlow', x + iconSize + 20 * scale, y + 34 * scale)
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = `700 ${20 * scale}px Inter, Arial, sans-serif`
  ctx.fillText('treino registrado', x + iconSize + 20 * scale, y + 65 * scale)
}

function getMetricsForLevel(stats, infoLevel) {
  const base = [
    { label: 'Duração', value: stats.durationLabel },
    { label: 'Data', value: stats.dateLabel.replace(' de ', '/').replace(' de ', '/') },
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

function drawMetric(ctx, metric, x, y, width, height, compact = false) {
  drawRoundRect(ctx, x, y, width, height, compact ? 22 : 28)
  ctx.fillStyle = 'rgba(255,255,255,0.075)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#ffffff'
  ctx.font = `900 ${compact ? 27 : 34}px Inter, Arial, sans-serif`
  wrapText(ctx, metric.value, x + 24, y + (compact ? 36 : 43), width - 48, compact ? 29 : 34, compact ? 1 : 2)

  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.font = `800 ${compact ? 18 : 21}px Inter, Arial, sans-serif`
  ctx.fillText(metric.label.toUpperCase(), x + 24, y + height - 20)
}

function drawMetricGrid(ctx, metrics, x, y, width, columns = 2, compact = false) {
  const gap = compact ? 18 : 24
  const itemHeight = compact ? 86 : 104
  const itemWidth = (width - gap * (columns - 1)) / columns

  metrics.forEach((metric, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    drawMetric(
      ctx,
      metric,
      x + col * (itemWidth + gap),
      y + row * (itemHeight + gap),
      itemWidth,
      itemHeight,
      compact
    )
  })

  return y + Math.ceil(metrics.length / columns) * itemHeight + Math.max(0, Math.ceil(metrics.length / columns) - 1) * gap
}

function drawBackground(ctx, width, height, template, photoImage, accentSoftColor) {
  if (template === 'overlay') return

  if (photoImage) {
    drawCoverImage(ctx, photoImage, 0, 0, width, height)
    const photoOverlay = ctx.createLinearGradient(0, 0, 0, height)
    photoOverlay.addColorStop(0, 'rgba(0,0,0,0.18)')
    photoOverlay.addColorStop(0.45, 'rgba(0,0,0,0.24)')
    photoOverlay.addColorStop(1, 'rgba(0,0,0,0.82)')
    ctx.fillStyle = photoOverlay
    ctx.fillRect(0, 0, width, height)
    return
  }

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#05070b')
  bg.addColorStop(0.48, '#151518')
  bg.addColorStop(1, '#070707')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.translate(width * 0.58, -height * 0.08)
  ctx.rotate(0.2)
  drawRoundRect(ctx, 0, 0, width * 0.42, height * 1.08, 70)
  ctx.fillStyle = accentSoftColor
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(-width * 0.2, height * 0.68)
  ctx.rotate(-0.18)
  drawRoundRect(ctx, 0, 0, width * 0.52, height * 0.34, 64)
  ctx.fillStyle = 'rgba(255,255,255,0.035)'
  ctx.fill()
  ctx.restore()
}

function drawFocusBlock(ctx, stats, template, x, y, width, accentColor) {
  if (template === 'volume') {
    ctx.fillStyle = accentColor
    ctx.font = '900 34px Inter, Arial, sans-serif'
    ctx.fillText('VOLUME TOTAL', x, y)

    ctx.fillStyle = '#ffffff'
    ctx.font = '950 96px Inter, Arial, sans-serif'
    wrapText(ctx, stats.volumeLabel, x, y + 112, width, 104, 1)
    return y + 155
  }

  if (template === 'pr') {
    ctx.fillStyle = accentColor
    ctx.font = '900 34px Inter, Arial, sans-serif'
    ctx.fillText(stats.prCount > 0 ? 'RECORDE BATIDO' : 'TREINO SEM PR', x, y)

    ctx.fillStyle = '#ffffff'
    ctx.font = '950 92px Inter, Arial, sans-serif'
    wrapText(ctx, `${stats.prCount} PR${stats.prCount === 1 ? '' : 's'}`, x, y + 112, width, 100, 1)
    return y + 155
  }

  return y
}

async function drawWorkoutShareCanvas(canvas, options) {
  const { session, meta, template, photoDataUrl, caption, infoLevel } = options
  await waitForFonts()

  const ctx = canvas.getContext('2d')
  const stats = getWorkoutStats(session, meta)
  const currentTemplate = SHARE_TEMPLATES.find((item) => item.id === template) || SHARE_TEMPLATES[0]
  const { width, height } = currentTemplate
  const overlay = template === 'overlay'
  const accentColor = getShareAccentColor()
  const accentSoftColor = getShareAccentSoftColor()
  const isSquare = width === height
  const isStory = height / width > 1.5
  const isCompact = isSquare || template === 'feed'

  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)

  let iconImage = null
  let photoImage = null

  try {
    iconImage = await loadImage(forgeflowIcon)
  } catch {
    // O texto da marca continua sendo desenhado sem o ícone.
  }

  if (photoDataUrl && template === 'photo') {
    try {
      photoImage = await loadImage(photoDataUrl)
    } catch {
      photoImage = null
    }
  }

  drawBackground(ctx, width, height, template, photoImage, accentSoftColor)

  ctx.save()
  if (overlay) {
    ctx.shadowColor = 'rgba(0,0,0,0.78)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 8
  }

  const pad = isSquare ? 64 : 78
  drawBrand(ctx, iconImage, pad, isSquare ? 60 : 86, isCompact ? 0.86 : 1, overlay)

  if (template === 'quote') {
    ctx.fillStyle = accentColor
    ctx.font = '900 31px Inter, Arial, sans-serif'
    ctx.fillText('MENSAGEM DO TREINO', pad, 265)

    ctx.fillStyle = '#ffffff'
    ctx.font = '950 76px Inter, Arial, sans-serif'
    const nextY = wrapText(ctx, caption, pad, 390, width - pad * 2, 86, 4)

    ctx.fillStyle = 'rgba(255,255,255,0.70)'
    ctx.font = '800 32px Inter, Arial, sans-serif'
    wrapText(ctx, `${stats.workoutName} • ${stats.durationLabel}`, pad, nextY + 80, width - pad * 2, 40, 2)

    drawMetricGrid(ctx, getMetricsForLevel(stats, infoLevel).slice(0, 4), pad, height - 360, width - pad * 2, 2, true)
    ctx.restore()
    return stats
  }

  const panelHeight = isSquare ? 730 : isStory ? 740 : 760
  const panelY = isSquare ? 220 : height - panelHeight - 86

  drawRoundRect(ctx, pad, panelY, width - pad * 2, panelHeight, isSquare ? 48 : 58)
  ctx.fillStyle = photoImage ? 'rgba(6,10,15,0.78)' : 'rgba(255,255,255,0.065)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.stroke()

  const innerX = pad + 36
  const innerW = width - pad * 2 - 72
  let cursorY = panelY + 74

  drawRoundRect(ctx, innerX, cursorY - 36, Math.min(430, innerW), 58, 29)
  ctx.fillStyle = accentSoftColor
  ctx.fill()
  ctx.strokeStyle = 'rgba(239,68,68,0.38)'
  ctx.stroke()

  ctx.fillStyle = accentColor
  ctx.font = '900 25px Inter, Arial, sans-serif'
  ctx.fillText(currentTemplate.tag.toUpperCase(), innerX + 28, cursorY + 2)
  cursorY += 92

  cursorY = drawFocusBlock(ctx, stats, template, innerX, cursorY - 12, innerW, accentColor)

  if (template !== 'volume' && template !== 'pr') {
    ctx.fillStyle = '#ffffff'
    ctx.font = `950 ${isSquare ? 68 : 82}px Inter, Arial, sans-serif`
    cursorY = wrapText(ctx, stats.workoutName, innerX, cursorY, innerW, isSquare ? 75 : 92, 2)
  } else {
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 48px Inter, Arial, sans-serif'
    cursorY = wrapText(ctx, stats.workoutName, innerX, cursorY + 12, innerW, 56, 2)
  }

  if (infoLevel !== 'light' || template === 'quote') {
    ctx.fillStyle = 'rgba(255,255,255,0.80)'
    ctx.font = `800 ${isSquare ? 29 : 35}px Inter, Arial, sans-serif`
    cursorY = wrapText(ctx, caption, innerX, cursorY + 42, innerW, isSquare ? 39 : 46, isSquare ? 2 : 3)
  }

  const metrics = getMetricsForLevel(stats, infoLevel)
  const columns = metrics.length <= 2 ? 2 : 2
  const maxMetricCount = isSquare ? 4 : infoLevel === 'full' ? 6 : 4
  drawMetricGrid(ctx, metrics.slice(0, maxMetricCount), innerX, Math.min(cursorY + 42, panelY + panelHeight - (infoLevel === 'full' ? 320 : 210)), innerW, columns, isSquare)

  const footerText = infoLevel === 'full' && stats.topExercises.length > 0
    ? `Exercícios: ${stats.topExercises.join(', ')}`
    : `Built with ForgeFlow • ${stats.completedSetCount} séries • ${stats.prCount} PRs`

  ctx.fillStyle = 'rgba(255,255,255,0.68)'
  ctx.font = `800 ${isSquare ? 24 : 28}px Inter, Arial, sans-serif`
  wrapText(ctx, footerText, innerX, panelY + panelHeight - 56, innerW, 34, 1)

  ctx.restore()

  return stats
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível gerar a imagem.'))
        return
      }

      resolve(blob)
    }, 'image/png', 0.95)
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

function getFileName(session = {}, template = 'story') {
  const rawName = String(session.workoutName || session.name || 'treino')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return `forgeflow-${rawName || 'treino'}-${template}.png`
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

function WorkoutShareStudio({ open, session, meta, onClose }) {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [template, setTemplate] = useState('story')
  const [infoLevel, setInfoLevel] = useState('medium')
  const [phraseId, setPhraseId] = useState(0)
  const [customCaption, setCustomCaption] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  const selectedTemplate = SHARE_TEMPLATES.find((item) => item.id === template) || SHARE_TEMPLATES[0]
  const selectedPhrase = SHARE_PHRASES[phraseId] || SHARE_PHRASES[0]
  const caption = customCaption.trim() || selectedPhrase

  const stats = useMemo(() => {
    if (!session) return null
    return getWorkoutStats(session, meta)
  }, [meta, session])

  const shareText = useMemo(() => {
    if (!stats) return ''
    return buildShareText(stats, caption)
  }, [caption, stats])

  useEffect(() => {
    if (!open || !session || !canvasRef.current) return undefined

    let active = true
    setReady(false)

    drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      photoDataUrl,
      caption,
      infoLevel,
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
  }, [caption, infoLevel, meta, open, photoDataUrl, session, template])

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
    }
  }, [open])

  if (!open || !session || !stats) return null

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoDataUrl(String(reader.result || ''))
      setTemplate('photo')
      setStatus('Foto aplicada. O modelo mudou para Foto.')
    }
    reader.onerror = () => {
      setStatus('Não foi possível carregar essa foto.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function handleClearPhoto() {
    setPhotoDataUrl('')
    setTemplate((currentTemplate) => currentTemplate === 'photo' ? 'story' : currentTemplate)
    setStatus('Foto removida do card.')
  }

  async function getImageBlob() {
    if (!canvasRef.current) throw new Error('Imagem indisponível.')

    await drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      photoDataUrl,
      caption,
      infoLevel,
    })

    return canvasToBlob(canvasRef.current)
  }

  async function getImageFile() {
    const blob = await getImageBlob()
    const filename = getFileName(session, template)
    const file = new File([blob], filename, { type: 'image/png' })

    return { blob, file, filename }
  }

  async function handleShare() {
    if (busy) return

    setBusy(true)
    setStatus('')

    try {
      const { file } = await getImageFile()

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
      const { blob, file, filename } = await getImageFile()

      if (isNativeApp() && canShareImageFile(file)) {
        await navigator.share({
          title: 'Salvar imagem ForgeFlow',
          text: 'Escolha Galeria, Fotos, Arquivos ou o app onde quer salvar a imagem.',
          files: [file],
        })
        setStatus('Imagem gerada. No Android, escolha Fotos, Galeria ou Arquivos para salvar.')
        return
      }

      triggerImageDownload(blob, filename)
      setStatus(isMobileShareContext()
        ? 'Imagem gerada. Se o navegador não baixar automaticamente, use Compartilhar imagem.'
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
      const { blob, file, filename } = await getImageFile()

      if (canShareImageFile(file)) {
        await navigator.share({
          title: 'Publicar treino no Instagram',
          text: shareText,
          files: [file],
        })
        setStatus('Imagem pronta. No menu que abriu, escolha Instagram ou Stories.')
        return
      }

      triggerImageDownload(blob, filename)
      setStatus('Imagem baixada. O navegador não consegue anexar direto no Story; selecione o card pela galeria do Instagram.')
      window.setTimeout(() => {
        window.location.href = 'instagram://story-camera'

        window.setTimeout(() => {
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
        }, 900)
      }, 300)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        setStatus('Não deu para abrir o Instagram com a imagem. Use Salvar ou Compartilhar imagem.')
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
          <section className="ff-share-studio__preview" aria-label="Prévia da imagem">
            <canvas
              ref={canvasRef}
              className={`ff-share-studio__canvas is-${template}`}
              style={{ aspectRatio: `${selectedTemplate.width} / ${selectedTemplate.height}` }}
            />

            {!ready && (
              <div className="ff-share-studio__loading">
                Montando imagem...
              </div>
            )}
          </section>

          <section className="ff-share-studio__controls">
            <div className="ff-share-studio__tip-card">
              <strong>Monte o card antes de postar</strong>
              <small>Escolha o formato, defina quantas informações aparecem e personalize a frase que vai dentro da imagem.</small>
            </div>

            <div className="ff-share-studio__section-title">
              <Layers3 size={16} />
              <span>Formato do card</span>
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
              className={`ff-share-studio__photo-card${photoDataUrl ? ' has-photo' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="ff-share-studio__photo-icon"><ImagePlus size={20} /></span>
              <span>
                <strong>{photoDataUrl ? 'Foto aplicada' : 'Selecionar foto do celular'}</strong>
                <small>{photoDataUrl ? 'Toque para trocar a foto de fundo.' : 'Use uma foto da galeria como fundo do modelo Foto.'}</small>
              </span>
            </button>

            {photoDataUrl && (
              <button type="button" className="ff-share-studio__clear-photo" onClick={handleClearPhoto}>
                Remover foto e voltar ao modelo padrão
              </button>
            )}

            <div className="ff-share-studio__section-title">
              <MessageCircle size={16} />
              <span>Frase opcional</span>
            </div>

            <label className="ff-share-studio__caption">
              <span>Texto que aparece dentro da imagem</span>
              <textarea
                value={customCaption}
                onChange={(event) => setCustomCaption(event.target.value)}
                maxLength={140}
                rows={3}
                placeholder={`Ex: ${selectedPhrase}`}
              />
              <small>Você pode editar livremente. Deixe vazio para usar uma frase pronta.</small>
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
            Salvar imagem
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
