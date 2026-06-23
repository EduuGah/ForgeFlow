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
import { saveImageToGalleryNative } from '../../utils/shareNativeBridge'
import {
  DEFAULT_PHOTO_TRANSFORM,
  INFO_LEVELS,
  PHOTO_FIT_TRANSFORM,
  PHOTO_MAX_SCALE,
  SHARE_BACKGROUNDS,
  SHARE_FORMATS,
  SHARE_PHRASES,
  SHARE_STICKER_TYPES,
  STICKER_LAYOUT_PRESETS,
  STICKER_MAX_SCALE,
  STICKER_MIN_SCALE,
  STICKER_THEME_PRESETS,
  buildShareText,
  canShareImageFile,
  canvasToBlob,
  clamp,
  clampPhotoTransform,
  clampStickerTransform,
  copyText,
  createUserPhotoFromFile,
  drawWorkoutShareCanvas,
  getDefaultStickerState,
  getFileName,
  getStickerBounds,
  getStickerDomStyleForFormat,
  getVisibleStickerEntries,
  getWorkoutStats,
  hexToHsl,
  hslToHex,
  isLikelyHeicFile,
  isMobileShareContext,
  loadShareImage,
  migrateStickerStateForFormat,
  openImageFallback,
  renderStickerPreviewDataUrl,
  triggerImageDownload,
} from './share/shareRenderUtils'

const TEMPLATE_PRESETS = [
  {
    id: 'premium',
    label: 'Premium',
    description: 'Fundo Forge + glass',
    background: 'forgeRed',
    layout: 'balanced',
    style: 'glass',
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Métricas em destaque',
    background: 'carbonGrid',
    layout: 'analytics',
    style: 'glass',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Limpo e discreto',
    background: 'obsidian',
    layout: 'compact',
    style: 'minimal',
  },
  {
    id: 'pr',
    label: 'PR',
    description: 'Recordes e vermelho',
    background: 'nightPr',
    layout: 'hero',
    style: 'redBold',
  },
  {
    id: 'darkGlass',
    label: 'Dark Glass',
    description: 'Vidro escuro premium',
    background: 'blackMarble',
    layout: 'balanced',
    style: 'glass',
  },
]

const COLOR_TARGETS = [
  { id: 'titleColor', label: 'Título' },
  { id: 'textColor', label: 'Texto' },
  { id: 'accentColor', label: 'Destaque' },
  { id: 'backgroundColor', label: 'Fundo' },
  { id: 'borderColor', label: 'Borda' },
]

const LAYOUT_PRESET_LABELS = [
  { id: 'balanced', label: 'Base' },
  { id: 'compact', label: 'Compacto' },
  { id: 'hero', label: 'Hero' },
  { id: 'analytics', label: 'Analytics' },
]

function getFormat(formatId) {
  return SHARE_FORMATS.find((item) => item.id === formatId) || SHARE_FORMATS[0]
}

function getStickerMeta(stickerId) {
  return SHARE_STICKER_TYPES.find((item) => item.id === stickerId) || null
}

function getFirstVisibleStickerId(stickers, fallback = 'summary') {
  const visible = SHARE_STICKER_TYPES.find((item) => stickers?.[item.id]?.visible)
  return visible?.id || fallback
}

function getPointerCanvasDelta(startPoint, currentPoint, previewRect, selectedFormat) {
  const scaleX = selectedFormat.width / Math.max(1, previewRect.width)
  const scaleY = selectedFormat.height / Math.max(1, previewRect.height)

  return {
    x: (currentPoint.clientX - startPoint.clientX) * scaleX,
    y: (currentPoint.clientY - startPoint.clientY) * scaleY,
  }
}

function getPointerCenter(points) {
  const list = Array.from(points.values())
  if (!list.length) return { clientX: 0, clientY: 0 }

  return {
    clientX: list.reduce((sum, point) => sum + point.clientX, 0) / list.length,
    clientY: list.reduce((sum, point) => sum + point.clientY, 0) / list.length,
  }
}

function getPointerDistance(points) {
  const [a, b] = Array.from(points.values())
  if (!a || !b) return 1
  return Math.max(1, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY))
}

function Accordion({ title, subtitle, icon, defaultOpen = false, children }) {
  return (
    <details className="ff-share-next__accordion" open={defaultOpen}>
      <summary>
        <span className="ff-share-next__accordion-title">
          {icon}
          <strong>{title}</strong>
        </span>
        {subtitle && <small>{subtitle}</small>}
      </summary>
      <div className="ff-share-next__accordion-body">{children}</div>
    </details>
  )
}

