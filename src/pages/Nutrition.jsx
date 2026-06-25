import { useEffect, useMemo, useState } from 'react'
import {
  Apple,
  Beef,
  CalendarDays,
  CheckCircle2,
  Coffee,
  Droplets,
  Flame,
  ImagePlus,
  Moon,
  Plus,
  RotateCcw,
  Salad,
  Scale,
  Sparkles,
  Target,
  Trash2,
  Utensils,
  X,
  Zap,
} from 'lucide-react'

import AppPageIntro from '../components/app/AppPageIntro'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmModal from '../components/ui/ConfirmModal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Toast from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { getUserAppSettings } from '../utils/settingsUtils'
import {
  addMeal,
  addWater,
  buildNutritionInsights,
  calculateWaterProgress,
  getBrazilTimeHHmm,
  getNutritionHistory,
  getTodayNutrition,
  loadNutritionFromDatabase,
  removeMeal,
  removeWater,
  saveNutritionDayToDatabase,
  setWater,
  updateMeal,
  updateNutritionGoals,
  validateMealFields,
  validateNutritionGoals,
} from '../services/nutritionService'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Café da manhã', icon: Coffee },
  { value: 'lunch', label: 'Almoço', icon: Utensils },
  { value: 'snack', label: 'Lanche', icon: Apple },
  { value: 'dinner', label: 'Jantar', icon: Moon },
  { value: 'supper', label: 'Ceia', icon: Salad },
  { value: 'pre-workout', label: 'Pré-treino', icon: Beef },
  { value: 'post-workout', label: 'Pós-treino', icon: Sparkles },
  { value: 'other', label: 'Outro', icon: Utensils },
]

const MEAL_PRESETS = [
  { label: 'Almoço completo', type: 'lunch', calories: 650, proteinG: 42, carbsG: 68, fatG: 18 },
  { label: 'Shake pós-treino', type: 'post-workout', calories: 320, proteinG: 32, carbsG: 34, fatG: 4 },
  { label: 'Pré-treino leve', type: 'pre-workout', calories: 260, proteinG: 8, carbsG: 52, fatG: 2 },
  { label: 'Lanche proteico', type: 'snack', calories: 280, proteinG: 24, carbsG: 24, fatG: 9 },
]

const WATER_PRESETS = [250, 500, 750, 1000]
const WATER_CUSTOM_PRESETS = [250, 300, 500, 750, 1000]

const ROUTINE_ITEMS = [
  { time: '08:00', title: 'Café da manhã', type: 'breakfast' },
  { time: '12:30', title: 'Almoço', type: 'lunch' },
  { time: '16:00', title: 'Lanche', type: 'snack' },
  { time: '20:00', title: 'Jantar', type: 'dinner' },
]

function safeNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function clampPercent(value, goal) {
  return calculateWaterProgress(value, goal)
}

function getMealTypeLabel(type) {
  return MEAL_TYPES.find((item) => item.value === type)?.label || 'Refeição'
}


function applySettingsGoals(day, settings) {
  if (!settings) return day

  return {
    ...day,
    waterGoalMl: Number(settings.dailyWaterGoalMl) || day.waterGoalMl,
    calorieGoal: Number(settings.dailyCaloriesGoal) || day.calorieGoal,
    proteinGoalG: Number(settings.proteinGoal) || day.proteinGoalG,
    carbsGoalG: Number(settings.carbsGoal) || day.carbsGoalG || '',
    fatGoalG: Number(settings.fatGoal) || day.fatGoalG || '',
  }
}

function createEmptyMeal() {
  return {
    id: '',
    name: '',
    type: 'lunch',
    time: getBrazilTimeHHmm(),
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    notes: '',
    photo: null,
  }
}

async function compressMealPhoto(file) {
  if (!file) return null

  if (!file.type?.startsWith('image/')) {
    throw new Error('Selecione uma imagem válida.')
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('A imagem é muito grande. Use uma foto com até 8 MB.')
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.readAsDataURL(file)
  })

  const image = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
    img.src = dataUrl
  })

  const maxSize = 900
  const scale = Math.min(1, maxSize / Math.max(image.width || 1, image.height || 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round((image.width || 1) * scale))
  canvas.height = Math.max(1, Math.round((image.height || 1) * scale))
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const compressed = canvas.toDataURL('image/jpeg', 0.78)

  return {
    dataUrl: compressed,
    mimeType: 'image/jpeg',
    size: Math.round((compressed.length * 3) / 4),
    capturedAt: new Date().toISOString(),
  }
}

