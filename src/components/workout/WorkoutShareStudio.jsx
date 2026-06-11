import { useEffect, useMemo, useRef, useState } from 'react'
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
import {
  formatDate,
  formatTime,
  formatVolume,
  getSessionCompletedSets,
  getSessionPRsFromSets,
  getSessionVolumeFromSets,
} from '../../features/history/historyUtils'

const SHARE_TEMPLATES = [
  {
    id: 'story',
    label: 'Story',
    description: 'Vertical, forte e pronto para Instagram.',
    width: 1080,
    height: 1920,
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Quadrado compacto para WhatsApp e feed.',
    width: 1080,
    height: 1080,
  },
  {
    id: 'transparent',
    label: 'Texto PNG',
    description: 'Fundo transparente para colocar sobre foto.',
    width: 1080,
    height: 1350,
  },
  {
    id: 'photo',
    label: 'Foto',
    description: 'Sua foto com overlay ForgeFlow.',
    width: 1080,
    height: 1920,
  },
]

const SHARE_PHRASES = [
  {
    id: 'challenge',
    label: 'Desafio',
    text: 'Consegue bater esse treino?',
  },
  {
    id: 'pr',
    label: 'PR',
    text: 'Treino concluido. Hoje teve carga de verdade.',
  },
  {
    id: 'clean',
    label: 'Resumo',
    text: 'Registro feito no ForgeFlow.',
  },
]

function getExerciseName(exercise = {}) {
  return (
    exercise.exercise?.name ||
    exercise.exerciseName ||
    exercise.name ||
    'Exercicio'
  )
}

function getWorkoutStats(session = {}, meta = {}) {
  const exercises = Array.isArray(session.exercises) ? session.exercises : []
  const completedSets = Array.isArray(meta.completedSets)
    ? meta.completedSets
    : getSessionCompletedSets({ ...session, exercises })
  const sessionVolume = meta.sessionVolume ?? getSessionVolumeFromSets(completedSets)
  const sessionPRs = Array.isArray(meta.sessionPRs)
    ? meta.sessionPRs
    : getSessionPRsFromSets(completedSets)

  const bestSet = completedSets.reduce((best, set) => {
    const weight = Number(set.weight) || 0
    const reps = Number(set.reps) || 0
    const score = weight * Math.max(1, reps)
    const bestScore = (Number(best?.weight) || 0) * Math.max(1, Number(best?.reps) || 0)

    return score > bestScore ? set : best
  }, null)

  const topWeightSet = completedSets.reduce((best, set) => {
    const weight = Number(set.weight) || 0
    const bestWeight = Number(best?.weight) || 0

    return weight > bestWeight ? set : best
  }, null)

  return {
    workoutName: session.workoutName || session.name || 'Treino ForgeFlow',
    dateLabel: formatDate(session.finishedAt || session.createdAt),
    durationLabel: formatTime(session.duration || session.durationSeconds || 0),
    volumeLabel: formatVolume(sessionVolume),
    exerciseCount: exercises.length,
    completedSetCount: completedSets.length,
    prCount: sessionPRs.length,
    topExercises: exercises.map(getExerciseName).filter(Boolean).slice(0, 4),
    bestSet,
    topWeightSet,
  }
}

function getSetLabel(set) {
  if (!set) return 'Sem carga registrada'

  const weight = Number(set.weight) || 0
  const reps = Number(set.reps) || 0
  const name = set.exerciseName || 'Melhor serie'

  if (!weight && !reps) return name

  return `${name} ${weight || '-'}kg x ${reps || '-'}`
}

