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

const SHARE_STICKER_TYPES = [
  {
    id: 'summary',
    label: 'Resumo',
    description: 'Nome do treino, data e duração.',
    defaultVisible: true,
  },
  {
    id: 'metrics',
    label: 'Métricas',
    description: 'Duração, volume, reps, séries, exercícios e PRs.',
    defaultVisible: true,
  },
  {
    id: 'exerciseList',
    label: 'Lista de exercícios',
    description: 'Lista limpa no estilo Hevy.',
    defaultVisible: true,
  },
  {
    id: 'setsReps',
    label: 'Séries e reps',
    description: 'Resumo de séries e repetições por exercício.',
    defaultVisible: false,
  },
  {
    id: 'weights',
    label: 'Pesos',
    description: 'Maiores cargas usadas no treino.',
    defaultVisible: false,
  },
  {
    id: 'topSet',
    label: 'Melhor série',
    description: 'Destaque da melhor série ou maior carga.',
    defaultVisible: false,
  },
  {
    id: 'repTotal',
    label: 'Reps totais',
    description: 'Total de repetições concluídas no treino.',
    defaultVisible: false,
  },
  {
    id: 'volume',
    label: 'Volume total',
    description: 'Destaque grande para volume total.',
    defaultVisible: true,
  },
  {
    id: 'prs',
    label: 'PRs',
    description: 'Recordes do treino, quando existirem.',
    defaultVisible: false,
  },
  {
    id: 'location',
    label: 'Local/data',
    description: 'Local do treino e data curta.',
    defaultVisible: false,
  },
  {
    id: 'caption',
    label: 'Frase',
    description: 'Mensagem curta para complementar a foto.',
    defaultVisible: false,
  },
]

const STICKER_DEFAULTS = {
  story: {
    summary: { x: 70, y: 126, scale: 1 },
    caption: { x: 70, y: 540, scale: 1 },
    location: { x: 620, y: 548, scale: 0.94 },
    exerciseList: { x: 70, y: 770, scale: 1 },
    prs: { x: 620, y: 770, scale: 0.92 },
    setsReps: { x: 70, y: 1160, scale: 1 },
    weights: { x: 565, y: 1160, scale: 1 },
    topSet: { x: 70, y: 1492, scale: 0.95 },
    repTotal: { x: 560, y: 1492, scale: 0.95 },
    volume: { x: 70, y: 1692, scale: 0.9 },
    metrics: { x: 70, y: 1804, scale: 0.9 },
  },
  feed: {
    summary: { x: 58, y: 58, scale: 0.82 },
    caption: { x: 58, y: 164, scale: 0.72 },
    location: { x: 642, y: 164, scale: 0.68 },
    exerciseList: { x: 58, y: 250, scale: 0.78 },
    prs: { x: 642, y: 250, scale: 0.68 },
    setsReps: { x: 58, y: 580, scale: 0.72 },
    weights: { x: 562, y: 580, scale: 0.72 },
    topSet: { x: 58, y: 804, scale: 0.72 },
    repTotal: { x: 466, y: 804, scale: 0.72 },
    volume: { x: 58, y: 914, scale: 0.62 },
    metrics: { x: 58, y: 964, scale: 0.62 },
  },
}

const STICKER_CANVAS_SIZE = {
  story: {
    summary: { width: 650, height: 150 },
    metrics: { width: 940, height: 175 },
    exerciseList: { width: 610, height: 365 },
    setsReps: { width: 455, height: 315 },
    weights: { width: 445, height: 315 },
    topSet: { width: 430, height: 182 },
    repTotal: { width: 380, height: 182 },
    volume: { width: 560, height: 210 },
    prs: { width: 360, height: 332 },
    location: { width: 390, height: 130 },
    caption: { width: 500, height: 132 },
  },
  feed: {
    summary: { width: 650, height: 140 },
    metrics: { width: 940, height: 160 },
    exerciseList: { width: 610, height: 320 },
    setsReps: { width: 455, height: 260 },
    weights: { width: 445, height: 260 },
    topSet: { width: 400, height: 168 },
    repTotal: { width: 350, height: 168 },
    volume: { width: 560, height: 190 },
    prs: { width: 320, height: 292 },
    location: { width: 320, height: 118 },
    caption: { width: 560, height: 118 },
  },
}

const STICKER_MIN_SCALE = 0.45
const STICKER_MAX_SCALE = 2.15

const DEFAULT_STICKER_APPEARANCE = {
  accentColor: '#ef4444',
  titleColor: '#ffffff',
  textColor: '#cbd5e1',
  backgroundColor: '#05070a',
  backgroundOpacity: 0.72,
  borderColor: '#ffffff',
  borderOpacity: 0.16,
  borderWidth: 2,
  zIndex: 1,
}


const STICKER_LAYOUT_PRESETS = {
  story: {
    balanced: {
      summary: { x: 68, y: 118, scale: 1 },
      caption: { x: 68, y: 316, scale: 0.92 },
      location: { x: 650, y: 320, scale: 0.86 },
      exerciseList: { x: 68, y: 546, scale: 0.94 },
      prs: { x: 650, y: 556, scale: 0.86 },
      setsReps: { x: 68, y: 972, scale: 0.92 },
      weights: { x: 560, y: 972, scale: 0.92 },
      topSet: { x: 68, y: 1316, scale: 0.9 },
      repTotal: { x: 524, y: 1316, scale: 0.9 },
      volume: { x: 68, y: 1540, scale: 0.86 },
      metrics: { x: 68, y: 1728, scale: 0.84 },
    },
    compact: {
      summary: { x: 70, y: 124, scale: 0.94 },
      caption: { x: 70, y: 312, scale: 0.84 },
      location: { x: 680, y: 320, scale: 0.78 },
      exerciseList: { x: 70, y: 520, scale: 0.88 },
      prs: { x: 700, y: 532, scale: 0.78 },
      setsReps: { x: 70, y: 910, scale: 0.82 },
      weights: { x: 570, y: 910, scale: 0.82 },
      topSet: { x: 70, y: 1188, scale: 0.82 },
      repTotal: { x: 520, y: 1188, scale: 0.82 },
      volume: { x: 70, y: 1424, scale: 0.78 },
      metrics: { x: 70, y: 1606, scale: 0.76 },
    },
    hero: {
      summary: { x: 70, y: 118, scale: 1.02 },
      caption: { x: 70, y: 300, scale: 0.92 },
      prs: { x: 690, y: 302, scale: 0.98 },
      topSet: { x: 70, y: 546, scale: 1.02 },
      repTotal: { x: 540, y: 546, scale: 1.02 },
      volume: { x: 70, y: 770, scale: 0.95 },
      metrics: { x: 70, y: 978, scale: 0.9 },
      exerciseList: { x: 70, y: 1206, scale: 0.84 },
      weights: { x: 70, y: 1608, scale: 0.78 },
      setsReps: { x: 540, y: 1608, scale: 0.78 },
      location: { x: 678, y: 1206, scale: 0.76 },
    },
    analytics: {
      summary: { x: 70, y: 120, scale: 0.94 },
      metrics: { x: 70, y: 296, scale: 0.9 },
      volume: { x: 70, y: 500, scale: 0.9 },
      topSet: { x: 70, y: 724, scale: 0.9 },
      repTotal: { x: 536, y: 724, scale: 0.9 },
      setsReps: { x: 70, y: 960, scale: 0.88 },
      weights: { x: 560, y: 960, scale: 0.88 },
      prs: { x: 694, y: 1308, scale: 0.84 },
      exerciseList: { x: 70, y: 1308, scale: 0.86 },
      caption: { x: 70, y: 1712, scale: 0.82 },
      location: { x: 626, y: 1716, scale: 0.74 },
    },
  },
  feed: {
    balanced: {
      summary: { x: 56, y: 54, scale: 0.78 },
      caption: { x: 56, y: 180, scale: 0.66 },
      location: { x: 650, y: 180, scale: 0.6 },
      exerciseList: { x: 56, y: 282, scale: 0.72 },
      prs: { x: 650, y: 282, scale: 0.62 },
      setsReps: { x: 56, y: 610, scale: 0.68 },
      weights: { x: 555, y: 610, scale: 0.68 },
      topSet: { x: 56, y: 844, scale: 0.68 },
      repTotal: { x: 470, y: 844, scale: 0.68 },
      volume: { x: 56, y: 956, scale: 0.58 },
      metrics: { x: 56, y: 1004, scale: 0.58 },
    },
    compact: {
      summary: { x: 56, y: 54, scale: 0.72 },
      caption: { x: 56, y: 164, scale: 0.58 },
      location: { x: 670, y: 164, scale: 0.56 },
      exerciseList: { x: 56, y: 250, scale: 0.66 },
      prs: { x: 680, y: 254, scale: 0.56 },
      setsReps: { x: 56, y: 544, scale: 0.62 },
      weights: { x: 562, y: 544, scale: 0.62 },
      topSet: { x: 56, y: 756, scale: 0.6 },
      repTotal: { x: 470, y: 756, scale: 0.6 },
      volume: { x: 56, y: 872, scale: 0.52 },
      metrics: { x: 56, y: 930, scale: 0.52 },
    },
    hero: {
      summary: { x: 56, y: 52, scale: 0.78 },
      caption: { x: 56, y: 166, scale: 0.62 },
      prs: { x: 714, y: 168, scale: 0.64 },
      topSet: { x: 56, y: 286, scale: 0.74 },
      repTotal: { x: 470, y: 286, scale: 0.74 },
      volume: { x: 56, y: 474, scale: 0.66 },
      metrics: { x: 56, y: 598, scale: 0.66 },
      exerciseList: { x: 56, y: 720, scale: 0.66 },
      setsReps: { x: 56, y: 980, scale: 0.6 },
      weights: { x: 562, y: 980, scale: 0.6 },
      location: { x: 700, y: 720, scale: 0.56 },
    },
    analytics: {
      summary: { x: 56, y: 54, scale: 0.72 },
      metrics: { x: 56, y: 164, scale: 0.64 },
      volume: { x: 56, y: 246, scale: 0.62 },
      topSet: { x: 56, y: 382, scale: 0.62 },
      repTotal: { x: 470, y: 382, scale: 0.62 },
      setsReps: { x: 56, y: 560, scale: 0.6 },
      weights: { x: 562, y: 560, scale: 0.6 },
      prs: { x: 690, y: 776, scale: 0.56 },
      exerciseList: { x: 56, y: 776, scale: 0.62 },
      caption: { x: 56, y: 1010, scale: 0.56 },
      location: { x: 694, y: 1012, scale: 0.5 },
    },
  },
}


