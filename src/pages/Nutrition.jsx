import { useEffect, useMemo, useState } from 'react'
import {
  Apple,
  Beef,
  Camera,
  Clock3,
  Coffee,
  Droplets,
  Flame,
  ImagePlus,
  Moon,
  Plus,
  RotateCcw,
  Salad,
  Scale,
  Target,
  Trash2,
  Utensils,
  X,
  Zap,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import {
  addMeal,
  addWater,
  getNutritionHistory,
  getTodayNutrition,
  loadNutritionFromDatabase,
  removeMeal,
  saveNutritionDayToDatabase,
  setWater,
  updateNutritionGoals,
} from '../services/nutritionService'
import { useAuth } from '../context/AuthContext'

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Café da manhã', icon: Coffee },
  { value: 'lunch', label: 'Almoço', icon: Utensils },
  { value: 'dinner', label: 'Jantar', icon: Moon },
  { value: 'snack', label: 'Lanche', icon: Apple },
  { value: 'pre-workout', label: 'Pré-treino', icon: Beef },
  { value: 'post-workout', label: 'Pós-treino', icon: Salad },
]

const MEAL_PRESETS = [
  { label: 'Shake pos-treino', type: 'post-workout', calories: 320, proteinG: 32, carbsG: 34, fatG: 4 },
  { label: 'Pre-treino leve', type: 'pre-workout', calories: 260, proteinG: 8, carbsG: 52, fatG: 2 },
  { label: 'Almoco completo', type: 'lunch', calories: 650, proteinG: 42, carbsG: 68, fatG: 18 },
  { label: 'Lanche proteico', type: 'snack', calories: 280, proteinG: 24, carbsG: 24, fatG: 9 },
]

const WATER_PRESETS = [100, 250, 350, 500, 700, 1000]

const NUTRITION_ROUTINE = [
  { time: '07:30', label: 'Café', helper: 'primeira refeição e água' },
  { time: '12:00', label: 'Almoço', helper: 'refeição principal' },
  { time: '16:30', label: 'Pré-treino', helper: 'energia rápida' },
  { time: '19:30', label: 'Pós-treino', helper: 'proteína e recuperação' },
  { time: '21:30', label: 'Jantar/ceia', helper: 'fechar macros' },
]

import AppPageIntro from '../components/app/AppPageIntro'

function clampPercent(value, goal) {
  const safeGoal = Math.max(1, Number(goal) || 1)
  return Math.max(0, Math.min(100, Math.round(((Number(value) || 0) / safeGoal) * 100)))
}

function getMealTypeLabel(type) {
  return MEAL_TYPES.find((item) => item.value === type)?.label || 'Refeição'
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
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const compressed = canvas.toDataURL('image/jpeg', 0.78)

  return {
    dataUrl: compressed,
    mimeType: 'image/jpeg',
    size: Math.round((compressed.length * 3) / 4),
    capturedAt: new Date().toISOString(),
  }
}

function MetricCard({ icon: Icon, title, value, goal, suffix, description }) {
  const percent = clampPercent(value, goal)

  return (
    <Card className="ff-nutrition-metric-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
            <Icon size={21} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">{title}</p>
            <p className="mt-1 text-xl font-black text-[var(--ff-text)]">
              {value}<span className="text-sm text-[var(--ff-muted)]">/{goal}{suffix}</span>
            </p>
          </div>
        </div>
        <Badge>{percent}%</Badge>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
        <div className="h-full rounded-full bg-[var(--ff-accent)] transition-all" style={{ width: `${percent}%` }} />
      </div>
      {description && <p className="mt-2 text-xs text-[var(--ff-muted)]">{description}</p>}
    </Card>
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
    <div className="ff-meal-photo-picker">
      <label className="block text-sm font-bold text-[var(--ff-text-soft)]">Foto da comida</label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-[112px] flex-1 cursor-pointer items-center justify-center rounded-3xl border border-dashed border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-center transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-accent-soft)]/10">
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />
          {photo?.dataUrl ? (
            <img src={photo.dataUrl} alt="Prévia da refeição" className="h-28 w-full rounded-2xl object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm font-bold text-[var(--ff-muted)]">
              <ImagePlus size={28} />
              Adicionar foto
            </span>
          )}
        </label>
        {photo?.dataUrl && (
          <Button type="button" variant="secondary" onClick={() => onChange(null)} className="sm:w-auto">
            <X size={16} /> Remover
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-bold text-red-300">{error}</p>}
    </div>
  )
}