function buildShareText(stats, caption) {
  const lines = [
    `${stats.workoutName} no ForgeFlow`,
    `${stats.durationLabel} | ${stats.volumeLabel} | ${stats.exerciseCount} exercicios | ${stats.completedSetCount} series`,
  ]

  if (stats.prCount > 0) {
    lines.push(`${stats.prCount} PR${stats.prCount > 1 ? 's' : ''} nesse treino.`)
  }

  if (stats.topWeightSet) {
    lines.push(`Maior carga: ${getSetLabel(stats.topWeightSet)}.`)
  }

  lines.push(caption)

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

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(' ')
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
    const suffix = index === maxLines - 1 && lines.length > maxLines ? '...' : ''
    ctx.fillText(`${currentLine}${suffix}`, x, y + index * lineHeight)
  })

  return y + visibleLines.length * lineHeight
}

function drawPill(ctx, label, value, x, y, width) {
  drawRoundRect(ctx, x, y, width, 118, 30)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = '700 26px Inter, Arial, sans-serif'
  ctx.fillText(label.toUpperCase(), x + 28, y + 40)

  ctx.fillStyle = '#ffffff'
  ctx.font = '900 42px Inter, Arial, sans-serif'
  ctx.fillText(value, x + 28, y + 88)
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

async function drawWorkoutShareCanvas(canvas, options) {
  const { session, meta, template, photoDataUrl, caption } = options
  const ctx = canvas.getContext('2d')
  const stats = getWorkoutStats(session, meta)
  const currentTemplate = SHARE_TEMPLATES.find((item) => item.id === template) || SHARE_TEMPLATES[0]
  const { width, height } = currentTemplate
  const transparent = template === 'transparent'
  const accentColor = getShareAccentColor()
  const accentSoftColor = getShareAccentSoftColor()

  canvas.width = width
  canvas.height = height
  ctx.clearRect(0, 0, width, height)

  let iconImage = null
  let photoImage = null

  try {
    iconImage = await loadImage(forgeflowIcon)
  } catch {
    // The text brand still renders if the icon asset is unavailable.
  }

  if (photoDataUrl && template === 'photo') {
    try {
      photoImage = await loadImage(photoDataUrl)
    } catch {
      photoImage = null
    }
  }

  if (!transparent) {
    if (photoImage) {
      drawCoverImage(ctx, photoImage, 0, 0, width, height)
      const photoOverlay = ctx.createLinearGradient(0, 0, 0, height)
      photoOverlay.addColorStop(0, 'rgba(0,0,0,0.22)')
      photoOverlay.addColorStop(0.48, 'rgba(0,0,0,0.18)')
      photoOverlay.addColorStop(1, 'rgba(0,0,0,0.78)')
      ctx.fillStyle = photoOverlay
      ctx.fillRect(0, 0, width, height)
    } else {
      const bg = ctx.createLinearGradient(0, 0, width, height)
      bg.addColorStop(0, '#05070b')
      bg.addColorStop(0.48, '#141417')
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
  }

  ctx.save()
  if (transparent) {
    ctx.shadowColor = 'rgba(0,0,0,0.78)'
    ctx.shadowBlur = 22
    ctx.shadowOffsetY = 8
  }

  if (template === 'card') {
    const pad = 76

    drawBrand(ctx, iconImage, pad, pad, 0.92, transparent)

    ctx.fillStyle = accentColor
    ctx.font = '900 34px Inter, Arial, sans-serif'
    ctx.fillText('DESAFIO FORGEFLOW', pad, 228)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 74px Inter, Arial, sans-serif'
    wrapText(ctx, stats.workoutName, pad, 320, width - pad * 2, 82, 2)

    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = '700 32px Inter, Arial, sans-serif'
    wrapText(ctx, caption, pad, 500, width - pad * 2, 42, 2)

    drawPill(ctx, 'Tempo', stats.durationLabel, pad, 650, 430)
    drawPill(ctx, 'Volume', stats.volumeLabel, pad + 470, 650, 430)
    drawPill(ctx, 'Series', String(stats.completedSetCount), pad, 800, 430)
    drawPill(ctx, 'PRs', String(stats.prCount), pad + 470, 800, 430)

    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = '800 30px Inter, Arial, sans-serif'
    wrapText(ctx, `Maior carga: ${getSetLabel(stats.topWeightSet)}`, pad, 990, width - pad * 2, 38, 1)
  } else if (transparent) {
    const pad = 78

    drawBrand(ctx, iconImage, pad, 76, 0.86, true)

    ctx.fillStyle = accentColor
    ctx.font = '900 34px Inter, Arial, sans-serif'
    ctx.fillText('TREINO CONCLUIDO', pad, 245)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 82px Inter, Arial, sans-serif'
    wrapText(ctx, stats.workoutName, pad, 340, width - pad * 2, 92, 2)

    ctx.fillStyle = 'rgba(255,255,255,0.86)'
    ctx.font = '800 36px Inter, Arial, sans-serif'
    wrapText(ctx, caption, pad, 550, width - pad * 2, 46, 2)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 48px Inter, Arial, sans-serif'
    ctx.fillText(`${stats.volumeLabel} | ${stats.durationLabel}`, pad, 720)

    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.font = '800 31px Inter, Arial, sans-serif'
    ctx.fillText(`${stats.completedSetCount} series | ${stats.exerciseCount} exercicios | ${stats.prCount} PRs`, pad, 780)

    ctx.fillStyle = accentColor
    drawRoundRect(ctx, pad, 840, 170, 12, 8)
    ctx.fill()
  } else {
    const pad = 82
    const bottomPanelY = template === 'photo' ? height - 690 : height - 760

    drawBrand(ctx, iconImage, pad, 92, 1, false)

    if (template === 'photo') {
      drawRoundRect(ctx, pad, bottomPanelY, width - pad * 2, 570, 52)
      ctx.fillStyle = 'rgba(6,10,15,0.76)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.fillStyle = accentColor
    ctx.font = '900 38px Inter, Arial, sans-serif'
    ctx.fillText('DESAFIO DO DIA', pad, bottomPanelY + 82)

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 86px Inter, Arial, sans-serif'
    wrapText(ctx, stats.workoutName, pad, bottomPanelY + 184, width - pad * 2, 96, 2)

    ctx.fillStyle = 'rgba(255,255,255,0.76)'
    ctx.font = '800 36px Inter, Arial, sans-serif'
    wrapText(ctx, caption, pad, bottomPanelY + 392, width - pad * 2, 48, 2)

    const metricsY = bottomPanelY + 508
    const metricWidth = (width - pad * 2 - 30) / 2
    drawPill(ctx, 'Volume', stats.volumeLabel, pad, metricsY, metricWidth)
    drawPill(ctx, 'Tempo', stats.durationLabel, pad + metricWidth + 30, metricsY, metricWidth)

    ctx.fillStyle = 'rgba(255,255,255,0.74)'
    ctx.font = '800 29px Inter, Arial, sans-serif'
    wrapText(ctx, `${stats.completedSetCount} series | ${stats.exerciseCount} exercicios | ${stats.prCount} PRs`, pad, height - 118, width - pad * 2, 38, 1)
  }

  ctx.restore()

  return stats
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Nao foi possivel gerar a imagem.'))
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

function WorkoutShareStudio({ open, session, meta, onClose }) {
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [template, setTemplate] = useState('story')
  const [phraseId, setPhraseId] = useState('challenge')
  const [customCaption, setCustomCaption] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  const selectedTemplate = SHARE_TEMPLATES.find((item) => item.id === template) || SHARE_TEMPLATES[0]
  const selectedPhrase = SHARE_PHRASES.find((item) => item.id === phraseId) || SHARE_PHRASES[0]
  const caption = customCaption.trim() || selectedPhrase.text

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
    })
      .then(() => {
        if (active) setReady(true)
      })
      .catch((error) => {
        console.error(error)
        if (active) {
          setStatus('Nao foi possivel montar a imagem agora.')
          setReady(false)
        }
      })

    return () => {
      active = false
    }
  }, [caption, meta, open, photoDataUrl, session, template])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
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
      setStatus('Foto aplicada ao modelo.')
    }
    reader.onerror = () => {
      setStatus('Nao foi possivel carregar essa foto.')
    }
    reader.readAsDataURL(file)
  }

  async function getImageBlob() {
    if (!canvasRef.current) throw new Error('Imagem indisponivel.')

    await drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      photoDataUrl,
      caption,
    })

    return canvasToBlob(canvasRef.current)
  }

  async function handleShare() {
    if (busy) return

    setBusy(true)
    setStatus('')

    try {
      const blob = await getImageBlob()
      const file = new File([blob], getFileName(session, template), { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'ForgeFlow',
          text: shareText,
          files: [file],
        })
        setStatus('Compartilhamento aberto.')
      } else if (navigator.share) {
        await navigator.share({
          title: 'ForgeFlow',
          text: shareText,
        })
        setStatus('Compartilhamento aberto com texto.')
      } else {
        await copyText(shareText)
        setStatus('Seu celular nao abriu o compartilhamento. Texto copiado.')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        setStatus('Nao deu para compartilhar agora. Tente salvar a imagem.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    try {
      await copyText(shareText)
      setStatus('Texto copiado.')
    } catch (error) {
      console.error(error)
      setStatus('Nao foi possivel copiar o texto.')
    }
  }

  async function handleDownload() {
    if (busy) return

    setBusy(true)
    setStatus('')

    try {
      const blob = await getImageBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getFileName(session, template)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus('Imagem salva para compartilhar.')
    } catch (error) {
      console.error(error)
      setStatus('Nao foi possivel salvar a imagem.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ff-share-studio" role="dialog" aria-modal="true" aria-label="Compartilhar treino">
      <div className="ff-share-studio__panel">
        <header className="ff-share-studio__header">
          <div>
            <span><Sparkles size={15} /> ForgeFlow share</span>
            <h2>Compartilhar treino</h2>
            <p>{stats.workoutName} | {stats.volumeLabel} | {stats.durationLabel}</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Fechar compartilhamento">
            <X size={20} />
          </button>
        </header>

        <div className="ff-share-studio__body">
          <section className="ff-share-studio__preview" aria-label="Previa da imagem">
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
            <div className="ff-share-studio__section-title">
              <Layers3 size={16} />
              <span>Formato</span>
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
              <MessageCircle size={16} />
              <span>Mensagem</span>
            </div>

            <div className="ff-share-studio__phrase-row">
              {SHARE_PHRASES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={phraseId === item.id && !customCaption ? 'is-active' : ''}
                  onClick={() => {
                    setPhraseId(item.id)
                    setCustomCaption('')
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="ff-share-studio__caption">
              <span>Frase opcional</span>
              <input
                type="text"
                value={customCaption}
                onChange={(event) => setCustomCaption(event.target.value)}
                maxLength={90}
                placeholder={selectedPhrase.text}
              />
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
            />

            <button
              type="button"
              className="ff-share-studio__photo-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={18} />
              <span>{photoDataUrl ? 'Trocar foto de fundo' : 'Usar foto de fundo'}</span>
            </button>

            <div className="ff-share-studio__stats">
              <span><strong>{stats.completedSetCount}</strong><small>series</small></span>
              <span><strong>{stats.exerciseCount}</strong><small>exercicios</small></span>
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
            {busy ? 'Preparando...' : 'Compartilhar'}
          </Button>

          <Button type="button" variant="secondary" onClick={handleDownload} disabled={busy || !ready}>
            <Download size={18} />
            Salvar imagem
          </Button>

          <Button type="button" variant="secondary" onClick={handleCopy} disabled={!shareText}>
            <Copy size={18} />
            Copiar texto
          </Button>
        </footer>
      </div>
    </div>
  )
}

export default WorkoutShareStudio