function StatCard({ icon: Icon, label, value, helper }) {
  return (
    <Card className="ff-nutrition-stat-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={21} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">{label}</p>
          <strong className="mt-1 block truncate text-xl font-black text-[var(--ff-text)]">{value}</strong>
          {helper && <span className="mt-1 block text-xs text-[var(--ff-muted)]">{helper}</span>}
        </div>
      </div>
    </Card>
  )
}

function BottomSheet({ open, title, subtitle, children, onClose }) {
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined
    document.body.classList.add('ff-modal-open')
    return () => document.body.classList.remove('ff-modal-open')
  }, [open])

  if (!open) return null

  return (
    <div className="ff-bottom-sheet-overlay" role="dialog" aria-modal="true">
      <button type="button" className="ff-bottom-sheet-backdrop" aria-label="Fechar" onClick={onClose} />
      <section className="ff-bottom-sheet-panel">
        <div className="ff-bottom-sheet-handle" />
        <header className="ff-bottom-sheet-header">
          <div className="min-w-0">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="ff-bottom-sheet-close">
            <X size={18} />
          </button>
        </header>
        <div className="ff-bottom-sheet-content">{children}</div>
      </section>
    </div>
  )
}

function MealPhotoPicker({ photo, onChange, error, onError }) {
  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      onError('')
      const compressed = await compressMealPhoto(file)
      onChange(compressed)
    } catch (err) {
      onError(err?.message || 'Não foi possível adicionar a foto.')
    }
  }

  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-[var(--ff-text-soft)]">Foto opcional</label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="ff-meal-photo-button">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />
          {photo?.dataUrl ? (
            <img src={photo.dataUrl} alt="Prévia da refeição" />
          ) : (
            <span>
              <ImagePlus size={25} />
              Adicionar foto
            </span>
          )}
        </label>
        {photo?.dataUrl && (
          <Button type="button" variant="secondary" onClick={() => onChange(null)} className="sm:w-auto">
            <X size={16} />
            Remover foto
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-bold text-[var(--ff-danger-text)]">{error}</p>}
    </div>
  )
}