function Nutrition() {
  const { user } = useAuth()
  const initialNutrition = getTodayNutrition()
  const [nutrition, setNutrition] = useState(() => initialNutrition)
  const [meal, setMeal] = useState({
    name: '',
    type: 'lunch',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    notes: '',
    time: new Date().toTimeString().slice(0, 5),
    photo: null,
  })
  const [photoError, setPhotoError] = useState('')
  const [manualWaterMl, setManualWaterMl] = useState('')
  const [goals, setGoals] = useState(() => ({
    waterGoalMl: initialNutrition.waterGoalMl,
    calorieGoal: initialNutrition.calorieGoal,
    proteinGoalG: initialNutrition.proteinGoalG,
  }))
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [nutritionSource, setNutritionSource] = useState('local')
  const [syncStatus, setSyncStatus] = useState(user ? 'syncing' : 'local')

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
        setNutrition(today)
        setGoals({
          waterGoalMl: today.waterGoalMl,
          calorieGoal: today.calorieGoal,
          proteinGoalG: today.proteinGoalG,
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
      })

    return () => {
      isMounted = false
    }
  }, [user])

  const waterPercent = useMemo(() => clampPercent(nutrition.waterMl, nutrition.waterGoalMl), [nutrition.waterGoalMl, nutrition.waterMl])
  const remaining = useMemo(() => ({
    waterMl: Math.max(0, Number(nutrition.waterGoalMl || 0) - Number(nutrition.waterMl || 0)),
    calories: Math.max(0, Number(nutrition.calorieGoal || 0) - Number(nutrition.calories || 0)),
    proteinG: Math.max(0, Number(nutrition.proteinGoalG || 0) - Number(nutrition.proteinG || 0)),
  }), [nutrition.calorieGoal, nutrition.calories, nutrition.proteinG, nutrition.proteinGoalG, nutrition.waterGoalMl, nutrition.waterMl])
  const macroSplit = useMemo(() => {
    const protein = Number(nutrition.proteinG || 0) * 4
    const carbs = Number(nutrition.carbsG || 0) * 4
    const fat = Number(nutrition.fatG || 0) * 9
    const total = Math.max(1, protein + carbs + fat)

    return {
      protein: Math.round((protein / total) * 100),
      carbs: Math.round((carbs / total) * 100),
      fat: Math.round((fat / total) * 100),
    }
  }, [nutrition.carbsG, nutrition.fatG, nutrition.proteinG])
  const nutritionHistory = useMemo(() => getNutritionHistory(14), [nutrition, historyRefreshKey])
  const lastSevenAverageCalories = useMemo(() => {
    const days = nutritionHistory.slice(0, 7)
    return Math.round(days.reduce((total, day) => total + Number(day.calories || 0), 0) / Math.max(1, days.length))
  }, [nutritionHistory])

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
    }
  }

  function commitNutrition(nextNutrition) {
    setNutrition(nextNutrition)
    setHistoryRefreshKey((current) => current + 1)
    persistNutritionDay(nextNutrition)
  }

  function handleAddWater(amount) {
    commitNutrition(addWater(amount))
  }

  function handleResetWater() {
    commitNutrition(setWater(0))
  }

  function handleAddManualWater(event) {
    event.preventDefault()
    const amount = Math.max(0, Number(manualWaterMl) || 0)
    if (!amount) return

    commitNutrition(addWater(amount))
    setManualWaterMl('')
  }

  function handleAddMeal(event) {
    event.preventDefault()
    if (!meal.name.trim() && !meal.calories && !meal.proteinG && !meal.photo) return
    commitNutrition(addMeal(meal))
    setMeal({
      name: '',
      type: 'lunch',
      calories: '',
      proteinG: '',
      carbsG: '',
      fatG: '',
      notes: '',
      time: new Date().toTimeString().slice(0, 5),
      photo: null,
    })
    setPhotoError('')
  }

  function handleRemoveMeal(mealId) {
    commitNutrition(removeMeal(mealId))
  }

  function applyMealPreset(preset) {
    setMeal((current) => ({
      ...current,
      name: preset.label,
      type: preset.type,
      calories: String(preset.calories),
      proteinG: String(preset.proteinG),
      carbsG: String(preset.carbsG),
      fatG: String(preset.fatG),
      time: new Date().toTimeString().slice(0, 5),
    }))
  }

  function repeatLastMeal() {
    const lastMeal = nutrition.meals?.[0]
    if (!lastMeal) return

    setMeal((current) => ({
      ...current,
      name: lastMeal.name,
      type: lastMeal.type || 'lunch',
      calories: String(lastMeal.calories || ''),
      proteinG: String(lastMeal.proteinG || ''),
      carbsG: String(lastMeal.carbsG || ''),
      fatG: String(lastMeal.fatG || ''),
      notes: lastMeal.notes || '',
      time: new Date().toTimeString().slice(0, 5),
      photo: null,
    }))
  }

  function handleSaveGoals(event) {
    event.preventDefault()
    const nextNutrition = updateNutritionGoals(goals)
    commitNutrition(nextNutrition)
  }
  return (
    <div className="ff-hevy-page ff-hevy-page-nutrition">

      <AppPageIntro
        eyebrow="Nutrição"
        title="Hoje"
        description="Registre água, refeições e macros em blocos rápidos."
        metrics={[
          { label: 'Refeições', value: nutrition.meals.length },
          { label: 'Kcal', value: nutrition.calories },
          { label: 'Proteína', value: `${nutrition.proteinG}g` },
        ]}
      />

    <div className="ff-nutrition-page ff-page-mobile-main-grid space-y-5">
      <PageHeader
        title="Nutrição"
        description="Acompanhe hidratação, refeições e metas simples junto com seus treinos."
        action={
          <Badge variant={nutritionSource === 'database' ? 'purple' : 'default'}>
            {syncStatus === 'syncing'
              ? 'Sincronizando...'
              : syncStatus === 'synced'
                ? 'Sincronizado'
                : syncStatus === 'offline'
                  ? 'Offline/local'
                  : 'Salvo'}
          </Badge>
        }
      />

      <Card className="ff-nutrition-hero ff-nutrition-dashboard overflow-hidden p-4 sm:p-5">
        <div className="ff-nutrition-dashboard__main">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Resumo do dia</p>
            <h2>Energia para evoluir</h2>
            <p>Registre por foto, macros ou atalhos rápidos com salvamento automático quando houver conexão.</p>
          </div>

          <div className="ff-nutrition-dashboard__score">
            <span>{clampPercent(nutrition.calories, nutrition.calorieGoal)}%</span>
            <small>calorias</small>
          </div>
        </div>

        <div className="ff-nutrition-dashboard__grid">
          <div><Clock3 size={16} /><strong>{nutrition.meals.length}</strong><span>refeicoes</span></div>
          <div><Flame size={16} /><strong>{remaining.calories}</strong><span>kcal restantes</span></div>
          <div><Beef size={16} /><strong>{remaining.proteinG}g</strong><span>proteina falta</span></div>
          <div><Droplets size={16} /><strong>{remaining.waterMl}ml</strong><span>agua falta</span></div>
        </div>
      </Card>

      <section className="ff-nutrition-metrics grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard icon={Droplets} title="Hidratação" value={nutrition.waterMl} goal={nutrition.waterGoalMl} suffix="ml" description="Meta diária configurável" />
        <MetricCard icon={Flame} title="Calorias" value={nutrition.calories} goal={nutrition.calorieGoal} suffix="kcal" description="Total vindo das refeições" />
        <MetricCard icon={Scale} title="Proteína" value={nutrition.proteinG} goal={nutrition.proteinGoalG} suffix="g" description="Foco em recuperação" />
      </section>

      <section className="ff-nutrition-quick-panel">
        <div className="ff-nutrition-quick-card">
          <div className="ff-nutrition-quick-card__head">
            <span><Zap size={16} /> Atalhos</span>
            <button type="button" onClick={repeatLastMeal} disabled={!nutrition.meals?.length}>Repetir ultima</button>
          </div>

          <div className="ff-nutrition-preset-row">
            {MEAL_PRESETS.map((preset) => (
              <button key={preset.label} type="button" onClick={() => applyMealPreset(preset)}>
                <strong>{preset.label}</strong>
                <small>{preset.calories} kcal | {preset.proteinG}g prot.</small>
              </button>
            ))}
          </div>
        </div>

        <div className="ff-nutrition-macro-card">
          <div>
            <span><Target size={16} /> Macros</span>
            <strong>{macroSplit.protein}% prot. / {macroSplit.carbs}% carb. / {macroSplit.fat}% gord.</strong>
          </div>
          <div className="ff-nutrition-macro-bar">
            <i style={{ width: `${macroSplit.protein}%` }} />
            <b style={{ width: `${macroSplit.carbs}%` }} />
            <em style={{ width: `${macroSplit.fat}%` }} />
          </div>
        </div>
      </section>

      <section className="ff-page-mobile-main-grid grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <div className="ff-nutrition-primary-flow space-y-4">
          <Card className="ff-hydration-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200">
                <Droplets size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-[var(--ff-text)]">Hidratação do dia</h2>
                    <p className="mt-1 text-sm text-[var(--ff-muted)]">{waterPercent}% da meta concluída.</p>
                  </div>
                  <Button type="button" variant="ghost" onClick={handleResetWater} className="shrink-0 px-3" title="Zerar água do dia">
                    <RotateCcw size={16} />
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {WATER_PRESETS.map((amount) => (
                    <button key={amount} type="button" onClick={() => handleAddWater(amount)} className="ff-quick-water-button" title={`Adicionar ${amount}ml`}>
                      +{amount}ml
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAddManualWater} className="ff-water-manual-form">
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    placeholder="Ex: 350ml"
                    value={manualWaterMl}
                    onChange={(event) => setManualWaterMl(event.target.value)}
                  />
                  <button type="submit">Adicionar</button>
                </form>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddWater(-250)}
                    disabled={Number(nutrition.waterMl || 0) <= 0}
                    title="Remover 250ml sem deixar a água negativa"
                    className="ff-quick-water-button ff-quick-water-button-muted"
                  >
                    -250ml
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddWater(-500)}
                    disabled={Number(nutrition.waterMl || 0) <= 0}
                    title="Remover 500ml sem deixar a água negativa"
                    className="ff-quick-water-button ff-quick-water-button-muted"
                  >
                    -500ml
                  </button>
                </div>
                <p className="ff-water-safe-hint">Os botões de remover corrigem lançamento errado e nunca deixam o total abaixo de 0ml.</p>
              </div>
            </div>
          </Card>

          <Card className="ff-nutrition-history-card p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Histórico</p>
                <h2 className="mt-1 text-xl font-black">Últimos dias</h2>
                <p className="mt-1 text-sm text-[var(--ff-muted)]">Resumo salvo por dia, usando horário do Brasil.</p>
              </div>
              <Badge>{lastSevenAverageCalories} kcal/dia</Badge>
            </div>

            <div className="ff-nutrition-history-strip">
              {nutritionHistory.slice(0, 7).reverse().map((day) => {
                const waterDone = clampPercent(day.waterMl, day.waterGoalMl)
                const dayDate = new Date(`${day.date}T12:00:00`)

                return (
                  <div key={day.date} className={day.meals?.length ? 'is-complete' : ''} title={`${day.waterMl}ml de água · ${day.calories} kcal`}>
                    <span>{dayDate.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                    <strong>{dayDate.getDate()}</strong>
                    <i style={{ height: `${Math.max(12, waterDone * 0.56)}px` }} />
                    <small>{day.meals?.length || 0} ref.</small>
                  </div>
                )
              })}
            </div>

            <div className="ff-nutrition-day-history-list">
              {nutritionHistory.map((day) => {
                const dayDate = new Date(`${day.date}T12:00:00`)
                const waterDone = clampPercent(day.waterMl, day.waterGoalMl)
                const isToday = day.date === nutrition.date

                return (
                  <article key={day.date} className={isToday ? 'is-today' : ''}>
                    <div>
                      <strong>{isToday ? 'Hoje' : dayDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</strong>
                      <span>{day.meals?.length || 0} refeições</span>
                    </div>
                    <div>
                      <strong>{day.calories} kcal</strong>
                      <span>{day.proteinG}g prot.</span>
                    </div>
                    <div>
                      <strong>{day.waterMl}ml</strong>
                      <span>{waterDone}% água</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <Utensils size={21} />
              </span>
              <div>
                <h2 className="text-xl font-black">Nova refeição</h2>
                <p className="text-sm text-[var(--ff-muted)]">Registre alimento, macros e uma foto opcional.</p>
              </div>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.2fr)_210px_130px]">
                <Input label="Nome" value={meal.name} onChange={(event) => setMeal((current) => ({ ...current, name: event.target.value }))} placeholder="Almoço, omelete, shake..." />
                <Select label="Tipo" value={meal.type} onChange={(event) => setMeal((current) => ({ ...current, type: event.target.value }))}>
                  {MEAL_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </Select>
                <Input label="Hora" type="time" value={meal.time} onChange={(event) => setMeal((current) => ({ ...current, time: event.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Input label="Kcal" type="number" min="0" inputMode="numeric" value={meal.calories} onChange={(event) => setMeal((current) => ({ ...current, calories: event.target.value }))} />
                <Input label="Proteína" type="number" min="0" inputMode="decimal" value={meal.proteinG} onChange={(event) => setMeal((current) => ({ ...current, proteinG: event.target.value }))} />
                <Input label="Carbo" type="number" min="0" inputMode="decimal" value={meal.carbsG} onChange={(event) => setMeal((current) => ({ ...current, carbsG: event.target.value }))} />
                <Input label="Gordura" type="number" min="0" inputMode="decimal" value={meal.fatG} onChange={(event) => setMeal((current) => ({ ...current, fatG: event.target.value }))} />
              </div>

              <MealPhotoPicker photo={meal.photo} onChange={(photo) => setMeal((current) => ({ ...current, photo }))} error={photoError} onError={setPhotoError} />
              <Textarea label="Observação" rows={3} value={meal.notes} onChange={(event) => setMeal((current) => ({ ...current, notes: event.target.value }))} placeholder="Opcional: fome, horário, pré-treino, onde comeu..." />

              <Button type="submit" className="w-full">
                <Plus size={16} /> Salvar refeição
              </Button>
            </form>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Refeições de hoje</h2>
                <p className="text-sm text-[var(--ff-muted)]">Fotos e macros do dia em ordem recente.</p>
              </div>
              <Camera size={22} className="text-[var(--ff-accent-text)]" />
            </div>

            <div className="space-y-3">
              {nutrition.meals?.length ? nutrition.meals.map((item) => (
                <div key={item.id} className="ff-meal-list-item">
                  {item.photo?.dataUrl ? (
                    <img src={item.photo.dataUrl} alt={item.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-surface-3)] text-[var(--ff-muted)]"><Utensils size={24} /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-[var(--ff-text)]">{item.name}</p>
                      <Badge>{getMealTypeLabel(item.type)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ff-muted)]">{item.time} · {item.calories} kcal · {item.proteinG}g prot. · {item.carbsG || 0}g carb. · {item.fatG || 0}g gord.</p>
                    {item.notes && <p className="mt-1 line-clamp-2 text-xs text-[var(--ff-text-soft)]">{item.notes}</p>}
                  </div>
                  <Button variant="ghost" onClick={() => handleRemoveMeal(item.id)} className="shrink-0 px-3">
                    <Trash2 size={16} />
                  </Button>
                </div>
              )) : (
                <div className="rounded-3xl border border-dashed border-[var(--ff-border)] p-6 text-center">
                  <Utensils size={28} className="mx-auto text-[var(--ff-muted)]" />
                  <p className="mt-3 text-sm font-bold text-[var(--ff-text)]">Nenhuma refeição registrada hoje</p>
                  <p className="mt-1 text-xs text-[var(--ff-muted)]">Adicione uma refeição para acompanhar calorias, proteína e fotos.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Metas do dia</p>
            <h2 className="mt-1 text-xl font-black">Ajuste rápido</h2>
            <p className="mt-1 text-sm text-[var(--ff-muted)]">As metas ficam salvas na sua conta quando houver conexão e continuam disponíveis offline.</p>

            <form onSubmit={handleSaveGoals} className="mt-4 space-y-3">
              <Input label="Meta de água (ml)" type="number" min="500" inputMode="numeric" value={goals.waterGoalMl} onChange={(event) => setGoals((current) => ({ ...current, waterGoalMl: event.target.value }))} />
              <Input label="Meta de calorias" type="number" min="500" inputMode="numeric" value={goals.calorieGoal} onChange={(event) => setGoals((current) => ({ ...current, calorieGoal: event.target.value }))} />
              <Input label="Meta de proteína (g)" type="number" min="20" inputMode="numeric" value={goals.proteinGoalG} onChange={(event) => setGoals((current) => ({ ...current, proteinGoalG: event.target.value }))} />
              <Button type="submit" className="w-full">Salvar metas</Button>
            </form>

            <div className="mt-5 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <h3 className="font-black">Status da sincronização</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                {syncStatus === 'synced'
                  ? 'Nutrição salva e pronta para abrir rápido.'
                  : syncStatus === 'syncing'
                    ? 'Salvando alterações...'
                    : 'Sem conexão agora: os dados ficam salvos no aparelho e sincronizam depois.'}
              </p>
            </div>
          </Card>

          <Card className="ff-nutrition-routine-card p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Rotina opcional</p>
            <h2 className="mt-1 text-xl font-black">Modelo de refeições</h2>
            <p className="mt-1 text-sm text-[var(--ff-muted)]">Base visual para a próxima etapa: transformar horários e refeições em rotina persistente.</p>

            <div className="mt-4 space-y-2">
              {NUTRITION_ROUTINE.map((item) => (
                <button
                  key={`${item.time}-${item.label}`}
                  type="button"
                  className="ff-nutrition-routine-step"
                  onClick={() => setMeal((current) => ({
                    ...current,
                    name: item.label,
                    type: item.label === 'Café' ? 'breakfast' : item.label === 'Almoço' ? 'lunch' : item.label.includes('Pós') ? 'post-workout' : item.label.includes('Pré') ? 'pre-workout' : 'dinner',
                    time: item.time,
                  }))}
                >
                  <span>{item.time}</span>
                  <strong>{item.label}</strong>
                  <small>{item.helper}</small>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  
    </div>
  )
}

export default Nutrition