function SegmentedControl({ label, options, value, onChange }) {
  return (
    <div className="ff-share-next__field">
      {label && <span className="ff-share-next__field-label">{label}</span>}
      <div className="ff-share-next__segmented">
        {options.map((item) => (
          <button
            key={item.id}
            type="button"
            className={value === item.id ? 'is-active' : ''}
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CompactStickerBar({ selectedStickerMeta, selectedSticker, onClose, onScale, onOpenSheet }) {
  if (!selectedStickerMeta || !selectedSticker?.visible) return null

  return (
    <div className="ff-share-next__quickbar" aria-label="Edição rápida da figurinha selecionada">
      <div className="ff-share-next__quickbar-label">
        <span>Editando</span>
        <strong>{selectedStickerMeta.label}</strong>
      </div>
      <div className="ff-share-next__quickbar-actions">
        <button type="button" onClick={() => onScale(-0.08)} aria-label="Diminuir figurinha">−</button>
        <button type="button" onClick={() => onScale(0.08)} aria-label="Aumentar figurinha">+</button>
        <button type="button" onClick={() => onOpenSheet('color')}>Cor</button>
        <button type="button" onClick={() => onOpenSheet('style')}>Estilo</button>
        <button type="button" onClick={() => onOpenSheet('align')}>Alinhar</button>
        <button type="button" className="is-close" onClick={onClose} aria-label="Fechar edição">×</button>
      </div>
    </div>
  )
}

function BottomSheet({ mode, selectedStickerMeta, children, onClose }) {
  if (!mode) return null

  const titles = {
    color: 'Cores da figurinha',
    style: 'Estilo da figurinha',
    align: 'Posição e camada',
  }

  return (
    <div className="ff-share-next__sheet" role="dialog" aria-modal="false" aria-label={titles[mode] || 'Editar figurinha'}>
      <div className="ff-share-next__sheet-handle" aria-hidden="true" />
      <header>
        <div>
          <span>{selectedStickerMeta ? `Editando: ${selectedStickerMeta.label}` : 'Edição'}</span>
          <strong>{titles[mode]}</strong>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar painel"><X size={18} /></button>
      </header>
      <div className="ff-share-next__sheet-body">{children}</div>
    </div>
  )
}

function WorkoutShareStudio({ open, session, meta, onClose }) {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const fileInputRef = useRef(null)
  const formatRef = useRef('story')
  const photoTransformRef = useRef(DEFAULT_PHOTO_TRANSFORM)
  const userPhotoRef = useRef(null)
  const stickersRef = useRef(getDefaultStickerState('story'))
  const stickerDragRef = useRef(null)
  const photoPointersRef = useRef(new Map())
  const photoGestureRef = useRef(null)

  const [format, setFormat] = useState('story')
  const [template, setTemplate] = useState('premium')
  const [selectedBackground, setSelectedBackground] = useState('forgeRed')
  const [backgroundMode, setBackgroundMode] = useState('theme')
  const [userPhoto, setUserPhoto] = useState(null)
  const [photoTransform, setPhotoTransform] = useState(DEFAULT_PHOTO_TRANSFORM)
  const [stickers, setStickers] = useState(() => getDefaultStickerState('story'))
  const [selectedStickerId, setSelectedStickerId] = useState('summary')
  const [activeSheet, setActiveSheet] = useState(null)
  const [activeEditLayer, setActiveEditLayer] = useState('stickers')
  const [phraseId, setPhraseId] = useState(0)
  const [customCaption, setCustomCaption] = useState('')
  const [infoLevel, setInfoLevel] = useState('medium')
  const [colorTarget, setColorTarget] = useState('titleColor')
  const [stickerPreviewImages, setStickerPreviewImages] = useState({})
  const [previewIconImage, setPreviewIconImage] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  const selectedFormat = useMemo(() => getFormat(format), [format])
  const stats = useMemo(() => session ? getWorkoutStats(session, meta) : null, [meta, session])
  const caption = customCaption.trim() || SHARE_PHRASES[phraseId] || SHARE_PHRASES[0]
  const selectedSticker = selectedStickerId ? stickers[selectedStickerId] : null
  const selectedStickerMeta = selectedStickerId ? getStickerMeta(selectedStickerId) : null
  const selectedStickerHsl = useMemo(() => hexToHsl(selectedSticker?.[colorTarget] || '#ffffff'), [colorTarget, selectedSticker])
  const visibleStickers = useMemo(() => getVisibleStickerEntries(stickers, format), [format, stickers])
  const shareText = useMemo(() => stats ? buildShareText(stats, caption) : '', [caption, stats])
  const hasPhoto = backgroundMode === 'photo' && Boolean(userPhoto?.src)

  useEffect(() => {
    formatRef.current = format
  }, [format])

  useEffect(() => {
    photoTransformRef.current = photoTransform
  }, [photoTransform])

  useEffect(() => {
    userPhotoRef.current = userPhoto
  }, [userPhoto])

  useEffect(() => {
    stickersRef.current = stickers
  }, [stickers])

  useEffect(() => {
    let active = true
    loadShareImage(forgeflowIcon, { anonymous: true })
      .then((image) => {
        if (active) setPreviewIconImage(image)
      })
      .catch(() => {
        if (active) setPreviewIconImage(null)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!open || !session || !canvasRef.current) return undefined

    let active = true
    setReady(false)

    drawWorkoutShareCanvas(canvasRef.current, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto,
      photoTransform,
      overlayMode: 'none',
      stickers,
    })
      .then(() => {
        if (active) setReady(true)
      })
      .catch((error) => {
        console.error(error)
        if (active) {
          setReady(false)
          setStatus('Não foi possível montar o preview agora.')
        }
      })

    return () => {
      active = false
    }
  }, [backgroundMode, caption, format, infoLevel, meta, open, photoTransform, selectedBackground, session, stickers, template, userPhoto])

  useEffect(() => {
    if (!open || !stats) return

    const next = {}
    visibleStickers.forEach((entry) => {
      next[entry.id] = renderStickerPreviewDataUrl(entry.id, stats, {
        format,
        caption,
        infoLevel,
        accentColor: entry.transform.accentColor,
        iconImage: previewIconImage,
        stickerStyle: entry.transform,
      })
    })
    setStickerPreviewImages(next)
  }, [caption, format, infoLevel, open, previewIconImage, stats, visibleStickers])

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
      setActiveSheet(null)
      photoPointersRef.current.clear()
      photoGestureRef.current = null
      stickerDragRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!userPhoto || backgroundMode !== 'photo') return
    setPhotoTransform((current) => clampPhotoTransform(current, userPhoto, selectedFormat.width, selectedFormat.height))
  }, [backgroundMode, selectedFormat.height, selectedFormat.width, userPhoto])

  if (!open || !session || !stats) return null

  function updateSticker(stickerId, updater) {
    if (!stickerId) return

    setStickers((current) => {
      const previous = current[stickerId] || getDefaultStickerState(formatRef.current)[stickerId]
      const nextRaw = typeof updater === 'function' ? updater(previous) : { ...previous, ...updater }
      return {
        ...current,
        [stickerId]: clampStickerTransform(stickerId, nextRaw, formatRef.current),
      }
    })
  }

  function updateSelectedSticker(updater) {
    if (!selectedStickerId) return
    updateSticker(selectedStickerId, updater)
  }

  function handleFormatChange(nextFormat) {
    if (nextFormat === format) return
    const previousFormat = format
    setFormat(nextFormat)
    setStickers((current) => migrateStickerStateForFormat(current, previousFormat, nextFormat))
    setActiveSheet(null)
  }

  function applyLayoutPreset(layoutId) {
    const preset = STICKER_LAYOUT_PRESETS[format]?.[layoutId]
    if (!preset) return

    setStickers((current) => {
      const next = { ...current }
      SHARE_STICKER_TYPES.forEach((item) => {
        if (!preset[item.id]) return
        next[item.id] = clampStickerTransform(item.id, {
          ...next[item.id],
          ...preset[item.id],
        }, format)
      })
      return next
    })
  }

  function applyStickerPreset(presetId, onlyVisible = false) {
    const preset = STICKER_THEME_PRESETS[presetId]
    if (!preset) return

    if (!onlyVisible) {
      updateSelectedSticker((current) => ({ ...current, ...preset.values }))
      return
    }

    setStickers((current) => {
      const next = { ...current }
      SHARE_STICKER_TYPES.forEach((item) => {
        if (!next[item.id]?.visible) return
        next[item.id] = clampStickerTransform(item.id, {
          ...next[item.id],
          ...preset.values,
        }, format)
      })
      return next
    })
  }

  function applyTemplatePreset(templateId) {
    const preset = TEMPLATE_PRESETS.find((item) => item.id === templateId)
    if (!preset) return

    setTemplate(templateId)
    setSelectedBackground(preset.background)
    setBackgroundMode('theme')
    applyLayoutPreset(preset.layout)
    applyStickerPreset(preset.style, true)
    setStatus(`Template ${preset.label} aplicado.`)
  }

  function toggleSticker(stickerId) {
    const isVisible = Boolean(stickers[stickerId]?.visible)
    updateSticker(stickerId, { visible: !isVisible })

    if (isVisible && selectedStickerId === stickerId) {
      const nextStickers = {
        ...stickers,
        [stickerId]: { ...stickers[stickerId], visible: false },
      }
      setSelectedStickerId(getFirstVisibleStickerId(nextStickers, null))
      setActiveSheet(null)
    } else {
      setSelectedStickerId(stickerId)
      setActiveEditLayer('stickers')
    }
  }

  function resetStickers() {
    const defaults = getDefaultStickerState(format)
    setStickers(defaults)
    setSelectedStickerId(getFirstVisibleStickerId(defaults, 'summary'))
    setActiveSheet(null)
    setStatus('Figurinhas resetadas.')
  }

  function bumpStickerScale(delta) {
    updateSelectedSticker((current) => ({
      ...current,
      scale: clamp(Number(current.scale || 1) + delta, STICKER_MIN_SCALE, STICKER_MAX_SCALE),
    }))
  }

  function updateStickerColor(value) {
    updateSelectedSticker((current) => ({
      ...current,
      [colorTarget]: value,
    }))
  }

  function updateStickerColorFromHsl(part, value) {
    const nextHsl = {
      ...selectedStickerHsl,
      [part]: Number(value),
    }
    updateStickerColor(hslToHex(nextHsl.h, nextHsl.s, nextHsl.l))
  }

  function alignSticker(action) {
    if (!selectedStickerId || !selectedSticker) return

    const margin = format === 'story' ? 54 : 38
    const maxZ = Math.max(...Object.values(stickers).map((item) => Number(item?.zIndex || 1)), 1)
    const minZ = Math.min(...Object.values(stickers).map((item) => Number(item?.zIndex || 1)), 1)
    const bounds = getStickerBounds(selectedStickerId, selectedSticker, format)

    updateSelectedSticker((current) => {
      const next = { ...current }
      if (action === 'left') next.x = margin
      if (action === 'center') next.x = (selectedFormat.width - bounds.width) / 2
      if (action === 'right') next.x = selectedFormat.width - bounds.width - margin
      if (action === 'top') next.y = margin
      if (action === 'middle') next.y = (selectedFormat.height - bounds.height) / 2
      if (action === 'bottom') next.y = selectedFormat.height - bounds.height - margin
      if (action === 'front') next.zIndex = maxZ + 1
      if (action === 'back') next.zIndex = Math.max(1, minZ - 1)
      return next
    })
  }

  function handleStickerPointerDown(event, stickerId) {
    if (event.button !== undefined && event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    setSelectedStickerId(stickerId)
    setActiveEditLayer('stickers')
    setActiveSheet(null)

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Alguns navegadores liberam o capture automaticamente.
    }

    stickerDragRef.current = {
      stickerId,
      startPoint: { clientX: event.clientX, clientY: event.clientY },
      startTransform: stickersRef.current[stickerId],
      previewRect: previewRef.current?.getBoundingClientRect(),
    }
  }

  function handleStickerPointerMove(event) {
    const drag = stickerDragRef.current
    if (!drag || drag.stickerId !== selectedStickerId && drag.stickerId !== event.currentTarget.dataset.stickerId) return
    if (!drag.previewRect) return

    const delta = getPointerCanvasDelta(drag.startPoint, event, drag.previewRect, selectedFormat)
    updateSticker(drag.stickerId, {
      ...drag.startTransform,
      x: Number(drag.startTransform?.x || 0) + delta.x,
      y: Number(drag.startTransform?.y || 0) + delta.y,
    })
  }

  function handleStickerPointerUp(event) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Capture já liberado.
    }
    stickerDragRef.current = null
  }

  function startPhotoGestureSnapshot() {
    const pointers = photoPointersRef.current
    const center = getPointerCenter(pointers)
    photoGestureRef.current = {
      startTransform: photoTransformRef.current,
      startCenter: center,
      startDistance: getPointerDistance(pointers),
      previewRect: previewRef.current?.getBoundingClientRect(),
    }
  }

  function handlePreviewPointerDown(event) {
    if (activeEditLayer !== 'photo' || !hasPhoto) return

    event.preventDefault()
    photoPointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture pode não existir em todos contextos.
    }
    startPhotoGestureSnapshot()
  }

  function handlePreviewPointerMove(event) {
    if (activeEditLayer !== 'photo' || !hasPhoto || !photoPointersRef.current.has(event.pointerId)) return

    photoPointersRef.current.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
    const gesture = photoGestureRef.current
    if (!gesture?.previewRect) return

    const center = getPointerCenter(photoPointersRef.current)
    const delta = getPointerCanvasDelta(gesture.startCenter, center, gesture.previewRect, selectedFormat)
    const distance = getPointerDistance(photoPointersRef.current)
    const scaleRatio = photoPointersRef.current.size > 1 ? distance / Math.max(1, gesture.startDistance) : 1
    const nextTransform = clampPhotoTransform({
      ...gesture.startTransform,
      x: Number(gesture.startTransform.x || 0) + delta.x,
      y: Number(gesture.startTransform.y || 0) + delta.y,
      scale: clamp(Number(gesture.startTransform.scale || 1) * scaleRatio, 0.4, PHOTO_MAX_SCALE),
    }, userPhoto, selectedFormat.width, selectedFormat.height)

    setPhotoTransform(nextTransform)
  }

  function handlePreviewPointerUp(event) {
    if (!photoPointersRef.current.has(event.pointerId)) return

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Capture já liberado.
    }

    photoPointersRef.current.delete(event.pointerId)
    if (photoPointersRef.current.size) {
      startPhotoGestureSnapshot()
    } else {
      photoGestureRef.current = null
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
      setUserPhoto(nextPhoto)
      setBackgroundMode('photo')
      setActiveEditLayer('photo')
      setPhotoTransform(PHOTO_FIT_TRANSFORM)
      setStatus(isLikelyHeicFile(file)
        ? 'Foto HEIC/HEIF convertida e aplicada como fundo.'
        : 'Foto aplicada como fundo. Use dois dedos para ajustar zoom e posição.'
      )
    } catch (error) {
      console.error(error)
      setStatus(error?.message || 'Não foi possível carregar essa foto.')
    }
  }

  function resetPhoto() {
    setPhotoTransform(PHOTO_FIT_TRANSFORM)
    setActiveEditLayer('photo')
  }

  function fillPhoto() {
    setPhotoTransform(DEFAULT_PHOTO_TRANSFORM)
    setActiveEditLayer('photo')
  }

  function removePhoto() {
    setUserPhoto(null)
    setBackgroundMode('theme')
    setActiveEditLayer('stickers')
    setPhotoTransform(DEFAULT_PHOTO_TRANSFORM)
  }

  async function renderExportCanvas() {
    const exportCanvas = document.createElement('canvas')
    await drawWorkoutShareCanvas(exportCanvas, {
      session,
      meta,
      template,
      format,
      infoLevel,
      phrase: caption,
      backgroundMode,
      selectedBackground,
      userPhoto,
      photoTransform,
      overlayMode: 'stickers',
      stickers,
    })
    return exportCanvas
  }

  async function getImageAsset(options = {}) {
    const {
      mimeType = 'image/png',
      quality = 0.95,
      extension = mimeType.includes('jpeg') ? 'jpg' : 'png',
    } = options
    const exportCanvas = await renderExportCanvas()
    const dataUrl = exportCanvas.toDataURL(mimeType, quality)
    const blob = await canvasToBlob(exportCanvas, mimeType, quality)
    const filename = getFileName(session, template, format, extension)
    const file = new File([blob], filename, { type: mimeType })

    return { blob, dataUrl, file, filename, mimeType }
  }

  async function handleShare() {
    if (busy) return

    setBusy(true)
    setStatus('Gerando imagem...')

    try {
      const { file } = await getImageAsset()

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'ForgeFlow', text: shareText, files: [file] })
        setStatus('Compartilhamento aberto com a imagem.')
      } else if (navigator.share) {
        await navigator.share({ title: 'ForgeFlow', text: shareText })
        setStatus('Compartilhamento aberto com a legenda. Use salvar para exportar a imagem.')
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

  async function handleDownload() {
    if (busy) return

    setBusy(true)
    setStatus('Gerando imagem igual ao preview...')

    try {
      const nativeOptions = { mimeType: 'image/jpeg', extension: 'jpg', quality: 0.9 }
      const { blob, dataUrl, file, filename, mimeType } = isNativeApp()
        ? await getImageAsset(nativeOptions)
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
            text: 'Escolha Galeria, Fotos ou Arquivos para salvar/usar a imagem.',
            files: [file],
          })
          setStatus('Use o compartilhamento do sistema para salvar a imagem.')
          return
        }
      }

      if (isMobileShareContext() && canShareImageFile(file)) {
        await navigator.share({
          title: 'Salvar imagem ForgeFlow',
          text: 'Escolha Fotos, Galeria ou Arquivos para salvar/usar a imagem.',
          files: [file],
        })
        setStatus('Imagem gerada. Escolha onde salvar ou postar.')
        return
      }

      triggerImageDownload(blob, filename)
      setStatus('Download da imagem iniciado.')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error)
        try {
          const fallbackCanvas = await renderExportCanvas()
          const fallbackBlob = await canvasToBlob(fallbackCanvas, 'image/png', 0.95)
          const opened = openImageFallback(fallbackBlob)
          setStatus(opened ? 'Imagem aberta em nova aba. Segure/toque nela para salvar.' : 'Não foi possível salvar a imagem.')
        } catch {
          setStatus('Não foi possível salvar a imagem. Tente compartilhar.')
        }
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

  const dialog = (
    <div className="ff-share-studio ff-share-next" role="dialog" aria-modal="true" aria-label="Compartilhar treino">
      <div className="ff-share-next__shell">
        <header className="ff-share-next__header">
          <div>
            <span><Sparkles size={15} /> ForgeFlow Share</span>
            <h2>Compartilhar treino</h2>
            <p>{stats.workoutName} • {stats.volumeLabel} • {stats.durationLabel}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar compartilhamento"><X size={20} /></button>
        </header>

        <div className="ff-share-next__body">
          <section className="ff-share-next__stage-column" aria-label="Preview editável">
            <div className="ff-share-next__format-row">
              {SHARE_FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={format === item.id ? 'is-active' : ''}
                  onClick={() => handleFormatChange(item.id)}
                >
                  {item.id === 'story' ? 'Story 9:16' : 'Feed 1:1'}
                </button>
              ))}
            </div>

            <div
              ref={previewRef}
              className={`ff-share-next__preview${activeEditLayer === 'photo' && hasPhoto ? ' is-photo-editing' : ''}`}
              style={{ aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}` }}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
            >
              <canvas ref={canvasRef} className="ff-share-next__canvas" />

              <div className="ff-share-next__stickers" aria-label="Figurinhas do treino">
                {visibleStickers.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    data-sticker-id={entry.id}
                    className={`ff-share-next__sticker${selectedStickerId === entry.id ? ' is-selected' : ''}`}
                    style={getStickerDomStyleForFormat(entry.id, entry.transform, selectedFormat)}
                    onPointerDown={(event) => handleStickerPointerDown(event, entry.id)}
                    onPointerMove={handleStickerPointerMove}
                    onPointerUp={handleStickerPointerUp}
                    onPointerCancel={handleStickerPointerUp}
                    aria-label={`Editar figurinha ${entry.label}`}
                  >
                    {stickerPreviewImages[entry.id] ? (
                      <img src={stickerPreviewImages[entry.id]} alt="" draggable="false" />
                    ) : (
                      <span>{entry.label}</span>
                    )}
                  </button>
                ))}
              </div>

              {activeEditLayer === 'photo' && hasPhoto && (
                <div className="ff-share-next__photo-hint">Arraste ou use dois dedos na foto</div>
              )}
            </div>

            <CompactStickerBar
              selectedStickerMeta={selectedStickerMeta}
              selectedSticker={selectedSticker}
              onScale={bumpStickerScale}
              onOpenSheet={setActiveSheet}
              onClose={() => {
                setActiveSheet(null)
                setSelectedStickerId(null)
              }}
            />

            <BottomSheet
              mode={activeSheet}
              selectedStickerMeta={selectedStickerMeta}
              onClose={() => setActiveSheet(null)}
            >
              {activeSheet === 'color' && selectedSticker && (
                <div className="ff-share-next__sheet-grid">
                  <SegmentedControl
                    label="Editar cor"
                    options={COLOR_TARGETS}
                    value={colorTarget}
                    onChange={setColorTarget}
                  />

                  <label className="ff-share-next__color-field">
                    <span>{COLOR_TARGETS.find((item) => item.id === colorTarget)?.label}</span>
                    <input
                      type="color"
                      value={selectedSticker[colorTarget] || '#ffffff'}
                      onChange={(event) => updateStickerColor(event.target.value)}
                    />
                    <code>{selectedSticker[colorTarget] || '#ffffff'}</code>
                  </label>

                  <details className="ff-share-next__advanced">
                    <summary>Avançado HSL</summary>
                    <label><span>Matiz</span><input type="range" min="0" max="360" value={selectedStickerHsl.h} onChange={(event) => updateStickerColorFromHsl('h', event.target.value)} /></label>
                    <label><span>Saturação</span><input type="range" min="0" max="100" value={selectedStickerHsl.s} onChange={(event) => updateStickerColorFromHsl('s', event.target.value)} /></label>
                    <label><span>Luz</span><input type="range" min="0" max="100" value={selectedStickerHsl.l} onChange={(event) => updateStickerColorFromHsl('l', event.target.value)} /></label>
                  </details>
                </div>
              )}

              {activeSheet === 'style' && selectedSticker && (
                <div className="ff-share-next__sheet-grid">
                  <div className="ff-share-next__preset-row">
                    {Object.entries(STICKER_THEME_PRESETS).map(([id, preset]) => (
                      <button key={id} type="button" onClick={() => applyStickerPreset(id)}>
                        <i style={{ background: preset.values.backgroundColor, borderColor: preset.values.accentColor }} />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <label className="ff-share-next__range-field">
                    <span>Opacidade fundo <b>{Math.round(Number(selectedSticker.backgroundOpacity ?? 0) * 100)}%</b></span>
                    <input type="range" min="0" max="1" step="0.01" value={selectedSticker.backgroundOpacity ?? 0} onChange={(event) => updateSelectedSticker({ backgroundOpacity: Number(event.target.value) })} />
                  </label>
                  <label className="ff-share-next__range-field">
                    <span>Opacidade borda <b>{Math.round(Number(selectedSticker.borderOpacity ?? 0) * 100)}%</b></span>
                    <input type="range" min="0" max="1" step="0.01" value={selectedSticker.borderOpacity ?? 0} onChange={(event) => updateSelectedSticker({ borderOpacity: Number(event.target.value) })} />
                  </label>
                  <label className="ff-share-next__range-field">
                    <span>Espessura borda <b>{Number(selectedSticker.borderWidth ?? 0).toFixed(1)}px</b></span>
                    <input type="range" min="0" max="8" step="0.5" value={selectedSticker.borderWidth ?? 0} onChange={(event) => updateSelectedSticker({ borderWidth: Number(event.target.value) })} />
                  </label>
                </div>
              )}

              {activeSheet === 'align' && selectedSticker && (
                <div className="ff-share-next__align-grid">
                  <button type="button" onClick={() => alignSticker('left')}>Esquerda</button>
                  <button type="button" onClick={() => alignSticker('center')}>Centro</button>
                  <button type="button" onClick={() => alignSticker('right')}>Direita</button>
                  <button type="button" onClick={() => alignSticker('top')}>Topo</button>
                  <button type="button" onClick={() => alignSticker('middle')}>Meio</button>
                  <button type="button" onClick={() => alignSticker('bottom')}>Base</button>
                  <button type="button" onClick={() => alignSticker('front')}>Frente</button>
                  <button type="button" onClick={() => alignSticker('back')}>Atrás</button>
                </div>
              )}
            </BottomSheet>
          </section>

          <aside className="ff-share-next__controls" aria-label="Controles do editor">
            <Accordion title="Visual do card" subtitle="Formato, template e fundo" icon={<Layers3 size={16} />} defaultOpen>
              <div className="ff-share-next__template-row">
                {TEMPLATE_PRESETS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={template === item.id ? 'is-active' : ''}
                    onClick={() => applyTemplatePreset(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>

              <SegmentedControl
                label="Fundo"
                value={backgroundMode}
                onChange={(value) => {
                  if (value === 'photo' && !userPhoto?.src) {
                    fileInputRef.current?.click()
                    return
                  }
                  setBackgroundMode(value)
                  setActiveEditLayer(value === 'photo' ? 'photo' : 'stickers')
                }}
                options={[
                  { id: 'theme', label: 'Premium' },
                  { id: 'photo', label: 'Foto' },
                ]}
              />

              {backgroundMode === 'theme' && (
                <div className="ff-share-next__background-row">
                  {SHARE_BACKGROUNDS.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={selectedBackground === item.id ? 'is-active' : ''}
                      onClick={() => setSelectedBackground(item.id)}
                    >
                      <i className={`ff-share-next__bg-swatch is-${item.id}`} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <SegmentedControl
                label="Informações"
                value={infoLevel}
                onChange={setInfoLevel}
                options={INFO_LEVELS}
              />
            </Accordion>

            <Accordion title="Figurinhas" subtitle="Mostrar, resetar e organizar" icon={<Move size={16} />} defaultOpen>
              <div className="ff-share-next__edit-mode">
                <button type="button" className={activeEditLayer === 'stickers' ? 'is-active' : ''} onClick={() => setActiveEditLayer('stickers')}>Figurinhas</button>
                <button type="button" className={activeEditLayer === 'photo' ? 'is-active' : ''} onClick={() => {
                  if (!userPhoto?.src) fileInputRef.current?.click()
                  else {
                    setBackgroundMode('photo')
                    setActiveEditLayer('photo')
                  }
                }}>Foto</button>
              </div>

              <div className="ff-share-next__layout-row">
                {LAYOUT_PRESET_LABELS.map((item) => (
                  <button key={item.id} type="button" onClick={() => applyLayoutPreset(item.id)}>{item.label}</button>
                ))}
                <button type="button" onClick={resetStickers}>Resetar</button>
              </div>

              <div className="ff-share-next__sticker-list">
                {SHARE_STICKER_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${stickers[item.id]?.visible ? 'is-active' : ''}${selectedStickerId === item.id ? ' is-selected' : ''}`}
                    onClick={() => toggleSticker(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <small>{stickers[item.id]?.visible ? 'Visível' : 'Oculta'}</small>
                  </button>
                ))}
              </div>
            </Accordion>

            <Accordion title="Foto" subtitle="Galeria e ajuste" icon={<ImagePlus size={16} />} defaultOpen={backgroundMode === 'photo'}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                className="sr-only"
                onChange={handlePhotoChange}
              />

              <button type="button" className="ff-share-next__photo-card" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={20} />
                <span>
                  <strong>{userPhoto ? userPhoto.name : 'Selecionar foto da galeria'}</strong>
                  <small>{userPhoto ? 'Toque para trocar a foto.' : 'JPG, PNG, WEBP e HEIC/HEIF no APK com bridge nativa.'}</small>
                </span>
              </button>

              {userPhoto && (
                <div className="ff-share-next__photo-tools">
                  <button type="button" onClick={fillPhoto}>Preencher</button>
                  <button type="button" onClick={resetPhoto}>Ajustar</button>
                  <button type="button" onClick={removePhoto}>Remover</button>
                </div>
              )}
            </Accordion>

            <Accordion title="Mensagem" subtitle="Legenda do card e post" icon={<MessageCircle size={16} />}>
              <label className="ff-share-next__caption-field">
                <span>Mensagem opcional</span>
                <textarea
                  value={customCaption}
                  onChange={(event) => setCustomCaption(event.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="Ex: treino pago, progresso construído."
                />
              </label>

              <div className="ff-share-next__phrase-row">
                {SHARE_PHRASES.slice(0, 8).map((phrase, index) => (
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
            </Accordion>

            <div className="ff-share-next__stats">
              <span><strong>{stats.completedSetCount}</strong><small>séries</small></span>
              <span><strong>{stats.exerciseCount}</strong><small>exercícios</small></span>
              <span><strong>{stats.prCount}</strong><small>PRs</small></span>
            </div>
          </aside>
        </div>

        {status && (
          <p className="ff-share-next__status">
            <CheckCircle2 size={16} />
            {status}
          </p>
        )}

        <footer className="ff-share-next__footer">
          <Button type="button" onClick={handleShare} disabled={busy || !ready} className="ff-share-next__primary">
            <Share2 size={18} />
            {busy ? 'Preparando...' : 'Compartilhar'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleDownload} disabled={busy || !ready}>
            <Download size={18} />
            Salvar
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