function MealForm({ meal, setMeal, onSubmit, onCancel, photoError, setPhotoError, editing }) {
  return (
    <form onSubmit={onSubmit} className="ff-nutrition-form space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <Input
          label="Nome ou descrição"
          value={meal.name}
          onChange={(event) => setMeal((current) => ({ ...current, name: event.target.value }))}
          placeholder="Arroz, frango e salada"
        />
        <Select
          label="Tipo"
          value={meal.type}
          onChange={(event) => setMeal((current) => ({ ...current, type: event.target.value }))}
        >
          {MEAL_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </Select>
      </div>

      <Input
        label="Horário"
        type="time"
        value={meal.time}
        onChange={(event) => setMeal((current) => ({ ...current, time: event.target.value }))}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Input label="Kcal" type="number" min="0" inputMode="numeric" value={meal.calories} onChange={(event) => setMeal((current) => ({ ...current, calories: event.target.value }))} />
        <Input label="Proteína" type="number" min="0" inputMode="decimal" value={meal.proteinG} onChange={(event) => setMeal((current) => ({ ...current, proteinG: event.target.value }))} />
        <Input label="Carbo" type="number" min="0" inputMode="decimal" value={meal.carbsG} onChange={(event) => setMeal((current) => ({ ...current, carbsG: event.target.value }))} />
        <Input label="Gordura" type="number" min="0" inputMode="decimal" value={meal.fatG} onChange={(event) => setMeal((current) => ({ ...current, fatG: event.target.value }))} />
      </div>

      <MealPhotoPicker
        photo={meal.photo}
        onChange={(photo) => setMeal((current) => ({ ...current, photo }))}
        error={photoError}
        onError={setPhotoError}
      />

      <Textarea
        label="Observação opcional"
        rows={3}
        value={meal.notes}
        onChange={(event) => setMeal((current) => ({ ...current, notes: event.target.value }))}
        placeholder="Ex: pré-treino, fome, onde comeu..."
      />

      <div className="ff-sheet-action-row">
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full">Cancelar</Button>
        <Button type="submit" className="w-full">
          <Plus size={16} />
          {editing ? 'Salvar edição' : 'Salvar refeição'}
        </Button>
      </div>
    </form>
  )
}

function Nutrition() {
  const { user } = useAuth()
  const [nutrition, setNutrition] = useState(() => applySettingsGoals(getTodayNutrition(), getUserAppSettings(user)))
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [syncStatus, setSyncStatus] = useState(user ? 'syncing' : 'local')
  const [nutritionSource, setNutritionSource] = useState('local')
  const [toast, setToast] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [activeSheet, setActiveSheet] = useState('')
  const [manualWaterMl, setManualWaterMl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [mealForm, setMealForm] = useState(() => createEmptyMeal())
  const [goals, setGoals] = useState(() => {
    const current = applySettingsGoals(getTodayNutrition(), getUserAppSettings(user))
    return {
      waterGoalMl: current.waterGoalMl,
      calorieGoal: current.calorieGoal,
      proteinGoalG: current.proteinGoalG,
      carbsGoalG: current.carbsGoalG || '',
      fatGoalG: current.fatGoalG || '',
    }
  })
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [routineOpen, setRoutineOpen] = useState(false)

  function showToast(type, title, message = '') {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 2800)
  }

  useEffect(() => {
    if (!user) {
      setNutritionSource('local')
      setSyncStatus('local')
      return undefined
    }

    let isMounted = true
    setSyncStatus('syncing')

    loadNutritionFromDatabase(30)
      .then(({ today }) => {
        if (!isMounted) return
        const settingsGoals = getUserAppSettings(user)
        const mergedToday = applySettingsGoals(today, settingsGoals)
        setNutrition(mergedToday)
        setGoals({
          waterGoalMl: mergedToday.waterGoalMl,
          calorieGoal: mergedToday.calorieGoal,
          proteinGoalG: mergedToday.proteinGoalG,
          carbsGoalG: mergedToday.carbsGoalG || '',
          fatGoalG: mergedToday.fatGoalG || '',
        })
        setNutritionSource('database')
        setSyncStatus('synced')
        setHistoryRefreshKey((current) => current + 1)
      })
      .catch((error) => {
        console.error(error)
        if (!isMounted) return
        setNutritionSource('local')
        setSyncStatus('offline')
        showToast('error', 'Nutrição salva localmente', 'Não foi possível sincronizar agora.')
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const waterPercent = useMemo(
    () => clampPercent(nutrition.waterMl, nutrition.waterGoalMl),
    [nutrition.waterGoalMl, nutrition.waterMl],
  )

  const remaining = useMemo(() => ({
    waterMl: Math.max(0, safeNumber(nutrition.waterGoalMl) - safeNumber(nutrition.waterMl)),
    calories: Math.max(0, safeNumber(nutrition.calorieGoal) - safeNumber(nutrition.calories)),
    proteinG: Math.max(0, safeNumber(nutrition.proteinGoalG) - safeNumber(nutrition.proteinG)),
  }), [nutrition])

  const nutritionHistory = useMemo(
    () => getNutritionHistory(30),
    [nutrition, historyRefreshKey],
  )

  const visibleHistory = useMemo(
    () => (showFullHistory ? nutritionHistory.slice(0, 14) : nutritionHistory.slice(0, 5)),
    [nutritionHistory, showFullHistory],
  )

  const insights = useMemo(() => buildNutritionInsights(nutrition).slice(0, 3), [nutrition])

  const syncBadgeText = useMemo(() => {
    if (syncStatus === 'syncing') return 'Sincronizando'
    if (syncStatus === 'synced') return 'Sincronizado'
    if (syncStatus === 'offline') return 'Salvo local'
    return 'Local'
  }, [syncStatus])

  const macroSplit = useMemo(() => {
    const protein = safeNumber(nutrition.proteinG) * 4
    const carbs = safeNumber(nutrition.carbsG) * 4
    const fat = safeNumber(nutrition.fatG) * 9
    const total = Math.max(1, protein + carbs + fat)

    return {
      protein: Math.round((protein / total) * 100),
      carbs: Math.round((carbs / total) * 100),
      fat: Math.round((fat / total) * 100),
    }
  }, [nutrition.proteinG, nutrition.carbsG, nutrition.fatG])

  async function persistNutritionDay(nextNutrition) {
    if (!user) return

    setSyncStatus('syncing')

    try {
      const saved = await saveNutritionDayToDatabase(nextNutrition)
      setNutrition(saved)
      setNutritionSource('database')
      setSyncStatus('synced')
      setHistoryRefreshKey((current) => current + 1)
    } catch (error) {
      console.error(error)
      setNutritionSource('local')
      setSyncStatus('offline')
      showToast('error', 'Não foi possível sincronizar', 'O registro ficou salvo no aparelho.')
    }
  }

  function commitNutrition(nextNutrition, successMessage = '') {
    setNutrition(nextNutrition)
    setHistoryRefreshKey((current) => current + 1)
    persistNutritionDay(nextNutrition)
    if (successMessage) showToast('success', successMessage)
  }

  function handleAddWater(amount) {
    commitNutrition(addWater(amount), 'Água registrada.')
  }

  function handleRemoveWater(amount) {
    const before = safeNumber(nutrition.waterMl)
    const next = removeWater(amount)
    commitNutrition(next, before <= 0 ? 'A água já está em 0 ml.' : 'Quantidade ajustada.')
  }

  function handleResetWater() {
    setConfirmModal({
      title: 'Zerar água de hoje?',
      description: 'Isso remove apenas o total de hidratação do dia atual.',
      confirmText: 'Zerar',
      variant: 'danger',
      onConfirm: () => {
        commitNutrition(setWater(0), 'Água zerada.')
        setConfirmModal(null)
      },
    })
  }

  function handleAddManualWater(event) {
    event.preventDefault()
    const amount = Number(manualWaterMl)

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('error', 'Informe uma quantidade válida.', 'A água não pode ser negativa ou vazia.')
      return
    }

    commitNutrition(addWater(amount), 'Água registrada.')
    setManualWaterMl('')
    setActiveSheet('')
  }

  function openMealSheet(baseMeal = null) {
    setPhotoError('')
    setMealForm(baseMeal ? {
      id: baseMeal.id,
      name: baseMeal.name || '',
      type: baseMeal.type || 'lunch',
      time: baseMeal.time || getBrazilTimeHHmm(),
      calories: baseMeal.calories ? String(baseMeal.calories) : '',
      proteinG: baseMeal.proteinG ? String(baseMeal.proteinG) : '',
      carbsG: baseMeal.carbsG ? String(baseMeal.carbsG) : '',
      fatG: baseMeal.fatG ? String(baseMeal.fatG) : '',
      notes: baseMeal.notes || '',
      photo: baseMeal.photo || null,
    } : createEmptyMeal())
    setActiveSheet('meal')
  }

  function applyMealPreset(preset) {
    setMealForm((current) => ({
      ...current,
      name: preset.label,
      type: preset.type,
      calories: String(preset.calories),
      proteinG: String(preset.proteinG),
      carbsG: String(preset.carbsG),
      fatG: String(preset.fatG),
      time: getBrazilTimeHHmm(),
    }))
    setActiveSheet('meal')
  }

  function handleSaveMeal(event) {
    event.preventDefault()
    const error = validateMealFields(mealForm)

    if (error) {
      showToast('error', 'Refeição inválida', error)
      return
    }

    const next = mealForm.id ? updateMeal(mealForm.id, mealForm) : addMeal(mealForm)
    commitNutrition(next, mealForm.id ? 'Refeição atualizada.' : 'Refeição registrada.')
    setMealForm(createEmptyMeal())
    setPhotoError('')
    setActiveSheet('')
  }

  function handleRemoveMeal(mealId) {
    setConfirmModal({
      title: 'Excluir refeição?',
      description: 'Ela será removida do dia atual e o resumo será recalculado.',
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: () => {
        commitNutrition(removeMeal(mealId), 'Refeição excluída.')
        setConfirmModal(null)
      },
    })
  }

  function handleSaveGoals(event) {
    event.preventDefault()
    const error = validateNutritionGoals(goals)

    if (error) {
      showToast('error', 'Meta inválida', error)
      return
    }

    const nextNutrition = updateNutritionGoals(goals)
    commitNutrition(nextNutrition, 'Metas atualizadas.')
    setActiveSheet('')
  }

  function handleRoutinePick(item) {
    setMealForm((current) => ({
      ...current,
      name: item.title,
      type: item.type,
      time: item.time,
    }))
    setActiveSheet('meal')
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-nutrition nutrition-page">
      <AppPageIntro
        eyebrow="Nutrição"
        title="Água, refeições e metas do dia"
        description="Acompanhe sua hidratação e alimentação com registros rápidos, simples e salvos por dia."
        metrics={[
          { label: 'Água', value: `${nutrition.waterMl}/${nutrition.waterGoalMl} ml` },
          { label: 'Refeições', value: nutrition.meals.length },
          { label: 'Status', value: syncBadgeText },
        ]}
        action={<Badge variant={nutritionSource === 'database' ? 'purple' : 'default'}>{syncBadgeText}</Badge>}
      />

      <div className="ff-nutrition-page ff-page-mobile-main-grid space-y-5">
        <Card className="ff-nutrition-hero-card p-4 sm:p-5">
          <div className="ff-nutrition-hero-grid">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">Resumo de hoje</p>
              <h1>Nutrição</h1>
              <p>Água, refeições e metas do dia em uma experiência mobile-first.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={() => setActiveSheet('water')} className="flex-1 sm:flex-none">
                  <Droplets size={17} /> Adicionar água
                </Button>
                <Button type="button" variant="secondary" onClick={() => openMealSheet()} className="flex-1 sm:flex-none">
                  <Plus size={17} /> Adicionar refeição
                </Button>
                <Button type="button" variant="ghost" onClick={() => setActiveSheet('history')} className="flex-1 sm:flex-none">
                  <CalendarDays size={17} /> Histórico
                </Button>
              </div>
            </div>

            <div className="ff-water-ring" aria-label={`${waterPercent}% da meta de água`}>
              <div style={{ '--water-progress': `${waterPercent}%` }}>
                <span>{waterPercent}%</span>
                <small>{nutrition.waterMl} / {nutrition.waterGoalMl} ml</small>
              </div>
            </div>
          </div>
        </Card>

        <section className="ff-nutrition-stats-grid">
          <StatCard icon={Droplets} label="Água" value={`${nutrition.waterMl} ml`} helper={`${remaining.waterMl} ml faltando`} />
          <StatCard icon={Target} label="Meta" value={`${nutrition.waterGoalMl} ml`} helper="Hidratação diária" />
          <StatCard icon={Utensils} label="Refeições" value={nutrition.meals.length} helper="Registros de hoje" />
          <StatCard icon={Flame} label="Calorias" value={`${nutrition.calories} kcal`} helper={nutrition.calorieGoal ? `${remaining.calories} kcal restantes` : 'Meta opcional'} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
          <div className="space-y-4">
            <Card className="ff-hydration-card p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Hidratação</p>
                  <h2>1 copo de cada vez</h2>
                  <span>{nutrition.waterMl} ml de {nutrition.waterGoalMl} ml · {waterPercent}% da meta</span>
                </div>
                <button type="button" onClick={handleResetWater} className="ff-icon-soft-button" aria-label="Zerar água do dia">
                  <RotateCcw size={17} />
                </button>
              </div>

              <div className="ff-water-progress-track">
                <span style={{ width: `${waterPercent}%` }} />
              </div>

              <div className="ff-water-button-grid">
                {WATER_PRESETS.map((amount) => (
                  <button key={amount} type="button" onClick={() => handleAddWater(amount)}>
                    +{amount} ml
                  </button>
                ))}
                <button type="button" onClick={() => setActiveSheet('water')} className="is-soft">Quantidade</button>
                <button type="button" onClick={() => handleRemoveWater(250)} disabled={safeNumber(nutrition.waterMl) <= 0} className="is-muted">-250 ml</button>
              </div>

              <p className="ff-safe-hint">Remover água nunca deixa o total abaixo de 0 ml.</p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Atalhos</p>
                  <h2>Registros rápidos</h2>
                  <span>Use um preset e edite antes de salvar.</span>
                </div>
                <Zap size={22} className="shrink-0 text-[var(--ff-accent-text)]" />
              </div>

              <div className="ff-meal-preset-grid">
                {MEAL_PRESETS.map((preset) => (
                  <button key={preset.label} type="button" onClick={() => applyMealPreset(preset)}>
                    <strong>{preset.label}</strong>
                    <small>{preset.calories} kcal · {preset.proteinG}g prot.</small>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Refeições de hoje</p>
                  <h2>{nutrition.meals.length ? `${nutrition.meals.length} registro${nutrition.meals.length > 1 ? 's' : ''}` : 'Nenhum registro ainda'}</h2>
                  <span>Descrição, horário, calorias e macros opcionais.</span>
                </div>
                <Button type="button" onClick={() => openMealSheet()} className="shrink-0 px-3">
                  <Plus size={16} />
                </Button>
              </div>

              <div className="ff-meal-list">
                {nutrition.meals?.length ? nutrition.meals.map((item) => (
                  <article key={item.id} className="ff-meal-list-item nutrition-card">
                    {item.photo?.dataUrl ? (
                      <img src={item.photo.dataUrl} alt={item.name} />
                    ) : (
                      <span className="ff-meal-placeholder"><Utensils size={23} /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <strong className="nutrition-meal-title">{item.name || 'Refeição'}</strong>
                        <Badge>{getMealTypeLabel(item.type)}</Badge>
                      </div>
                      <p>{item.time || '--:--'} · {item.calories || 0} kcal · {item.proteinG || 0}g prot. · {item.carbsG || 0}g carb. · {item.fatG || 0}g gord.</p>
                      {item.notes && <small>{item.notes}</small>}
                    </div>
                    <div className="ff-meal-actions">
                      <button type="button" onClick={() => openMealSheet(item)}>Editar</button>
                      <button type="button" onClick={() => handleRemoveMeal(item.id)} aria-label="Excluir refeição"><Trash2 size={16} /></button>
                    </div>
                  </article>
                )) : (
                  <div className="ff-empty-nutrition-state">
                    <Utensils size={30} />
                    <strong>Nenhum registro ainda</strong>
                    <p>Adicione água ou uma refeição para acompanhar sua rotina.</p>
                    <Button type="button" onClick={() => openMealSheet()}>
                      <Plus size={16} /> Adicionar refeição
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card className="p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Metas nutricionais</p>
                  <h2>Ajuste rápido</h2>
                  <span>Valores opcionais, exceto meta de água.</span>
                </div>
                <Button type="button" variant="secondary" onClick={() => setActiveSheet('goals')} className="shrink-0 px-3">
                  Editar
                </Button>
              </div>
              <div className="ff-goal-mini-list">
                <div><span>Água</span><strong>{nutrition.waterGoalMl} ml</strong></div>
                <div><span>Calorias</span><strong>{nutrition.calorieGoal || 'Opcional'}</strong></div>
                <div><span>Proteína</span><strong>{nutrition.proteinGoalG || 'Opcional'}g</strong></div>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Macros</p>
                  <h2>Resumo simples</h2>
                  <span>Informativo, sem diagnóstico nutricional.</span>
                </div>
                <Scale size={22} className="text-[var(--ff-accent-text)]" />
              </div>
              <div className="ff-macro-bar" aria-label="Distribuição de macros">
                <i style={{ width: `${macroSplit.protein}%` }} />
                <b style={{ width: `${macroSplit.carbs}%` }} />
                <em style={{ width: `${macroSplit.fat}%` }} />
              </div>
              <p className="mt-3 text-sm font-bold text-[var(--ff-text-soft)]">
                {macroSplit.protein}% prot. / {macroSplit.carbs}% carb. / {macroSplit.fat}% gord.
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Insights</p>
                  <h2>Leitura rápida</h2>
                </div>
                <CheckCircle2 size={22} className="text-[var(--ff-success-text)]" />
              </div>
              <div className="ff-insight-list">
                {insights.map((insight) => <p key={insight}>{insight}</p>)}
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <button type="button" className="ff-routine-toggle" onClick={() => setRoutineOpen((current) => !current)}>
                <span>
                  <small>Rotina alimentar</small>
                  <strong>{routineOpen ? 'Ocultar guia' : 'Mostrar guia opcional'}</strong>
                </span>
                <CalendarDays size={21} />
              </button>
              {routineOpen && (
                <div className="ff-routine-list">
                  {ROUTINE_ITEMS.map((item) => (
                    <button key={`${item.time}-${item.title}`} type="button" onClick={() => handleRoutinePick(item)}>
                      <span>{item.time}</span>
                      <strong>{item.title}</strong>
                      <small>Usar como registro</small>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="ff-card-section-head">
                <div className="min-w-0">
                  <p className="ff-section-eyebrow">Histórico</p>
                  <h2>Últimos dias</h2>
                  <span>Separado pelo horário local do Brasil.</span>
                </div>
                <Button type="button" variant="ghost" onClick={() => setActiveSheet('history')} className="shrink-0 px-3">
                  Ver
                </Button>
              </div>
              <div className="ff-history-compact-list">
                {nutritionHistory.slice(0, 4).map((day) => (
                  <div key={day.date}>
                    <strong>{day.date === nutrition.date ? 'Hoje' : new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong>
                    <span>{day.waterMl} ml · {day.meals?.length || 0} ref. · {day.calories} kcal</span>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </section>
      </div>

      <BottomSheet open={activeSheet === 'water'} title="Adicionar água" subtitle="Escolha um atalho ou informe uma quantidade em ml." onClose={() => setActiveSheet('')}>
        <form onSubmit={handleAddManualWater} className="space-y-4">
          <div className="ff-water-custom-grid">
            {WATER_CUSTOM_PRESETS.map((amount) => (
              <button key={amount} type="button" onClick={() => {
                commitNutrition(addWater(amount), 'Água registrada.')
                setActiveSheet('')
              }}>
                {amount} ml
              </button>
            ))}
          </div>
          <Input
            label="Quantidade em ml"
            type="number"
            min="1"
            inputMode="numeric"
            value={manualWaterMl}
            onChange={(event) => setManualWaterMl(event.target.value)}
            placeholder="Ex: 300"
          />
          <div className="ff-sheet-action-row">
            <Button type="button" variant="secondary" onClick={() => setActiveSheet('')} className="w-full">Cancelar</Button>
            <Button type="submit" className="w-full"><Droplets size={16} /> Salvar água</Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === 'meal'} title={mealForm.id ? 'Editar refeição' : 'Adicionar refeição'} subtitle="Calorias e macros são opcionais." onClose={() => setActiveSheet('')}>
        <MealForm
          meal={mealForm}
          setMeal={setMealForm}
          onSubmit={handleSaveMeal}
          onCancel={() => setActiveSheet('')}
          photoError={photoError}
          setPhotoError={setPhotoError}
          editing={Boolean(mealForm.id)}
        />
      </BottomSheet>

      <BottomSheet open={activeSheet === 'goals'} title="Metas do dia" subtitle="Valide metas simples sem transformar o app em ferramenta médica." onClose={() => setActiveSheet('')}>
        <form onSubmit={handleSaveGoals} className="space-y-4">
          <Input label="Meta de água diária (ml)" type="number" min="500" inputMode="numeric" value={goals.waterGoalMl} onChange={(event) => setGoals((current) => ({ ...current, waterGoalMl: event.target.value }))} />
          <Input label="Meta de calorias" type="number" min="0" inputMode="numeric" value={goals.calorieGoal} onChange={(event) => setGoals((current) => ({ ...current, calorieGoal: event.target.value }))} />
          <Input label="Meta de proteína (g)" type="number" min="0" inputMode="numeric" value={goals.proteinGoalG} onChange={(event) => setGoals((current) => ({ ...current, proteinGoalG: event.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Carbo (g)" type="number" min="0" inputMode="numeric" value={goals.carbsGoalG} onChange={(event) => setGoals((current) => ({ ...current, carbsGoalG: event.target.value }))} />
            <Input label="Gordura (g)" type="number" min="0" inputMode="numeric" value={goals.fatGoalG} onChange={(event) => setGoals((current) => ({ ...current, fatGoalG: event.target.value }))} />
          </div>
          <div className="ff-sheet-action-row">
            <Button type="button" variant="secondary" onClick={() => setActiveSheet('')} className="w-full">Cancelar</Button>
            <Button type="submit" className="w-full"><Target size={16} /> Salvar metas</Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === 'history'} title="Histórico de nutrição" subtitle="Resumo por dia em horário local do Brasil." onClose={() => setActiveSheet('')}>
        <div className="ff-history-sheet-list">
          {visibleHistory.map((day) => {
            const dateLabel = day.date === nutrition.date
              ? 'Hoje'
              : new Date(`${day.date}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
            return (
              <article key={day.date}>
                <div>
                  <strong>{dateLabel}</strong>
                  <span>{day.meals?.length || 0} refeições</span>
                </div>
                <div>
                  <strong>{day.waterMl} ml</strong>
                  <span>{day.calories} kcal</span>
                </div>
              </article>
            )
          })}
          <Button type="button" variant="secondary" onClick={() => setShowFullHistory((current) => !current)} className="w-full">
            {showFullHistory ? 'Ver menos' : 'Ver mais dias'}
          </Button>
        </div>
      </BottomSheet>

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  )
}

export default Nutrition