const STICKER_THEME_PRESETS = {
  glass: {
    label: 'Glass',
    values: {
      titleColor: '#ffffff',
      textColor: '#cbd5e1',
      accentColor: '#ef4444',
      backgroundColor: '#05070a',
      backgroundOpacity: 0.64,
      borderColor: '#ffffff',
      borderOpacity: 0.16,
      borderWidth: 2,
    },
  },
  clean: {
    label: 'Clean',
    values: {
      titleColor: '#111827',
      textColor: '#475569',
      accentColor: '#ef4444',
      backgroundColor: '#ffffff',
      backgroundOpacity: 0.92,
      borderColor: '#ffffff',
      borderOpacity: 0.62,
      borderWidth: 1.5,
    },
  },
  redBold: {
    label: 'Bold Red',
    values: {
      titleColor: '#ffffff',
      textColor: '#fecaca',
      accentColor: '#ef4444',
      backgroundColor: '#1a0505',
      backgroundOpacity: 0.84,
      borderColor: '#ef4444',
      borderOpacity: 0.34,
      borderWidth: 2.5,
    },
  },
  minimal: {
    label: 'Minimal',
    values: {
      titleColor: '#ffffff',
      textColor: '#e5e7eb',
      accentColor: '#ffffff',
      backgroundColor: '#111827',
      backgroundOpacity: 0.22,
      borderColor: '#ffffff',
      borderOpacity: 0.08,
      borderWidth: 1,
    },
  },
  transparent: {
    label: 'Transparente',
    values: {
      titleColor: '#ffffff',
      textColor: '#f8fafc',
      accentColor: '#ef4444',
      backgroundColor: '#05070a',
      backgroundOpacity: 0,
      borderColor: '#ffffff',
      borderOpacity: 0,
      borderWidth: 0,
    },
  },
}

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

