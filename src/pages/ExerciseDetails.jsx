import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ImageOff,
  Target,
  Layers3,
  Gauge,
  Repeat,
  BarChart3,
  Trophy,
  UsersRound,
  CalendarDays,
  Clock3,
  Flame,
  Medal,
  Plus,
} from 'lucide-react'

import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import AppPageIntro from '../components/app/AppPageIntro'

import { useAuth } from '../context/AuthContext'
import { getUserStorageData } from '../utils/userStorage'
import defaultExercises from '../data/defaultExercises'

import { getExerciseMedia, normalizeList } from '../features/exerciseDetails/exerciseDetailsUtils'
import { isUserCreatedExercise } from '../features/exercises/exerciseLibraryUtils'
import { InfoList, SummaryItem } from '../features/exerciseDetails/components/ExerciseDetailsUi'

const TABS = [
  { id: 'summary', label: 'Resumo' },
  { id: 'history', label: 'Histórico' },
  { id: 'instructions', label: 'Instruções' },
  { id: 'ranking', label: 'Recordes' },
]

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function formatDate(value) {
  if (!value) return 'Sem data'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Sem data'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDuration(seconds) {
  const safeSeconds = Number(seconds) || 0
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}min`
  return `${minutes || 1}min`
}

function getExerciseKeys(exercise = {}) {
  return [
    exercise.id,
    exercise._id,
    exercise.localId,
    exercise.originalLocalId,
    exercise.exerciseId,
    exercise.name,
    exercise.originalName,
  ].filter(Boolean).map((value) => String(value))
}

function getHistoryExerciseKeys(historyExercise = {}) {
  const exercise = historyExercise.exercise || historyExercise

  return [
    historyExercise.id,
    historyExercise.originalExerciseId,
    historyExercise.exerciseId,
    exercise.id,
    exercise._id,
    exercise.localId,
    exercise.originalLocalId,
    exercise.name,
    exercise.originalName,
  ].filter(Boolean).map((value) => String(value))
}

function getPrLabels(set) {
  const labels = []

  if (set?.isWeightPR) labels.push('Peso')
  if (set?.isVolumePR) labels.push('Volume')
  if (set?.isPR && labels.length === 0) labels.push('Recorde')

  return labels
}

function buildExerciseHistory(exercise, history = []) {
  const targetKeys = new Set([
    ...getExerciseKeys(exercise),
    ...getExerciseKeys(exercise).map(normalizeKey),
  ])

  const sessions = []
  let bestWeight = 0
  let bestVolume = 0
  let totalSets = 0
  let totalVolume = 0
  let prWeight = 0
  let prVolume = 0
  let prGeneric = 0
  let lastSet = null

  history.forEach((session) => {
    const finishedAt = session.finishedAt || session.createdAt || session.updatedAt || session.startedAt
    const matches = (Array.isArray(session.exercises) ? session.exercises : [])
      .filter((historyExercise) => {
        const keys = getHistoryExerciseKeys(historyExercise)
        return keys.some((key) => targetKeys.has(key) || targetKeys.has(normalizeKey(key)))
      })

    if (matches.length === 0) return

    const sets = matches.flatMap((historyExercise) => (
      Array.isArray(historyExercise.sets)
        ? historyExercise.sets.map((set) => ({ ...set, _exerciseName: historyExercise.exercise?.name || historyExercise.name || exercise.name }))
        : []
    )).filter((set) => set.completed && Number(set.weight) > 0 && Number(set.reps) > 0)

    if (sets.length === 0) return

    const sessionVolume = sets.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0)
    const sessionPrs = sets.flatMap((set) => getPrLabels(set))

    sets.forEach((set) => {
      const weight = Number(set.weight) || 0
      const reps = Number(set.reps) || 0
      const volume = weight * reps
      const labels = getPrLabels(set)

      bestWeight = Math.max(bestWeight, weight)
      bestVolume = Math.max(bestVolume, volume)
      totalSets += 1
      totalVolume += volume

      if (labels.includes('Peso')) prWeight += 1
      if (labels.includes('Volume')) prVolume += 1
      if (labels.includes('Recorde')) prGeneric += 1
    })

    const newestSet = sets[sets.length - 1]
    if (!lastSet || new Date(finishedAt).getTime() >= new Date(lastSet.finishedAt || 0).getTime()) {
      lastSet = { ...newestSet, finishedAt, workoutName: session.workoutName || session.name || 'Treino' }
    }

    sessions.push({
      id: session.id || `${finishedAt}-${sessions.length}`,
      workoutName: session.workoutName || session.name || 'Treino',
      finishedAt,
      duration: session.durationSeconds ?? session.duration ?? 0,
      setCount: sets.length,
      volume: sessionVolume,
      prs: sessionPrs,
      sets: sets.slice(-4).reverse(),
    })
  })

  return {
    sessions: sessions.sort((a, b) => new Date(b.finishedAt || 0) - new Date(a.finishedAt || 0)),
    bestWeight,
    bestVolume,
    totalSets,
    totalVolume,
    prCount: prWeight + prVolume + prGeneric,
    prWeight,
    prVolume,
    prGeneric,
    lastSet,
  }
}

function ExerciseTabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? 'ff-exercise-detail-tab is-active' : 'ff-exercise-detail-tab'}
    >
      {children}
    </button>
  )
}

function EmptyPanel({ icon: Icon, title, description }) {
  return (
    <div className="ff-exercise-empty-panel">
      <span>
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function ExerciseStatTile({ label, value, hint, icon: Icon, accent = false }) {
  return (
    <div className={accent ? 'ff-exercise-detail-stat is-accent' : 'ff-exercise-detail-stat'}>
      <span><Icon size={18} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  )
}

function ExerciseDetails() {
  const { exerciseId } = useParams()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('summary')

  const exercise = useMemo(() => {
    const userExercises = getUserStorageData(user, 'exercises', [])
    const allExercises = [
      ...userExercises,
      ...(Array.isArray(defaultExercises) ? defaultExercises : []),
    ]

    return allExercises.find((item) => {
      const ids = [
        item.id,
        item._id,
        item.originalLocalId,
        item.localId,
        item.exerciseId,
      ]
        .filter(Boolean)
        .map((value) => String(value))

      return ids.includes(String(exerciseId))
    }) || null
  }, [exerciseId, user])

  const history = useMemo(() => {
    if (!user) return []
    const cached = getUserStorageData(user, 'history', getUserStorageData(user, 'workoutHistory', []))
    return Array.isArray(cached) ? cached : []
  }, [user])

  const exerciseHistory = useMemo(() => {
    if (!exercise) return null
    return buildExerciseHistory(exercise, history)
  }, [exercise, history])

  if (!exercise) {
    return (
      <>
        <div className="mb-5">
          <Link to="/exercises" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]">
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        <EmptyState
          title="Exercício não encontrado"
          description="Volte para a biblioteca e selecione outro exercício."
          action={
            <Link to="/exercises">
              <Button>Voltar</Button>
            </Link>
          }
        />
      </>
    )
  }

  const media = getExerciseMedia(exercise)
  const userCreated = isUserCreatedExercise(exercise)
  const instructionsList = normalizeList(exercise.instructions || exercise.execution)
  const tipsList = normalizeList(exercise.tips || exercise.variations)
  const mistakesList = normalizeList(exercise.commonMistakes)
  const secondaryMuscles = normalizeList(exercise.secondaryMuscles)
  const lastSetLabel = exerciseHistory?.lastSet
    ? `${exerciseHistory.lastSet.weight}kg × ${exerciseHistory.lastSet.reps} reps`
    : 'Sem registro'

  return (
    <div className="ff-hevy-page ff-hevy-page-exercisedetails ff-exercise-detail-page-v2">
      <AppPageIntro
        eyebrow="Exercício"
        title={exercise?.name || 'Detalhes'}
        description="Resumo, histórico, instruções e recordes em visual mais próximo de app."
      />

      <div className="ff-exercise-detail-topbar">
        <Link to="/exercises" aria-label="Voltar para exercícios">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <p>{exercise.name}</p>
          <span>{exercise.muscleGroup || 'Biblioteca'} · {exercise.equipment || 'Equipamento'}</span>
        </div>
      </div>

      <section className="ff-exercise-detail-hero">
        <div className="ff-exercise-detail-hero__media">
          {media ? (
            <img src={media} alt={exercise.name} loading="lazy" decoding="async" />
          ) : (
            <div>
              <Dumbbell size={44} />
              <p>Imagem do exercício</p>
              <small>Adicione uma imagem ou GIF depois.</small>
            </div>
          )}
        </div>

        <div className="ff-exercise-detail-hero__content">
          <div className="ff-exercise-detail-hero__chips">
            <Badge variant="purple">{exercise.muscleGroup || 'Grupo'}</Badge>
            <Badge>{exercise.equipment || 'Equipamento'}</Badge>
            {media ? <Badge variant="green">Com mídia</Badge> : <Badge>Sem mídia</Badge>}
            {userCreated && <Badge variant="green">Criado por você</Badge>}
          </div>

          <h1>{exercise.name}</h1>
          <p>
            Primário: <strong>{exercise.targetMuscle || exercise.muscleGroup || 'Não informado'}</strong>
            {secondaryMuscles.length > 0 ? ` · Secundários: ${secondaryMuscles.join(', ')}` : ''}
          </p>

          <div className="ff-exercise-detail-statgrid">
            <ExerciseStatTile label="Último" value={lastSetLabel} hint={exerciseHistory?.lastSet?.workoutName} icon={CalendarDays} />
            <ExerciseStatTile label="Maior peso" value={exerciseHistory?.bestWeight ? `${exerciseHistory.bestWeight}kg` : '—'} icon={Dumbbell} />
            <ExerciseStatTile label="Maior volume" value={exerciseHistory?.bestVolume ? `${exerciseHistory.bestVolume}kg` : '—'} icon={Flame} />
            <ExerciseStatTile label="Recordes" value={exerciseHistory?.prCount || 0} hint="peso + volume" icon={Trophy} accent={(exerciseHistory?.prCount || 0) > 0} />
          </div>
        </div>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="ff-exercise-detail-tabs">
          {TABS.map((tab) => (
            <ExerciseTabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </ExerciseTabButton>
          ))}
        </div>

        <div className="ff-exercise-detail-tabbody">
          {activeTab === 'summary' && (
            <section className="ff-page-mobile-main-grid grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="ff-exercise-detail-primary-flow space-y-4">
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                      <Lightbulb size={24} />
                    </span>
                    <div>
                      <h2 className="text-xl font-black">Como usar no treino</h2>
                      <p className="text-sm text-[var(--ff-muted)]">Registre carga e reps para acompanhar evolução, PRs e volume.</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <ExerciseStatTile label="Séries" value={exerciseHistory?.totalSets || 0} icon={Repeat} />
                    <ExerciseStatTile label="Volume total" value={`${Number(exerciseHistory?.totalVolume || 0).toLocaleString('pt-BR')}kg`} icon={BarChart3} />
                    <ExerciseStatTile label="PR Peso" value={exerciseHistory?.prWeight || 0} icon={Medal} accent={(exerciseHistory?.prWeight || 0) > 0} />
                    <ExerciseStatTile label="PR Volume" value={exerciseHistory?.prVolume || 0} icon={Trophy} accent={(exerciseHistory?.prVolume || 0) > 0} />
                  </div>
                </Card>

                {exercise.description && (
                  <Card className="p-4 sm:p-5">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">Observações</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--ff-text-soft)]">{exercise.description}</p>
                  </Card>
                )}
              </div>

              <Card className="p-4 sm:p-5">
                <h2 className="text-xl font-black">Resumo técnico</h2>
                <div className="mt-5 space-y-3">
                  <SummaryItem label="Grupo muscular" value={exercise.muscleGroup} icon={Dumbbell} />
                  <SummaryItem label="Músculo alvo" value={exercise.targetMuscle} icon={Target} />
                  <SummaryItem label="Equipamento" value={exercise.equipment} icon={Layers3} />
                  <SummaryItem label="Dificuldade" value={exercise.difficulty} icon={Gauge} />
                  <SummaryItem label="Padrão de movimento" value={exercise.movementPattern} icon={Repeat} />
                  {userCreated && <SummaryItem label="Origem" value="Criado por você" icon={UsersRound} />}
                  <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                    <p className="text-xs text-[var(--ff-muted)]">Mídia</p>
                    <div className="mt-1 flex items-center gap-2 font-black">
                      {media ? <><Dumbbell size={18} className="text-[var(--ff-accent-text)]" /> Disponível</> : <><ImageOff size={18} className="text-[var(--ff-muted)]" /> Não cadastrada</>}
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeTab === 'history' && (
            exerciseHistory?.sessions?.length > 0 ? (
              <section className="ff-exercise-detail-history-list">
                {exerciseHistory.sessions.slice(0, 12).map((session) => (
                  <article key={session.id} className="ff-exercise-detail-history-card">
                    <div>
                      <span><CalendarDays size={15} /> {formatDate(session.finishedAt)}</span>
                      <h3>{session.workoutName}</h3>
                      <p>{session.setCount} séries · {Number(session.volume || 0).toLocaleString('pt-BR')}kg de volume · {formatDuration(session.duration)}</p>
                    </div>

                    {session.prs.length > 0 && (
                      <div className="ff-exercise-detail-history-prs">
                        {Array.from(new Set(session.prs)).map((label) => <em key={label}>{label} PR</em>)}
                      </div>
                    )}

                    <div className="ff-exercise-detail-history-sets">
                      {session.sets.map((set, index) => (
                        <span key={set.id || index}>
                          {set.weight}kg × {set.reps}
                          {getPrLabels(set).length > 0 && <strong> PR</strong>}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <EmptyPanel
                icon={BarChart3}
                title="Histórico ainda vazio"
                description="Finalize um treino contendo este exercício para ver séries, cargas, PRs e evolução por data."
              />
            )
          )}

          {activeTab === 'instructions' && (
            <section className="ff-exercise-detail-info-flow space-y-4">
              <InfoList icon={CheckCircle2} title="Execução correta" description="Passo a passo para executar melhor." items={instructionsList} variant="success" />
              <InfoList icon={Lightbulb} title="Dicas" description="Pontos úteis para melhorar a técnica." items={tipsList} />
              <InfoList icon={AlertTriangle} title="Erros comuns" description="Coisas para evitar durante o movimento." items={mistakesList} variant="danger" />
            </section>
          )}

          {activeTab === 'ranking' && (
            <section className="ff-exercise-detail-action-grid grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ExerciseStatTile label="Recordes totais" value={exerciseHistory?.prCount || 0} icon={Trophy} accent />
              <ExerciseStatTile label="Peso" value={exerciseHistory?.prWeight || 0} hint="PRs de carga" icon={Dumbbell} />
              <ExerciseStatTile label="Volume" value={exerciseHistory?.prVolume || 0} hint="PRs de kg × reps" icon={Flame} />
            </section>
          )}
        </div>
      </Card>

      <section className="ff-page-mobile-main-grid grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <h2 className="text-lg font-black">Músculos secundários</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {secondaryMuscles.length > 0 ? (
              secondaryMuscles.map((muscle) => <Badge key={muscle} variant="purple">{muscle}</Badge>)
            ) : (
              <p className="text-sm text-[var(--ff-muted)]">Nenhum músculo secundário cadastrado.</p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-[var(--ff-accent-text)]" />
            <h2 className="text-lg font-black">Ações rápidas</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link to="/workouts" className="ff-exercise-quick-action">
              <Plus size={17} />
              Adicionar em treino
            </Link>
            <Link to="/history" className="ff-exercise-quick-action">
              <Clock3 size={17} />
              Ver histórico geral
            </Link>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default ExerciseDetails