function normalizeHexColor(value, fallback) {
  const input = String(value || '').trim()
  if (/^#[0-9a-f]{6}$/i.test(input)) return input
  if (/^#[0-9a-f]{3}$/i.test(input)) {
    return `#${input[1]}${input[1]}${input[2]}${input[2]}${input[3]}${input[3]}`
  }
  return fallback
}

function hexToRgba(hex, alpha = 1) {
  const safeHex = normalizeHexColor(hex, '#05070a').slice(1)
  const r = parseInt(safeHex.slice(0, 2), 16)
  const g = parseInt(safeHex.slice(2, 4), 16)
  const b = parseInt(safeHex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${clamp(safeNumber(alpha), 0.08, 1)})`
}

function getStickerAppearance(sticker = {}) {
  return {
    accentColor: normalizeHexColor(sticker?.accentColor, DEFAULT_STICKER_APPEARANCE.accentColor),
    titleColor: normalizeHexColor(sticker?.titleColor, DEFAULT_STICKER_APPEARANCE.titleColor),
    textColor: normalizeHexColor(sticker?.textColor, DEFAULT_STICKER_APPEARANCE.textColor),
    backgroundColor: normalizeHexColor(sticker?.backgroundColor, DEFAULT_STICKER_APPEARANCE.backgroundColor),
    backgroundOpacity: clamp(Number(sticker?.backgroundOpacity ?? DEFAULT_STICKER_APPEARANCE.backgroundOpacity), 0, 1),
    borderColor: normalizeHexColor(sticker?.borderColor, DEFAULT_STICKER_APPEARANCE.borderColor),
    borderOpacity: clamp(Number(sticker?.borderOpacity ?? DEFAULT_STICKER_APPEARANCE.borderOpacity), 0, 1),
    borderWidth: clamp(Number(sticker?.borderWidth ?? DEFAULT_STICKER_APPEARANCE.borderWidth), 0, 8),
  }
}

function hexToHsl(hex) {
  const safeHex = normalizeHexColor(hex, '#ffffff').slice(1)
  const r = parseInt(safeHex.slice(0, 2), 16) / 255
  const g = parseInt(safeHex.slice(2, 4), 16) / 255
  const b = parseInt(safeHex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  const d = max - min

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / d + 2) * 60
        break
      default:
        h = ((r - g) / d + 4) * 60
        break
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToHex(h, s, l) {
  const hue = ((Number(h) % 360) + 360) % 360
  const sat = clamp(Number(s), 0, 100) / 100
  const lig = clamp(Number(l), 0, 100) / 100
  const c = (1 - Math.abs(2 * lig - 1)) * sat
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1))
  const m = lig - c / 2
  let channels

  if (hue < 60) channels = [c, x, 0]
  else if (hue < 120) channels = [x, c, 0]
  else if (hue < 180) channels = [0, c, x]
  else if (hue < 240) channels = [0, x, c]
  else if (hue < 300) channels = [x, 0, c]
  else channels = [c, 0, x]

  const [r1, g1, b1] = channels
  const toHex = (value) => Math.round((value + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`
}

function getWorkingSets(exercise = {}) {
  return (Array.isArray(exercise.sets) ? exercise.sets : [])
    .filter((set) => {
      const weight = safeNumber(set.weight)
      const reps = safeNumber(set.reps)
      return set.completed !== false && (weight > 0 || reps > 0)
    })
    .map((set, index) => ({
      ...set,
      setNumber: set.setNumber || index + 1,
      weight: safeNumber(set.weight),
      reps: safeNumber(set.reps),
      volume: safeNumber(set.weight) * safeNumber(set.reps),
    }))
}


function formatSetShort(set = {}) {
  const safeSet = set || {}
  const weight = safeNumber(safeSet.weight)
  const reps = safeNumber(safeSet.reps)
  if (weight && reps) return `${weight}kg × ${reps}`
  if (reps) return `${reps} reps`
  if (weight) return `${weight}kg`
  return 'sem dados'
}

function getExerciseSummary(exercise = {}) {
  const name = getExerciseName(exercise)
  const sets = getWorkingSets(exercise)
  const totalReps = sets.reduce((total, set) => total + safeNumber(set.reps), 0)
  const volume = sets.reduce((total, set) => total + safeNumber(set.volume), 0)
  const bestWeightSet = sets.reduce((best, set) => safeNumber(set.weight) > safeNumber(best?.weight) ? set : best, null)
  const bestVolumeSet = sets.reduce((best, set) => safeNumber(set.volume) > safeNumber(best?.volume) ? set : best, null)
  const repsText = sets.slice(0, 5).map((set) => safeNumber(set.reps)).filter(Boolean).join(' / ')
  const weightsText = sets.slice(0, 5).map((set) => safeNumber(set.weight) ? `${safeNumber(set.weight)}kg` : '').filter(Boolean).join(' / ')

  return {
    name,
    sets,
    setCount: sets.length,
    totalReps,
    volume,
    bestWeight: safeNumber(bestWeightSet?.weight),
    bestWeightSet,
    bestVolumeSet,
    repsText,
    weightsText,
    line: `${sets.length || 0}x • ${repsText || 'sem reps'}${weightsText ? ` • ${weightsText}` : ''}`,
  }
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
  const exerciseSummaries = exercises.map(getExerciseSummary).filter((item) => item.name)
  const topExercises = exerciseSummaries.map((item) => item.name).filter(Boolean)
  const weightRows = completedSets
    .filter((set) => safeNumber(set.weight) > 0)
    .sort((a, b) => safeNumber(b.weight) - safeNumber(a.weight))
    .slice(0, 6)
  const repRows = exerciseSummaries
    .filter((item) => item.setCount > 0)
    .slice(0, 6)
  const totalReps = completedSets.reduce((total, set) => total + safeNumber(set.reps), 0)
  const averageRepsPerSet = completedSets.length ? Math.round((totalReps / completedSets.length) * 10) / 10 : 0
  const averageVolumePerSet = completedSets.length ? Math.round(sessionVolume / completedSets.length) : 0

  return {
    workoutName: session.workoutName || session.name || 'Treino ForgeFlow',
    dateLabel: formatDate(finishedDate),
    dateShortLabel: getShortDate(finishedDate),
    durationLabel: formatTime(session.duration || session.durationSeconds || 0),
    volume: sessionVolume,
    volumeLabel: formatVolume(sessionVolume),
    exerciseCount: exercises.length,
    completedSetCount: completedSets.length,
    totalReps,
    averageRepsPerSet,
    averageVolumePerSet,
    prCount: sessionPRs.length,
    prs: sessionPRs,
    topExercises: topExercises.slice(0, 6),
    exerciseSummaries,
    weightRows,
    repRows,
    completedSets,
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
    lineWidth = 2,
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
  ctx.lineWidth = lineWidth
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
  ctx.fillStyle = 'rgba(255,255,255,0.68)'
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
    { label: 'Reps', value: String(stats.totalReps) },
    { label: 'Exercícios', value: String(stats.exerciseCount) },
    { label: 'PRs', value: String(stats.prCount) },
  ]

  if (infoLevel === 'medium') return medium

  return [
    ...medium,
    { label: 'Séries', value: String(stats.completedSetCount) },
    { label: 'Média reps', value: String(stats.averageRepsPerSet).replace('.', ',') },
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

function getDefaultStickerState(format = 'story') {
  const defaults = STICKER_DEFAULTS[format] || STICKER_DEFAULTS.story

  return SHARE_STICKER_TYPES.reduce((acc, sticker, index) => {
    acc[sticker.id] = {
      ...DEFAULT_STICKER_APPEARANCE,
      visible: sticker.defaultVisible,
      zIndex: index + 1,
      ...(defaults[sticker.id] || { x: 70, y: 70, scale: 1 }),
    }
    return acc
  }, {})
}

function migrateStickerStateForFormat(currentState, fromFormat = 'story', toFormat = 'story') {
  const from = SHARE_FORMATS.find((item) => item.id === fromFormat) || SHARE_FORMATS[0]
  const to = SHARE_FORMATS.find((item) => item.id === toFormat) || SHARE_FORMATS[0]
  const fallback = getDefaultStickerState(toFormat)
  const ratioX = to.width / from.width
  const ratioY = to.height / from.height

  return SHARE_STICKER_TYPES.reduce((acc, sticker) => {
    const current = currentState?.[sticker.id]
    const nextFallback = fallback[sticker.id]
    acc[sticker.id] = {
      ...DEFAULT_STICKER_APPEARANCE,
      ...nextFallback,
      ...current,
      x: current ? safeNumber(current.x) * ratioX : nextFallback.x,
      y: current ? safeNumber(current.y) * ratioY : nextFallback.y,
      scale: clamp(safeNumber(current?.scale) || nextFallback.scale || 1, STICKER_MIN_SCALE, STICKER_MAX_SCALE),
      visible: current ? Boolean(current.visible) : Boolean(nextFallback.visible),
      zIndex: clamp(Math.round(Number(current?.zIndex ?? nextFallback.zIndex ?? 1)), 1, 999),
    }
    return acc
  }, {})
}

function getStickerCanvasSize(stickerId, format = 'story') {
  return STICKER_CANVAS_SIZE[format]?.[stickerId] || STICKER_CANVAS_SIZE.story.summary
}

function clampStickerTransform(stickerId, transform, format = 'story') {
  const selectedFormat = SHARE_FORMATS.find((item) => item.id === format) || SHARE_FORMATS[0]
  const size = getStickerCanvasSize(stickerId, selectedFormat.id)
  const appearance = getStickerAppearance(transform)
  const scale = clamp(safeNumber(transform?.scale) || 1, STICKER_MIN_SCALE, STICKER_MAX_SCALE)
  const width = size.width * scale
  const height = size.height * scale
  const margin = 26

  return {
    ...appearance,
    x: clamp(safeNumber(transform?.x), -width + margin, selectedFormat.width - margin),
    y: clamp(safeNumber(transform?.y), -height + margin, selectedFormat.height - margin),
    scale,
    visible: transform?.visible !== false,
    zIndex: clamp(Math.round(Number(transform?.zIndex ?? 1)), 1, 999),
  }
}

function getStickerBounds(stickerId, transform, format = 'story') {
  const size = getStickerCanvasSize(stickerId, format)
  const safe = clampStickerTransform(stickerId, transform, format)

  return {
    left: safe.x,
    top: safe.y,
    right: safe.x + size.width * safe.scale,
    bottom: safe.y + size.height * safe.scale,
    width: size.width * safe.scale,
    height: size.height * safe.scale,
    centerX: safe.x + size.width * safe.scale / 2,
    centerY: safe.y + size.height * safe.scale / 2,
  }
}

function getStickerSnap(transform, stickerId, format = 'story', stickers = {}) {
  const selectedFormat = SHARE_FORMATS.find((item) => item.id === format) || SHARE_FORMATS[0]
  const threshold = Math.max(18, Math.min(selectedFormat.width, selectedFormat.height) * 0.026)
  const next = clampStickerTransform(stickerId, transform, selectedFormat.id)
  const size = getStickerCanvasSize(stickerId, selectedFormat.id)
  const guide = { x: null, y: null, bottom: false }
  let bounds = getStickerBounds(stickerId, next, selectedFormat.id)
  const margin = 40
  const otherBounds = getVisibleStickerEntries(stickers, format)
    .filter((entry) => entry.id !== stickerId)
    .map((entry) => getStickerBounds(entry.id, entry.transform, format))

  const xTargets = [
    { key: 'left', value: margin, mode: 'left' },
    { key: 'center', value: selectedFormat.width / 2, mode: 'center' },
    { key: 'right', value: selectedFormat.width - margin, mode: 'right' },
  ]
  const yTargets = [
    { key: 'top', value: margin, mode: 'top' },
    { key: 'middle', value: selectedFormat.height / 2, mode: 'center' },
    { key: 'bottom', value: getStickerBottomTarget(selectedFormat.id, selectedFormat.width, selectedFormat.height), mode: 'bottom' },
  ]

  otherBounds.forEach((peer) => {
    xTargets.push(
      { key: 'peer-left', value: peer.left, mode: 'left' },
      { key: 'peer-center', value: peer.centerX, mode: 'center' },
      { key: 'peer-right', value: peer.right, mode: 'right' },
    )
    yTargets.push(
      { key: 'peer-top', value: peer.top, mode: 'top' },
      { key: 'peer-middle', value: peer.centerY, mode: 'center' },
      { key: 'peer-bottom', value: peer.bottom, mode: 'bottom' },
    )
  })

  let bestX = null
  const xCandidates = [
    { mode: 'left', value: bounds.left },
    { mode: 'center', value: bounds.centerX },
    { mode: 'right', value: bounds.right },
  ]
  xTargets.forEach((target) => {
    xCandidates.forEach((candidate) => {
      if (candidate.mode !== target.mode) return
      const distance = Math.abs(candidate.value - target.value)
      if (distance <= threshold && (!bestX || distance < bestX.distance)) {
        bestX = { target, distance }
      }
    })
  })
  if (bestX) {
    if (bestX.target.mode === 'left') next.x = bestX.target.value
    if (bestX.target.mode === 'center') next.x = bestX.target.value - (size.width * next.scale) / 2
    if (bestX.target.mode === 'right') next.x = bestX.target.value - size.width * next.scale
    guide.x = (bestX.target.value / selectedFormat.width) * 100
    bounds = getStickerBounds(stickerId, next, selectedFormat.id)
  }

  let bestY = null
  const yCandidates = [
    { mode: 'top', value: bounds.top },
    { mode: 'center', value: bounds.centerY },
    { mode: 'bottom', value: bounds.bottom },
  ]
  yTargets.forEach((target) => {
    yCandidates.forEach((candidate) => {
      if (candidate.mode !== target.mode) return
      const distance = Math.abs(candidate.value - target.value)
      if (distance <= threshold && (!bestY || distance < bestY.distance)) {
        bestY = { target, distance }
      }
    })
  })
  if (bestY) {
    if (bestY.target.mode === 'top') next.y = bestY.target.value
    if (bestY.target.mode === 'center') next.y = bestY.target.value - (size.height * next.scale) / 2
    if (bestY.target.mode === 'bottom') next.y = bestY.target.value - size.height * next.scale
    guide.y = (bestY.target.value / selectedFormat.height) * 100
    guide.bottom = bestY.target.key.includes('bottom')
  }

  return {
    transform: clampStickerTransform(stickerId, next, selectedFormat.id),
    guide,
  }
}

function getVisibleStickerEntries(stickers = {}, format = 'story') {
  return SHARE_STICKER_TYPES
    .map((type) => {
      const transform = stickers[type.id]
      if (!transform?.visible) return null
      return {
        ...type,
        transform: clampStickerTransform(type.id, transform, format),
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.transform.zIndex || 1) - (b.transform.zIndex || 1))
}

function getStickerDomStyleForFormat(stickerId, transform, selectedFormat) {
  const currentFormat = selectedFormat || SHARE_FORMATS[0]
  const safe = clampStickerTransform(stickerId, transform, currentFormat.id)
  const size = getStickerCanvasSize(stickerId, currentFormat.id)

  return {
    left: `${(safe.x / currentFormat.width) * 100}%`,
    top: `${(safe.y / currentFormat.height) * 100}%`,
    width: `${(size.width / currentFormat.width) * 100}%`,
    transform: `scale(${safe.scale})`,
    '--ff-sticker-accent': safe.accentColor,
    '--ff-sticker-title': safe.titleColor,
    '--ff-sticker-text': safe.textColor,
    '--ff-sticker-bg': hexToRgba(safe.backgroundColor, safe.backgroundOpacity),
    '--ff-sticker-border': hexToRgba(safe.borderColor, safe.borderOpacity),
    '--ff-sticker-border-width': `${safe.borderWidth}px`,
    zIndex: safe.zIndex,
  }
}

function drawStickerHeader(ctx, title, subtitle, width, accentColor, options = {}) {
  const { darkText = false, x = 28, y = 42 } = options
  ctx.fillStyle = accentColor
  ctx.font = '950 24px Inter, Arial, sans-serif'
  ctx.fillText(truncateText(ctx, String(title || '').toUpperCase(), width - x * 2), x, y)

  if (subtitle) {
    ctx.fillStyle = darkText ? 'rgba(15,17,21,0.62)' : 'rgba(255,255,255,0.62)'
    ctx.font = '850 20px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, subtitle, width - x * 2), x, y + 31)
  }
}

function drawStickerPanelBase(ctx, width, height, options = {}) {
  const {
    radius = 34,
    fill = 'rgba(7,9,13,0.72)',
    stroke = 'rgba(255,255,255,0.16)',
    shadow = true,
    lineWidth = 2,
  } = options

  drawGlassPanel(ctx, 0, 0, width, height, radius, { fill, stroke, shadow, lineWidth })
}

function drawListRows(ctx, rows, x, y, width, options = {}) {
  const {
    maxRows = 5,
    lineHeight = 43,
    titleSize = 25,
    metaSize = 19,
    accentColor = '#ef4444',
    bullet = true,
    darkText = false,
  } = options
  const visible = rows.slice(0, maxRows)

  visible.forEach((row, index) => {
    const rowY = y + index * lineHeight
    const title = typeof row === 'string' ? row : row.title
    const meta = typeof row === 'string' ? '' : row.meta

    if (bullet) {
      ctx.beginPath()
      ctx.arc(x + 7, rowY - 8, 5, 0, Math.PI * 2)
      ctx.fillStyle = accentColor
      ctx.fill()
    }

    ctx.fillStyle = darkText ? '#111827' : '#ffffff'
    ctx.font = `920 ${titleSize}px Inter, Arial, sans-serif`
    ctx.fillText(truncateText(ctx, title, width - (bullet ? 28 : 0)), x + (bullet ? 24 : 0), rowY)

    if (meta) {
      ctx.fillStyle = darkText ? 'rgba(15,23,42,0.58)' : 'rgba(255,255,255,0.58)'
      ctx.font = `820 ${metaSize}px Inter, Arial, sans-serif`
      ctx.fillText(truncateText(ctx, meta, width - (bullet ? 28 : 0)), x + (bullet ? 24 : 0), rowY + 26)
    }
  })

  if (rows.length > maxRows) {
    ctx.fillStyle = darkText ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.52)'
    ctx.font = `850 ${metaSize}px Inter, Arial, sans-serif`
    ctx.fillText(`+${rows.length - maxRows} itens`, x + (bullet ? 24 : 0), y + visible.length * lineHeight)
  }
}

function getStickerRows(stickerId, stats) {
  if (stickerId === 'exerciseList') {
    return stats.exerciseSummaries.slice(0, 8).map((item) => ({
      title: item.name,
      meta: `${item.setCount || 0} séries${item.totalReps ? ` • ${item.totalReps} reps` : ''}`,
    }))
  }

  if (stickerId === 'setsReps') {
    return stats.repRows.slice(0, 7).map((item) => ({
      title: item.name,
      meta: `${item.setCount || 0} séries • ${item.repsText || `${item.totalReps || 0} reps`}`,
    }))
  }

  if (stickerId === 'weights') {
    return stats.exerciseSummaries
      .filter((item) => item.bestWeight > 0)
      .sort((a, b) => safeNumber(b.bestWeight) - safeNumber(a.bestWeight))
      .slice(0, 7)
      .map((item) => ({
        title: item.name,
        meta: item.weightsText || `${item.bestWeight}kg`,
      }))
  }

  if (stickerId === 'prs') {
    return stats.prs.slice(0, 5).map((pr) => ({
      title: pr.exerciseName || pr.exercise || 'PR',
      meta: `${pr.label || 'Recorde'} • ${getPrDisplayValue(pr)}`,
    }))
  }

  return []
}

function drawSingleWorkoutSticker(ctx, stickerId, stats, options = {}) {
  const { format, caption, infoLevel, accentColor = '#ef4444', iconImage, stickerStyle } = options
  const appearance = getStickerAppearance(stickerStyle)
  const stickerAccent = appearance.accentColor || accentColor
  const stickerTitle = appearance.titleColor || '#ffffff'
  const stickerText = appearance.textColor || appearance.titleColor || '#cbd5e1'
  const stickerFill = hexToRgba(appearance.backgroundColor, appearance.backgroundOpacity)
  const resolvedAccent = stickerAccent
  const titleColor = stickerTitle
  const textColor = hexToRgba(stickerText, 0.72)
  const surface = {
    background: stickerFill,
    border: hexToRgba(stickerAccent, 0.22),
    chip: hexToRgba('#ffffff', 0.12),
  }
  const size = getStickerCanvasSize(stickerId, format)
  const { width, height } = size

  ctx.save()

  if (stickerId === 'summary') {
    drawStickerPanelBase(ctx, width, height, { fill: stickerFill, stroke: surface.border, lineWidth: surface.borderWidth, radius: 36 })
    if (iconImage) {
      drawRoundRect(ctx, 24, 28, 66, 66, 18)
      ctx.save()
      ctx.clip()
      ctx.drawImage(iconImage, 24, 28, 66, 66)
      ctx.restore()
    }
    ctx.fillStyle = titleColor
    ctx.font = '950 34px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, stats.workoutName, width - 122), 108, 56)
    ctx.fillStyle = textColor
    ctx.font = '850 22px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, `${stats.dateShortLabel} • ${stats.durationLabel}`, width - 122), 108, 91)
    ctx.fillStyle = resolvedAccent
    ctx.font = '950 18px Inter, Arial, sans-serif'
    ctx.fillText('FORGEFLOW', 108, 121)
  } else if (stickerId === 'metrics') {
    const metrics = getVisibleMetrics(stats, infoLevel, 5)
    drawStickerPanelBase(ctx, width, height, { fill: surface.background, stroke: surface.border, lineWidth: surface.borderWidth, radius: 34 })
    const gap = 12
    const chipW = (width - 44 - gap * (metrics.length - 1)) / Math.max(1, metrics.length)
    metrics.forEach((metric, index) => {
      drawStickerMetric(ctx, metric, 22 + index * (chipW + gap), 28, {
        width: chipW,
        height: height - 56,
        accentColor: resolvedAccent,
        compact: true,
        fill: surface.chip,
      })
    })
  } else if (stickerId === 'volume') {
    drawStickerPanelBase(ctx, width, height, { fill: surface.background, stroke: surface.border, lineWidth: surface.borderWidth, radius: 42 })
    ctx.fillStyle = resolvedAccent
    ctx.font = '950 25px Inter, Arial, sans-serif'
    ctx.fillText('VOLUME TOTAL', 34, 55)
    ctx.fillStyle = titleColor
    ctx.font = '950 72px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, stats.volumeLabel, width - 68), 34, 128)
    ctx.fillStyle = textColor
    ctx.font = '850 22px Inter, Arial, sans-serif'
    ctx.fillText(`${stats.completedSetCount} séries • ${stats.exerciseCount} exercícios`, 34, 168)
  } else if (stickerId === 'topSet') {
    drawStickerPanelBase(ctx, width, height, { fill: surface.background, stroke: surface.border, lineWidth: surface.borderWidth, radius: 34 })
    drawStickerHeader(ctx, 'MELHOR SÉRIE', '', width, resolvedAccent)
    ctx.fillStyle = titleColor
    ctx.font = '930 30px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, stats.topWeightSet?.exerciseName || stats.bestSet?.exerciseName || 'Sem série', width - 48), 24, 104)
    ctx.font = '950 42px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, formatSetShort(stats.topWeightSet || stats.bestSet), width - 48), 24, 148)
  } else if (stickerId === 'repTotal') {
    drawStickerPanelBase(ctx, width, height, { fill: surface.background, stroke: surface.border, lineWidth: surface.borderWidth, radius: 34 })
    ctx.fillStyle = resolvedAccent
    ctx.font = '950 24px Inter, Arial, sans-serif'
    ctx.fillText('REPS TOTAIS', 28, 52)
    ctx.fillStyle = titleColor
    ctx.font = '950 72px Inter, Arial, sans-serif'
    ctx.fillText(String(stats.totalReps), 28, 122)
    ctx.fillStyle = textColor
    ctx.font = '850 20px Inter, Arial, sans-serif'
    ctx.fillText(`${String(stats.averageRepsPerSet).replace('.', ',')} reps por série`, 28, 154)
  } else if (stickerId === 'location') {
    drawStickerPanelBase(ctx, width, height, { fill: surface.background, stroke: surface.border, lineWidth: surface.borderWidth, radius: 28 })
    drawStickerHeader(ctx, 'SESSÃO', '', width, resolvedAccent)
    ctx.fillStyle = titleColor
    ctx.font = '900 24px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, stats.locationLabel || 'Sem local registrado', width - 46), 22, 84)
    ctx.fillStyle = textColor
    ctx.font = '850 19px Inter, Arial, sans-serif'
    ctx.fillText(truncateText(ctx, stats.dateLabel, width - 46), 22, 108)
  } else if (stickerId === 'caption') {
    drawStickerPanelBase(ctx, width, height, { fill: surface.background, stroke: surface.border, lineWidth: surface.borderWidth, radius: 38 })
    ctx.fillStyle = titleColor
    ctx.font = '950 34px Inter, Arial, sans-serif'
    drawWrappedText(ctx, caption || 'Mais um treino concluído.', 30, 52, width - 60, 42, 2)
    ctx.fillStyle = resolvedAccent
    ctx.font = '950 18px Inter, Arial, sans-serif'
    ctx.fillText('FORGEFLOW NOTE', 30, height - 28)
  } else {
    const rows = getStickerRows(stickerId, stats)
    const titleMap = {
      exerciseList: 'EXERCÍCIOS',
      setsReps: 'SÉRIES E REPS',
      weights: 'PESOS',
      prs: stats.prCount > 0 ? 'RECORDES' : 'SEM PR',
    }
    drawStickerPanelBase(ctx, width, height, {
      fill: surface.background,
      stroke: surface.border,
      lineWidth: surface.borderWidth,
      radius: 34,
    })
    drawStickerHeader(ctx, titleMap[stickerId], stickerId === 'exerciseList' ? 'Lista compacta do treino' : '', width, resolvedAccent)
    const safeRows = rows.length ? rows : [{ title: stickerId === 'prs' ? 'Treino concluído' : 'Sem dados suficientes', meta: stats.workoutName }]
    drawListRows(ctx, safeRows, 30, 118, width - 60, {
      maxRows: stickerId === 'exerciseList' ? 5 : 4,
      lineHeight: stickerId === 'exerciseList' ? 48 : 52,
      titleSize: stickerId === 'exerciseList' ? 24 : 23,
      metaSize: 18,
      accentColor: resolvedAccent,
    })
  }

  ctx.restore()
}

function drawStickerSet(ctx, stats, options = {}) {
  const { stickers = {}, format = 'story' } = options
  getVisibleStickerEntries(stickers, format).forEach((entry) => {
    const { transform } = entry
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)
    drawSingleWorkoutSticker(ctx, entry.id, stats, { ...options, stickerStyle: transform })
    ctx.restore()
  })
}

function renderStickerPreviewDataUrl(stickerId, stats, options = {}) {
  if (typeof document === 'undefined') return ''
  const { format = 'story' } = options
  const size = getStickerCanvasSize(stickerId, format)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  drawSingleWorkoutSticker(ctx, stickerId, stats, options)
  return canvas.toDataURL('image/png')
}

function getNearestStickerBounds(stickerId, stickers = {}, format = 'story') {
  const currentBounds = getStickerBounds(stickerId, stickers?.[stickerId], format)
  let nearest = null

  getVisibleStickerEntries(stickers, format).forEach((entry) => {
    if (entry.id === stickerId) return
    const bounds = getStickerBounds(entry.id, entry.transform, format)
    const distance = Math.hypot(bounds.centerX - currentBounds.centerX, bounds.centerY - currentBounds.centerY)
    if (!nearest || distance < nearest.distance) {
      nearest = { ...bounds, distance }
    }
  })

  return nearest
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

  ctx.fillStyle = 'rgba(255,255,255,0.72)'
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
    stickers = null,
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
    drawStickerSet(ctx, stats, {
      ...templateOptions,
      stickers: stickers || getDefaultStickerState(selectedFormat.id),
    })
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
  const previewShellRef = useRef(null)
  const fileInputRef = useRef(null)
  const activePointers = useRef(new Map())
  const activeStickerPointers = useRef(new Map())
  const gestureRef = useRef(null)
  const stickerGestureRef = useRef(null)
  const stickerElementRefs = useRef(new Map())
  const selectedStickerIdRef = useRef('summary')
  const stickersRef = useRef(getDefaultStickerState('story'))
  const formatRef = useRef('story')
  const lastFormatIdRef = useRef('story')
  const photoTransformRef = useRef(DEFAULT_PHOTO_TRANSFORM)
  const overlayTransformRef = useRef(DEFAULT_OVERLAY_TRANSFORM)
  const userPhotoRef = useRef(null)
  const selectedFormatRef = useRef(SHARE_FORMATS[0])
  const activeEditLayerRef = useRef('overlay')
  const previewFrameRef = useRef(0)
  const previewRedrawModeRef = useRef('full')
  const snapGuideRef = useRef({ x: null, y: null, bottom: false })

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
  const [stickers, setStickers] = useState(() => getDefaultStickerState('story'))
  const [selectedStickerId, setSelectedStickerId] = useState('summary')
  const [stickerPopoverPosition, setStickerPopoverPosition] = useState(null)
  const [stickerPopoverTab, setStickerPopoverTab] = useState('quick')
  const [snapGuide, setSnapGuide] = useState({ x: null, y: null, bottom: false })
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [stickerPreviewImages, setStickerPreviewImages] = useState({})
  const [previewIconImage, setPreviewIconImage] = useState(null)
  const [stickerColorTarget, setStickerColorTarget] = useState('titleColor')

  const selectedFormat = SHARE_FORMATS.find((item) => item.id === format) || SHARE_FORMATS[0]
  const selectedPhrase = SHARE_PHRASES[phraseId] || SHARE_PHRASES[0]
  const caption = customCaption.trim() || selectedPhrase
  const hasEditablePhoto = backgroundMode === 'photo' && Boolean(userPhoto?.src)
  const canEditPreview = hasEditablePhoto || overlayMode === 'stickers'
  const snapBottomPercent = `${(getStickerBottomTarget(selectedFormat.id, selectedFormat.width, selectedFormat.height) / selectedFormat.height) * 100}%`
  const visibleStickers = useMemo(() => getVisibleStickerEntries(stickers, format), [format, stickers])
  const selectedSticker = stickers[selectedStickerId] || getDefaultStickerState(format)[selectedStickerId] || null
  const selectedStickerAppearance = useMemo(() => getStickerAppearance(selectedSticker), [selectedSticker])
  const selectedStickerMeta = SHARE_STICKER_TYPES.find((item) => item.id === selectedStickerId) || null
  const selectedStickerColorHex = selectedStickerAppearance?.[stickerColorTarget] || '#ffffff'
  const selectedStickerColorHsl = useMemo(() => hexToHsl(selectedStickerColorHex), [selectedStickerColorHex])

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
    stickersRef.current = stickers
  }, [stickers])

  useEffect(() => {
    selectedStickerIdRef.current = selectedStickerId
  }, [selectedStickerId])

  useEffect(() => {
    setStickerPopoverTab('quick')
  }, [selectedStickerId])

  useEffect(() => {
    activeEditLayerRef.current = activeEditLayer
  }, [activeEditLayer])

  useEffect(() => {
    userPhotoRef.current = userPhoto
  }, [userPhoto])

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
    if (!open || overlayMode !== 'stickers' || !stats || typeof document === 'undefined') return

    const next = {}
    visibleStickers.forEach((entry) => {
      next[entry.id] = renderStickerPreviewDataUrl(entry.id, stats, {
        format,
        caption,
        infoLevel,
        accentColor: getShareAccentColor(),
        iconImage: previewIconImage,
        stickerStyle: entry.transform,
      })
    })
    setStickerPreviewImages(next)
  }, [caption, format, infoLevel, open, overlayMode, previewIconImage, stats, visibleStickers])

  useEffect(() => {
    if (overlayMode !== 'stickers' || activeEditLayer !== 'overlay' || !selectedSticker || !previewShellRef.current || typeof window === 'undefined') {
      setStickerPopoverPosition(null)
      return undefined
    }

    const updatePopoverPosition = () => {
      const previewEl = previewShellRef.current
      const stickerEl = stickerElementRefs.current.get(selectedStickerId)
      if (!previewEl || !stickerEl) {
        setStickerPopoverPosition(null)
        return
      }

      const stickerRect = stickerEl.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const width = Math.min(Math.max(Math.min(viewportWidth - 20, 260), 220), 260)
      const margin = 10
      const desiredLeft = stickerRect.left + (stickerRect.width / 2) - (width / 2)
      const left = clamp(desiredLeft, margin, viewportWidth - width - margin)
      const preferredHeight = stickerPopoverTab === 'color' ? 248 : 214
      const spaceAbove = stickerRect.top - margin
      const spaceBelow = viewportHeight - stickerRect.bottom - margin
      const placeAbove = spaceAbove > preferredHeight || spaceAbove > spaceBelow
      const top = placeAbove
        ? Math.max(margin, stickerRect.top - preferredHeight - 14)
        : Math.min(viewportHeight - preferredHeight - margin, stickerRect.bottom + 14)

      setStickerPopoverPosition({
        left,
        top,
        placement: placeAbove ? 'top' : 'bottom',
        width,
      })
    }

    updatePopoverPosition()
    window.addEventListener('resize', updatePopoverPosition)
    window.addEventListener('scroll', updatePopoverPosition, true)
    return () => {
      window.removeEventListener('resize', updatePopoverPosition)
      window.removeEventListener('scroll', updatePopoverPosition, true)
    }
  }, [activeEditLayer, overlayMode, selectedSticker, selectedStickerId, stickers, format])

  useEffect(() => {
    selectedFormatRef.current = selectedFormat
    formatRef.current = selectedFormat.id
  }, [selectedFormat])
  useEffect(() => {
    const previousFormat = lastFormatIdRef.current || selectedFormat.id
    if (previousFormat !== selectedFormat.id) {
      setStickers((current) => migrateStickerStateForFormat(current, previousFormat, selectedFormat.id))
    }
    lastFormatIdRef.current = selectedFormat.id
  }, [selectedFormat.id])


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
      overlayMode: overlayMode === 'stickers' ? 'none' : overlayMode,
      overlayTransform: overlayTransformRef.current,
      stickers: stickersRef.current,
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

  function drawPreviewWithRefs() {
    if (!canvasRef.current) return

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
      overlayMode: overlayMode === 'stickers' ? 'none' : overlayMode,
      overlayTransform: overlayTransformRef.current,
      stickers: stickersRef.current,
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
      x: Number.isFinite(Number(nextGuide?.x)) ? Number(nextGuide.x) : null,
      y: Number.isFinite(Number(nextGuide?.y)) ? Number(nextGuide.y) : null,
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
    const guide = { x: null, y: null, bottom: false }
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
      updateSnapGuide({ x: null, y: null, bottom: false })
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
      updateSnapGuide({ x: null, y: null, bottom: false })
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


  function getStickerDomStyle(stickerId, transform = stickersRef.current?.[stickerId]) {
    return getStickerDomStyleForFormat(stickerId, transform, selectedFormatRef.current)
  }

  function updateStickerElementStyle(stickerId, transform) {
    const element = stickerElementRefs.current.get(stickerId)
    if (!element) return

    const nextStyle = getStickerDomStyle(stickerId, transform)
    element.style.left = nextStyle.left
    element.style.top = nextStyle.top
    element.style.width = nextStyle.width
    element.style.transform = nextStyle.transform
  }

  function applyStickerTransform(stickerId, nextTransform, options = {}) {
    const currentFormat = selectedFormatRef.current
    const current = stickersRef.current?.[stickerId] || getDefaultStickerState(currentFormat.id)[stickerId]
    const rawNext = {
      ...current,
      ...nextTransform,
      visible: current.visible !== false,
    }
    const snapped = options.snap ? getStickerSnap(rawNext, stickerId, currentFormat.id, stickersRef.current) : {
      transform: clampStickerTransform(stickerId, rawNext, currentFormat.id),
      guide: { x: null, y: null, bottom: false },
    }

    stickersRef.current = {
      ...stickersRef.current,
      [stickerId]: {
        ...stickersRef.current[stickerId],
        ...snapped.transform,
      },
    }

    updateStickerElementStyle(stickerId, snapped.transform)
    updateSnapGuide(options.snap ? snapped.guide : { x: null, y: null, bottom: false })
    return snapped.transform
  }

  function startStickerGesture(stickerId) {
    const pointers = Array.from(activeStickerPointers.current.values())
    const currentFormat = selectedFormatRef.current
    const currentTransform = stickersRef.current?.[stickerId] || getDefaultStickerState(currentFormat.id)[stickerId]

    if (pointers.length === 1) {
      stickerGestureRef.current = {
        type: 'drag',
        stickerId,
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
      const bounds = getStickerBounds(stickerId, startTransform, currentFormat.id)

      stickerGestureRef.current = {
        type: 'pinch',
        stickerId,
        startDistance: Math.max(1, getDistance(first, second)),
        startCenter,
        startTransform,
        centerOffset: {
          x: startCenter.x - bounds.centerX,
          y: startCenter.y - bounds.centerY,
        },
      }
    }
  }

  function handleStickerLayerPointerDown(event) {
    if (overlayMode !== 'stickers' || activeStickerPointers.current.size === 0 || !selectedStickerIdRef.current) return

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    activeStickerPointers.current.set(event.pointerId, getPointerSnapshot(event))
    startStickerGesture(selectedStickerIdRef.current)
  }

  function handleStickerLayerPointerMove(event) {
    if (!activeStickerPointers.current.has(event.pointerId)) return

    event.preventDefault()
    event.stopPropagation()
    activeStickerPointers.current.set(event.pointerId, getPointerSnapshot(event))

    const gesture = stickerGestureRef.current
    if (!gesture || !gesture.stickerId) return

    const stickerId = gesture.stickerId
    const pointers = Array.from(activeStickerPointers.current.values())
    const currentFormat = selectedFormatRef.current

    if (gesture.type === 'drag' && pointers.length === 1) {
      const current = activeStickerPointers.current.get(gesture.pointerId)
      if (!current) return

      applyStickerTransform(stickerId, {
        ...gesture.startTransform,
        x: safeNumber(gesture.startTransform.x) + current.canvas.x - gesture.startPoint.x,
        y: safeNumber(gesture.startTransform.y) + current.canvas.y - gesture.startPoint.y,
      }, { snap: true })
      return
    }

    if (gesture.type === 'pinch' && pointers.length >= 2) {
      const first = pointers[0].canvas
      const second = pointers[1].canvas
      const currentCenter = getCenter(first, second)
      const distance = Math.max(1, getDistance(first, second))
      const nextScale = clamp(safeNumber(gesture.startTransform.scale) * (distance / gesture.startDistance), STICKER_MIN_SCALE, STICKER_MAX_SCALE)
      const startScale = Math.max(STICKER_MIN_SCALE, safeNumber(gesture.startTransform.scale) || 1)
      const ratio = nextScale / startScale
      const size = getStickerCanvasSize(stickerId, currentFormat.id)
      const nextCenter = {
        x: currentCenter.x - gesture.centerOffset.x * ratio,
        y: currentCenter.y - gesture.centerOffset.y * ratio,
      }

      applyStickerTransform(stickerId, {
        ...gesture.startTransform,
        scale: nextScale,
        x: nextCenter.x - (size.width * nextScale) / 2,
        y: nextCenter.y - (size.height * nextScale) / 2,
      }, { snap: true })
    }
  }

  function handleStickerLayerPointerUp(event) {
    if (!activeStickerPointers.current.has(event.pointerId)) return

    event.preventDefault()
    event.stopPropagation()
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    } catch {
      // Pode já ter sido liberado pelo browser.
    }

    activeStickerPointers.current.delete(event.pointerId)

    if (activeStickerPointers.current.size > 0) {
      startStickerGesture(selectedStickerIdRef.current)
      return
    }

    stickerGestureRef.current = null
    updateSnapGuide({ x: null, y: null, bottom: false })
    setStickers({ ...stickersRef.current })
  }

  function handleStickerPointerDown(event, stickerId) {
    if (overlayMode !== 'stickers') return

    event.preventDefault()
    event.stopPropagation()

    const isAddingSecondFinger = activeStickerPointers.current.size > 0
    const targetStickerId = isAddingSecondFinger ? selectedStickerIdRef.current : stickerId

    if (!isAddingSecondFinger && selectedStickerIdRef.current !== stickerId) {
      activeStickerPointers.current.clear()
      stickerGestureRef.current = null
    }

    setSelectedStickerId(targetStickerId)
    selectedStickerIdRef.current = targetStickerId
    activeEditLayerRef.current = 'overlay'
    setActiveEditLayer('overlay')
    event.currentTarget.setPointerCapture?.(event.pointerId)
    activeStickerPointers.current.set(event.pointerId, getPointerSnapshot(event))
    startStickerGesture(targetStickerId)
  }

  function handleStickerPointerMove(event, stickerId) {
    if (!activeStickerPointers.current.has(event.pointerId)) return

    event.preventDefault()
    event.stopPropagation()
    activeStickerPointers.current.set(event.pointerId, getPointerSnapshot(event))

    const gesture = stickerGestureRef.current
    if (!gesture || gesture.stickerId !== stickerId) return

    const pointers = Array.from(activeStickerPointers.current.values())
    const currentFormat = selectedFormatRef.current

    if (gesture.type === 'drag' && pointers.length === 1) {
      const current = activeStickerPointers.current.get(gesture.pointerId)
      if (!current) return

      applyStickerTransform(stickerId, {
        ...gesture.startTransform,
        x: safeNumber(gesture.startTransform.x) + current.canvas.x - gesture.startPoint.x,
        y: safeNumber(gesture.startTransform.y) + current.canvas.y - gesture.startPoint.y,
      }, { snap: true })
      return
    }

    if (gesture.type === 'pinch' && pointers.length >= 2) {
      const first = pointers[0].canvas
      const second = pointers[1].canvas
      const currentCenter = getCenter(first, second)
      const distance = Math.max(1, getDistance(first, second))
      const nextScale = clamp(safeNumber(gesture.startTransform.scale) * (distance / gesture.startDistance), STICKER_MIN_SCALE, STICKER_MAX_SCALE)
      const startScale = Math.max(STICKER_MIN_SCALE, safeNumber(gesture.startTransform.scale) || 1)
      const ratio = nextScale / startScale
      const size = getStickerCanvasSize(stickerId, currentFormat.id)
      const nextCenter = {
        x: currentCenter.x - gesture.centerOffset.x * ratio,
        y: currentCenter.y - gesture.centerOffset.y * ratio,
      }

      applyStickerTransform(stickerId, {
        ...gesture.startTransform,
        scale: nextScale,
        x: nextCenter.x - (size.width * nextScale) / 2,
        y: nextCenter.y - (size.height * nextScale) / 2,
      }, { snap: true })
    }
  }

  function handleStickerPointerUp(event) {
    if (!activeStickerPointers.current.has(event.pointerId)) return

    event.preventDefault()
    event.stopPropagation()
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    } catch {
      // Pode já ter sido liberado pelo browser.
    }

    activeStickerPointers.current.delete(event.pointerId)

    if (activeStickerPointers.current.size > 0) {
      startStickerGesture(selectedStickerIdRef.current)
      return
    }

    stickerGestureRef.current = null
    updateSnapGuide({ x: null, y: null, bottom: false })
    setStickers({ ...stickersRef.current })
  }

  function toggleSticker(stickerId) {
    setSelectedStickerId(stickerId)
    selectedStickerIdRef.current = stickerId
    setStickers((current) => {
      const currentFormat = selectedFormatRef.current
      const fallback = getDefaultStickerState(currentFormat.id)[stickerId]
      const nextVisible = !current[stickerId]?.visible
      const nextZ = nextVisible ? Math.max(1, ...Object.values(current).map((item) => Number(item?.zIndex || 1))) + 1 : (current[stickerId]?.zIndex || fallback.zIndex)
      const next = {
        ...current,
        [stickerId]: {
          ...fallback,
          ...current[stickerId],
          visible: nextVisible,
          zIndex: nextZ,
        },
      }
      stickersRef.current = next
      return next
    })
  }

  function handleResetStickers() {
    const next = getDefaultStickerState(selectedFormatRef.current.id)
    const preset = STICKER_LAYOUT_PRESETS[selectedFormatRef.current.id]?.balanced || {}
    Object.keys(preset).forEach((key) => { next[key] = { ...next[key], ...preset[key] } })
    stickersRef.current = next
    setStickers(next)
    setSelectedStickerId('summary')
    selectedStickerIdRef.current = 'summary'
    setStatus('Layout de figurinhas resetado.')
  }

  function applyLayoutPreset(presetId = 'balanced') {
    const formatId = selectedFormatRef.current.id
    const preset = STICKER_LAYOUT_PRESETS[formatId]?.[presetId] || STICKER_LAYOUT_PRESETS[formatId]?.balanced || {}
    const fallback = getDefaultStickerState(formatId)
    const next = SHARE_STICKER_TYPES.reduce((acc, item) => {
      const current = stickersRef.current[item.id] || fallback[item.id]
      acc[item.id] = clampStickerTransform(item.id, {
        ...fallback[item.id],
        ...current,
        ...(preset[item.id] || {}),
      }, formatId)
      return acc
    }, {})
    stickersRef.current = next
    setStickers(next)
    const labels = { balanced: 'base', compact: 'compacto', hero: 'hero', analytics: 'analytics' }
    setStatus(`Layout ${labels[presetId] || 'personalizado'} aplicado.`)
  }

  function updateSelectedStickerAppearance(patch = {}) {
    const stickerId = selectedStickerIdRef.current
    const current = stickersRef.current[stickerId]
    if (!current) return
    const next = clampStickerTransform(stickerId, { ...current, ...patch }, selectedFormatRef.current.id)
    stickersRef.current = { ...stickersRef.current, [stickerId]: next }
    updateStickerElementStyle(stickerId, next)
    setStickers({ ...stickersRef.current })
  }

  function shiftSelectedStickerLayer(action = 'front') {
    const stickerId = selectedStickerIdRef.current
    const current = stickersRef.current[stickerId]
    if (!current) return

    const entries = Object.entries(stickersRef.current)
      .filter(([, value]) => value?.visible !== false)
      .sort((a, b) => (a[1]?.zIndex || 1) - (b[1]?.zIndex || 1))

    const ids = entries.map(([id]) => id)
    const currentIndex = ids.indexOf(stickerId)
    if (currentIndex === -1) return

    let targetIndex = currentIndex
    if (action === 'front') targetIndex = ids.length - 1
    if (action === 'back') targetIndex = 0
    if (action === 'forward') targetIndex = Math.min(ids.length - 1, currentIndex + 1)
    if (action === 'backward') targetIndex = Math.max(0, currentIndex - 1)
    if (targetIndex === currentIndex) return

    ids.splice(currentIndex, 1)
    ids.splice(targetIndex, 0, stickerId)

    const next = { ...stickersRef.current }
    ids.forEach((id, index) => {
      next[id] = { ...next[id], zIndex: index + 1 }
    })

    stickersRef.current = next
    setStickers(next)
    setStatus(action === 'front' ? 'Figurinha trazida para frente.' : action === 'back' ? 'Figurinha enviada para trás.' : 'Ordem da figurinha ajustada.')
  }

  function applyStickerThemePreset(presetId, scope = 'selected') {
    const preset = STICKER_THEME_PRESETS[presetId]
    if (!preset) return

    if (scope === 'all') {
      const next = Object.entries(stickersRef.current).reduce((acc, [id, transform]) => {
        acc[id] = clampStickerTransform(id, { ...transform, ...preset.values }, selectedFormatRef.current.id)
        return acc
      }, {})
      stickersRef.current = next
      setStickers(next)
      setStatus(`Tema ${preset.label} aplicado em todas as figurinhas.`)
      return
    }

    updateSelectedStickerAppearance(preset.values)
    setStatus(`Tema ${preset.label} aplicado na figurinha selecionada.`)
  }

  function alignSelectedSticker(mode) {
    const stickerId = selectedStickerIdRef.current
    const current = stickersRef.current[stickerId]
    if (!current) return

    const currentFormat = selectedFormatRef.current
    const size = getStickerCanvasSize(stickerId, currentFormat.id)
    const scale = clamp(safeNumber(current.scale) || 1, STICKER_MIN_SCALE, STICKER_MAX_SCALE)
    const width = size.width * scale
    const height = size.height * scale
    const margin = 40
    const peer = getNearestStickerBounds(stickerId, stickersRef.current, currentFormat.id)
    const next = { ...current, scale }

    if (mode === 'left') next.x = margin
    if (mode === 'centerX') next.x = currentFormat.width / 2 - width / 2
    if (mode === 'right') next.x = currentFormat.width - margin - width
    if (mode === 'top') next.y = margin
    if (mode === 'centerY') next.y = currentFormat.height / 2 - height / 2
    if (mode === 'bottom') next.y = getStickerBottomTarget(currentFormat.id, currentFormat.width, currentFormat.height) - height

    if (peer) {
      if (mode === 'peerLeft') next.x = peer.left
      if (mode === 'peerCenterX') next.x = peer.centerX - width / 2
      if (mode === 'peerRight') next.x = peer.right - width
      if (mode === 'peerTop') next.y = peer.top
      if (mode === 'peerCenterY') next.y = peer.centerY - height / 2
      if (mode === 'peerBottom') next.y = peer.bottom - height
    }

    const aligned = applyStickerTransform(stickerId, next, { snap: false })
    stickersRef.current = { ...stickersRef.current, [stickerId]: aligned }
    updateStickerElementStyle(stickerId, aligned)
    setStickers({ ...stickersRef.current })
  }

  function updateSelectedStickerHsl(channel, nextValue) {
    const currentColor = selectedStickerAppearance?.[stickerColorTarget] || '#ffffff'
    const currentHsl = hexToHsl(currentColor)
    const nextHsl = { ...currentHsl, [channel]: Number(nextValue) }
    updateSelectedStickerAppearance({ [stickerColorTarget]: hslToHex(nextHsl.h, nextHsl.s, nextHsl.l) })
  }

  function handleSelectedStickerSmaller() {
    const stickerId = selectedStickerIdRef.current
    const current = stickersRef.current[stickerId]
    if (!current) return
    const next = applyStickerTransform(stickerId, {
      ...current,
      scale: Math.max(STICKER_MIN_SCALE, safeNumber(current.scale) - 0.1),
    })
    stickersRef.current = { ...stickersRef.current, [stickerId]: { ...current, ...next } }
    setStickers({ ...stickersRef.current })
  }

  function handleSelectedStickerBigger() {
    const stickerId = selectedStickerIdRef.current
    const current = stickersRef.current[stickerId]
    if (!current) return
    const next = applyStickerTransform(stickerId, {
      ...current,
      scale: Math.min(STICKER_MAX_SCALE, safeNumber(current.scale) + 0.1),
    })
    stickersRef.current = { ...stickersRef.current, [stickerId]: { ...current, ...next } }
    setStickers({ ...stickersRef.current })
  }

  function renderWorkoutSticker(stickerId) {
    const rows = getStickerRows(stickerId, stats)

    if (stickerId === 'summary') {
      return (
        <>
          <span className="ff-share-sticker__mini-brand">ForgeFlow</span>
          <strong>{stats.workoutName}</strong>
          <small>{stats.dateShortLabel} • {stats.durationLabel}</small>
        </>
      )
    }

    if (stickerId === 'metrics') {
      return (
        <>
          <span className="ff-share-sticker__label">Métricas</span>
          <div className="ff-share-sticker__metric-grid">
            {getVisibleMetrics(stats, infoLevel, 5).map((metric) => (
              <span key={`${metric.label}-${metric.value}`}>
                <strong>{metric.value}</strong>
                <small>{metric.label}</small>
              </span>
            ))}
          </div>
        </>
      )
    }

    if (stickerId === 'volume') {
      return (
        <>
          <span className="ff-share-sticker__label">Volume total</span>
          <strong className="ff-share-sticker__hero-value">{stats.volumeLabel}</strong>
          <small>{stats.completedSetCount} séries • {stats.exerciseCount} exercícios</small>
        </>
      )
    }

    if (stickerId === 'topSet') {
      return (
        <>
          <span className="ff-share-sticker__label">Melhor série</span>
          <strong>{stats.topWeightSet?.exerciseName || stats.bestSet?.exerciseName || 'Sem melhor série'}</strong>
          <small>{formatSetShort(stats.topWeightSet || stats.bestSet)} • melhor carga do treino</small>
        </>
      )
    }

    if (stickerId === 'repTotal') {
      return (
        <>
          <span className="ff-share-sticker__label">Reps totais</span>
          <strong className="ff-share-sticker__hero-value">{stats.totalReps}</strong>
          <small>{stats.averageRepsPerSet} reps por série em média</small>
        </>
      )
    }

    if (stickerId === 'location') {
      return (
        <>
          <span className="ff-share-sticker__label">Sessão</span>
          <strong>{stats.locationLabel || 'Sem local registrado'}</strong>
          <small>{stats.dateLabel}</small>
        </>
      )
    }

    if (stickerId === 'caption') {
      return (
        <>
          <strong className="ff-share-sticker__quote">{caption}</strong>
          <small>ForgeFlow note</small>
        </>
      )
    }

    const titleMap = {
      exerciseList: 'Exercícios',
      setsReps: 'Séries e reps',
      weights: 'Pesos',
      prs: stats.prCount > 0 ? 'PRs' : 'Treino feito',
    }
    const maxRows = stickerId === 'exerciseList' ? 5 : stickerId === 'prs' ? 4 : 4
    const fallbackRows = rows.length ? rows : [{ title: stickerId === 'prs' ? 'Sem PR neste treino' : 'Sem dados suficientes', meta: stats.workoutName }]

    return (
      <>
        <span className="ff-share-sticker__label">{titleMap[stickerId]}</span>
        <div className="ff-share-sticker__rows">
          {fallbackRows.slice(0, maxRows).map((row, index) => (
            <span key={`${row.title}-${index}`}>
              <strong>{row.title}</strong>
              <small>{row.meta}</small>
            </span>
          ))}
          {fallbackRows.length > maxRows && (
            <em>+{fallbackRows.length - maxRows} itens</em>
          )}
        </div>
      </>
    )
  }

  function getCurrentShareDrawOptions() {
    return {
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
      stickers: stickersRef.current,
    }
  }

  async function renderExportCanvas() {
    if (typeof document === 'undefined') throw new Error('Canvas indisponível.')

    const canvas = document.createElement('canvas')
    await drawWorkoutShareCanvas(canvas, getCurrentShareDrawOptions())
    return canvas
  }

  async function getImageBlob(options = {}) {
    const { mimeType = 'image/png', quality = 0.95 } = options
    const exportCanvas = await renderExportCanvas()

    return canvasToBlob(exportCanvas, mimeType, quality)
  }

  async function getImageAsset(options = {}) {
    const { mimeType = 'image/png', extension = 'png', quality = 0.95 } = options
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
    setStatus('Gerando imagem exatamente como o preview...')

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
            text: 'Escolha Galeria, Fotos ou Arquivos para salvar/usar a imagem.',
            files: [file],
          })
          setStatus('Não foi possível salvar automaticamente. Use o compartilhamento do sistema para salvar a imagem.')
          return
        }
      }

      if (isMobileShareContext() && canShareImageFile(file)) {
        await navigator.share({
          title: 'Salvar imagem ForgeFlow',
          text: 'Escolha Fotos, Galeria ou Arquivos para salvar/usar a imagem.',
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
            ref={previewShellRef}
            className="ff-share-studio__preview"
            aria-label="Prévia da imagem"
            style={{ '--ff-share-snap-bottom': snapBottomPercent }}
          >
            {overlayMode === 'stickers' && selectedStickerMeta && (
              <div className="ff-share-studio__editing-badge">
                <strong>Editando agora</strong>
                <span>{selectedStickerMeta.label}</span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className={`ff-share-studio__canvas is-${format} template-${template} bg-${selectedBackground}${activeEditLayer === 'photo' ? ' is-editing-photo' : ''} editing-${activeEditLayer}${overlayMode === 'stickers' ? ' has-dom-stickers' : ''}`}
              style={{ aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}` }}
              onPointerDown={activeEditLayer === 'photo' ? handlePointerDown : undefined}
              onPointerMove={activeEditLayer === 'photo' ? handlePointerMove : undefined}
              onPointerUp={activeEditLayer === 'photo' ? handlePointerUp : undefined}
              onPointerCancel={activeEditLayer === 'photo' ? handlePointerUp : undefined}
              onPointerLeave={activeEditLayer === 'photo' ? handlePointerUp : undefined}
            />

            {overlayMode === 'stickers' && (
              <div
                className={`ff-share-studio__sticker-layer is-${format}${activeEditLayer === 'overlay' ? ' is-editing-stickers' : ' is-passive'}`}
                style={{
                  aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`,
                  pointerEvents: activeEditLayer === 'overlay' ? 'auto' : 'none',
                }}
                aria-label="Figurinhas editáveis"
                onPointerDown={handleStickerLayerPointerDown}
                onPointerMove={handleStickerLayerPointerMove}
                onPointerUp={handleStickerLayerPointerUp}
                onPointerCancel={handleStickerLayerPointerUp}
                onPointerLeave={handleStickerLayerPointerUp}
              >
                {visibleStickers.map((sticker) => {
                  const previewSrc = stickerPreviewImages[sticker.id]
                  return (
                    <div
                      key={sticker.id}
                      ref={(node) => {
                        if (node) stickerElementRefs.current.set(sticker.id, node)
                        else stickerElementRefs.current.delete(sticker.id)
                      }}
                      className={`ff-share-sticker is-${sticker.id}${selectedStickerId === sticker.id ? ' is-selected' : ''}${previewSrc ? ' is-rendered' : ''}`}
                      style={getStickerDomStyleForFormat(sticker.id, sticker.transform, selectedFormat)}
                      onPointerDown={(event) => handleStickerPointerDown(event, sticker.id)}
                      onPointerMove={(event) => handleStickerPointerMove(event, sticker.id)}
                      onPointerUp={handleStickerPointerUp}
                      onPointerCancel={handleStickerPointerUp}
                      onClick={(event) => {
                        event.stopPropagation()
                        setSelectedStickerId(sticker.id)
                      }}
                    >
                      {previewSrc ? (
                        <img src={previewSrc} alt="" draggable="false" className="ff-share-sticker__image" />
                      ) : renderWorkoutSticker(sticker.id)}
                    </div>
                  )
                })}
              </div>
            )}

            {snapGuide.x !== null && <span className="ff-share-studio__snap-line is-vertical" aria-hidden="true" style={{ left: `${snapGuide.x}%` }} />}
            {snapGuide.y !== null && <span className="ff-share-studio__snap-line is-horizontal" aria-hidden="true" style={{ top: `${snapGuide.y}%` }} />}
            {snapGuide.bottom && <span className="ff-share-studio__snap-line is-bottom" aria-hidden="true" />}

            {overlayMode === 'stickers' && selectedSticker && selectedStickerMeta && stickerPopoverPosition && createPortal(
              <div
                className={`ff-share-studio__sticker-popover is-${stickerPopoverPosition.placement}`}
                style={{
                  left: stickerPopoverPosition.left,
                  top: stickerPopoverPosition.top,
                  width: stickerPopoverPosition.width,
                }}
              >
                <div className="ff-share-studio__sticker-popover-head">
                  <div className="ff-share-studio__sticker-popover-title">
                    <i aria-hidden="true">✦</i>
                    <span>
                      <strong>{selectedStickerMeta.label}</strong>
                      <small>{stickerPopoverTab === 'quick' ? 'Ações rápidas' : stickerPopoverTab === 'color' ? 'Cores e HSL' : 'Posição e camadas'}</small>
                    </span>
                  </div>
                  <div className="ff-share-studio__sticker-popover-tabs">
                    <button type="button" className={stickerPopoverTab === 'quick' ? 'is-active' : ''} onClick={() => setStickerPopoverTab('quick')}>⚡ Rápido</button>
                    <button type="button" className={stickerPopoverTab === 'color' ? 'is-active' : ''} onClick={() => setStickerPopoverTab('color')}>🎨 Cor</button>
                    <button type="button" className={stickerPopoverTab === 'align' ? 'is-active' : ''} onClick={() => setStickerPopoverTab('align')}>📐 Alinhar</button>
                  </div>
                </div>

                {stickerPopoverTab === 'quick' ? (
                  <div className="ff-share-studio__sticker-popover-body">
                    <div className="ff-share-studio__popover-row is-actions is-compact-four">
                      <button type="button" onClick={handleSelectedStickerSmaller}>− Menor</button>
                      <button type="button" onClick={handleSelectedStickerBigger}>+ Maior</button>
                      <button type="button" onClick={() => applyStickerThemePreset('glass')}>▣ Glass</button>
                      <button type="button" onClick={() => applyStickerThemePreset('clean')}>□ Clean</button>
                    </div>
                    <div className="ff-share-studio__popover-row is-actions is-compact-three">
                      <button type="button" onClick={() => applyStickerThemePreset('minimal')}>◇ Minimal</button>
                      <button type="button" onClick={() => applyStickerThemePreset('transparent')}>◎ Transpar.</button>
                      <button type="button" onClick={() => toggleSticker(selectedStickerId)}>👁 Ocultar</button>
                    </div>
                    <div className="ff-share-studio__popover-row is-sliders is-two-up">
                      <label>
                        <span>Fundo</span>
                        <input type="range" min="0" max="1" step="0.01" value={selectedStickerAppearance.backgroundOpacity} onChange={(event) => updateSelectedStickerAppearance({ backgroundOpacity: Number(event.target.value) })} />
                      </label>
                      <label>
                        <span>Borda</span>
                        <input type="range" min="0" max="1" step="0.01" value={selectedStickerAppearance.borderOpacity} onChange={(event) => updateSelectedStickerAppearance({ borderOpacity: Number(event.target.value) })} />
                      </label>
                    </div>
                  </div>
                ) : stickerPopoverTab === 'color' ? (
                  <div className="ff-share-studio__sticker-popover-body">
                    <div className="ff-share-studio__popover-row">
                      <label>
                        <span>Editar</span>
                        <select value={stickerColorTarget} onChange={(event) => setStickerColorTarget(event.target.value)}>
                          <option value="titleColor">Título</option>
                          <option value="textColor">Texto</option>
                          <option value="accentColor">Destaque</option>
                          <option value="backgroundColor">Fundo</option>
                          <option value="borderColor">Borda</option>
                        </select>
                      </label>
                      <label>
                        <span>Cor</span>
                        <input type="color" value={selectedStickerColorHex} onChange={(event) => updateSelectedStickerAppearance({ [stickerColorTarget]: event.target.value })} />
                      </label>
                    </div>
                    <div className="ff-share-studio__popover-hsl">
                      <label>
                        <span>Hue</span>
                        <input type="range" min="0" max="360" step="1" value={selectedStickerColorHsl.h} onChange={(event) => updateSelectedStickerHsl('h', event.target.value)} />
                      </label>
                      <label>
                        <span>Sat.</span>
                        <input type="range" min="0" max="100" step="1" value={selectedStickerColorHsl.s} onChange={(event) => updateSelectedStickerHsl('s', event.target.value)} />
                      </label>
                      <label>
                        <span>Luz</span>
                        <input type="range" min="0" max="100" step="1" value={selectedStickerColorHsl.l} onChange={(event) => updateSelectedStickerHsl('l', event.target.value)} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="ff-share-studio__sticker-popover-body">
                    <div className="ff-share-studio__popover-row is-actions is-grid">
                      <button type="button" onClick={() => alignSelectedSticker('left')}>⬅ Esq.</button>
                      <button type="button" onClick={() => alignSelectedSticker('centerX')}>↔ Centro</button>
                      <button type="button" onClick={() => alignSelectedSticker('right')}>Dir. ➡</button>
                      <button type="button" onClick={() => alignSelectedSticker('top')}>⬆ Topo</button>
                      <button type="button" onClick={() => alignSelectedSticker('centerY')}>↕ Meio</button>
                      <button type="button" onClick={() => alignSelectedSticker('bottom')}>⬇ Base</button>
                    </div>
                    <div className="ff-share-studio__popover-row is-actions is-grid">
                      <button type="button" onClick={() => shiftSelectedStickerLayer('back')}>⤓ Fundo</button>
                      <button type="button" onClick={() => shiftSelectedStickerLayer('backward')}>− Camada</button>
                      <button type="button" onClick={() => shiftSelectedStickerLayer('forward')}>+ Camada</button>
                      <button type="button" onClick={() => shiftSelectedStickerLayer('front')}>⤒ Frente</button>
                    </div>
                  </div>
                )}
              </div>,
              document.body,
            )}

            {overlayMode === 'stickers' && selectedSticker && selectedStickerMeta && createPortal(
              <div className="ff-share-studio__floating-toolbar">
                <span>
                  <strong>{selectedStickerMeta.label}</strong>
                  <small>Selecionada</small>
                </span>
                <button type="button" className={stickerPopoverTab === 'quick' ? 'is-active' : ''} onClick={() => setStickerPopoverTab('quick')}>⚡</button>
                <button type="button" className={stickerPopoverTab === 'color' ? 'is-active' : ''} onClick={() => setStickerPopoverTab('color')}>🎨</button>
                <button type="button" className={stickerPopoverTab === 'align' ? 'is-active' : ''} onClick={() => setStickerPopoverTab('align')}>📐</button>
                <button type="button" onClick={() => shiftSelectedStickerLayer('front')}>⤒</button>
              </div>,
              document.body,
            )}

            {!ready && (
              <div className="ff-share-studio__loading">
                Montando imagem...
              </div>
            )}
          </section>

          <section className="ff-share-studio__controls">
            <div className="ff-share-studio__tip-card">
              <strong>Editor premium do card</strong>
              <small>Toque numa figurinha para editar perto dela. Menos rolagem, menos confusão e feedback visual mais claro.</small>
            </div>

            <div className="ff-share-studio__quick-summary">
              <span><strong>{SHARE_FORMATS.find((item) => item.id === format)?.label}</strong><small>Formato</small></span>
              <span><strong>{SHARE_TEMPLATES.find((item) => item.id === template)?.label}</strong><small>Template</small></span>
              <span><strong>{overlayMode === 'stickers' ? visibleStickers.length : '—'}</strong><small>Figurinhas</small></span>
              <span><strong>{selectedSticker ? (SHARE_STICKER_TYPES.find((item) => item.id === selectedStickerId)?.label || 'Selecionada') : 'Nenhuma'}</strong><small>Em edição</small></span>
            </div>

            <details className="ff-share-studio__panel" open>
              <summary>
                <span><Layers3 size={16} /> Visual do card</span>
                <small>Formato, template, camada e fundo</small>
              </summary>

              <div className="ff-share-studio__panel-body">
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
              </div>
            </details>

            {overlayMode === 'stickers' && (
              <details className="ff-share-studio__panel" open>
                <summary>
                  <span><Move size={16} /> Figurinhas</span>
                  <small>Adicionar, posicionar e alinhar</small>
                </summary>

                <div className="ff-share-studio__panel-body">
                  <div className="ff-share-studio__edit-layer" aria-label="Escolha o que editar no preview">
                    <button
                      type="button"
                      className={activeEditLayer === 'overlay' ? 'is-active' : ''}
                      onClick={() => setActiveEditLayer('overlay')}
                    >
                      Figurinhas
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

                  <div className="ff-share-studio__sticker-picker" aria-label="Adicionar ou remover figurinhas">
                    {SHARE_STICKER_TYPES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${stickers[item.id]?.visible ? 'is-active' : ''}${selectedStickerId === item.id ? ' is-selected' : ''}`}
                        onClick={() => toggleSticker(item.id)}
                      >
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </button>
                    ))}
                  </div>

                  <div className="ff-share-studio__overlay-tools">
                    <button type="button" onClick={handleResetStickers}>Resetar</button>
                    <button type="button" onClick={() => applyLayoutPreset('balanced')}>⬇ Base</button>
                    <button type="button" onClick={() => applyLayoutPreset('compact')}>Compacto</button>
                    <button type="button" onClick={() => applyLayoutPreset('hero')}>Hero</button>
                    <button type="button" onClick={() => applyLayoutPreset('analytics')}>Analytics</button>
                  </div>

                  <div className="ff-share-studio__context-note">
                    <strong>Toque numa figurinha para editar</strong>
                    <small>As opções de visual e alinhamento agora abrem diretamente ao lado da figurinha selecionada, no próprio preview.</small>
                  </div>

                </div>
              </details>
            )}

            <details className="ff-share-studio__panel" open={backgroundMode === 'photo'}>
              <summary>
                <span><ImagePlus size={16} /> Foto de fundo</span>
                <small>Escolher e ajustar a foto</small>
              </summary>

              <div className="ff-share-studio__panel-body">
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
              </div>
            </details>

            <details className="ff-share-studio__panel">
              <summary>
                <span><MessageCircle size={16} /> Mensagem</span>
                <small>Frase pronta ou personalizada</small>
              </summary>

              <div className="ff-share-studio__panel-body">
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
              </div>
            </details>

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
