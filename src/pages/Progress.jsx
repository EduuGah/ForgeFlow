import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, RefreshCcw } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

import ProgressSummaryCards from '../components/progress/ProgressSummaryCards'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'
import {
  getAllRecentSetRows,
  runWhenBrowserIsIdle,
} from '../features/progress/progressUtils'
import { formatLocationLabel, getMapsUrl } from '../services/geolocationService'

import {
  BodyWeightLog,
  ChartLoadingCard,
  MonthlyProgressChart,
  ProgressPhotosAndReadingSection,
  ProgressQuickLinksSection,
  ProgressRecentHighlights,
  RecentWorkoutDetails,
  SetVolumeDetails,
} from '../features/progress/components/ProgressSections'

const BodyWeightChart = lazy(() => import('../components/progress/BodyWeightChart'))
const TrainingVolumeChart = lazy(() => import('../components/progress/TrainingVolumeChart'))
const MuscleGroupChart = lazy(() => import('../components/progress/MuscleGroupChart'))


import AppPageIntro from '../components/app/AppPageIntro'

function WorkoutLocationReport({ workouts = [] }) {
  const workoutsWithLocation = workouts.filter((workout) => getMapsUrl(workout.location))
  const latest = workoutsWithLocation.slice(0, 4)

  return (
    <Card className="ff-location-report-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Localização</p>
          <h2 className="mt-1 text-xl font-black">Treinos com local salvo</h2>
          <p className="mt-1 text-sm text-[var(--ff-muted)]">Registro opcional usado só quando você escolhe salvar ao finalizar.</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]"><MapPin size={20} /></span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs text-[var(--ff-muted)]">Com localização</p>
          <p className="mt-1 text-2xl font-black text-[var(--ff-accent-text)]">{workoutsWithLocation.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs text-[var(--ff-muted)]">Sem localização</p>
          <p className="mt-1 text-2xl font-black">{Math.max(0, workouts.length - workoutsWithLocation.length)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {latest.length === 0 ? (
          <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">Nenhum treino recente possui localização salva.</p>
        ) : latest.map((workout) => (
          <a key={workout.id || workout._id || workout.finishedAt} href={getMapsUrl(workout.location)} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 transition hover:border-[var(--ff-accent-border)]">
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">{workout.workoutName}</span>
              <span className="block truncate text-xs text-[var(--ff-muted)]">{formatLocationLabel(workout.location)}</span>
            </span>
            <span className="shrink-0 text-xs font-black text-[var(--ff-accent-text)]">Mapa</span>
          </a>
        ))}
      </div>
    </Card>
  )
}

function Progress() {
  const { user } = useAuth()

  const [progressData, setProgressData] = useState(null)
  const progressDataRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [source, setSource] = useState('local')
  const deferredSelectedExercise = ''
  const [chartAccentColor, setChartAccentColor] = useState('#8b5cf6')
  const [refreshKey, setRefreshKey] = useState(0)
  const [chartsReady, setChartsReady] = useState(false)

  useEffect(() => {
    function updateChartColor() {
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue('--ff-accent')
        .trim()

      setChartAccentColor(color || '#8b5cf6')
    }

    updateChartColor()

    window.addEventListener('forgeflow:settings-changed', updateChartColor)

    return () => {
      window.removeEventListener('forgeflow:settings-changed', updateChartColor)
    }
  }, [])

  useEffect(() => {
    return runWhenBrowserIsIdle(() => {
      setChartsReady(true)
    })
  }, [])

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadProgress() {
      setLoading((current) => current && !progressDataRef.current)
      setSyncing(true)

      const cachedProgress = getUserStorageData(user, 'progress-stats', null)

      if (cachedProgress && !deferredSelectedExercise) {
        progressDataRef.current = cachedProgress
        setProgressData(cachedProgress)
        setSource('local')
        setLoading(false)
      }

      try {
        const query = deferredSelectedExercise
          ? `?exerciseName=${encodeURIComponent(deferredSelectedExercise)}`
          : ''

        const data = await apiFetch(`/stats/progress${query}`)

        if (!isMounted) return

        progressDataRef.current = data
        setProgressData(data)

        if (!deferredSelectedExercise) {
          saveUserStorageData(user, 'progress-stats', data)
        }

        setSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setProgressData((current) => {
          const fallbackProgress = current || cachedProgress || null
          progressDataRef.current = fallbackProgress
          return fallbackProgress
        })
        setSource('local')
      } finally {
        if (isMounted) {
          setLoading(false)
          setSyncing(false)
        }
      }
    }

    loadProgress()

    return () => {
      isMounted = false
    }
  }, [user, deferredSelectedExercise, refreshKey])

  const normalizedProgress = useMemo(() => {
    const summary = progressData?.summary || {}
    const insights = progressData?.insights || {}
    const charts = progressData?.charts || {}
    const recent = progressData?.recent || {}

    return {
      summary,
      insights,
      charts,
      recent,
      exerciseOptions: Array.isArray(charts.exercisePrs) ? charts.exercisePrs : [],
      weeklyProgress: Array.isArray(charts.weeklyProgress) ? charts.weeklyProgress : [],
      monthlyProgress: Array.isArray(charts.monthlyProgress) ? charts.monthlyProgress : [],
      bodyWeight: Array.isArray(charts.bodyWeight) ? charts.bodyWeight : [],
      muscleGroups: Array.isArray(charts.muscleGroups) ? charts.muscleGroups : [],
      selectedExerciseTimeline: Array.isArray(charts.selectedExerciseTimeline) ? charts.selectedExerciseTimeline : [],
      recentWorkouts: Array.isArray(recent.workouts) ? recent.workouts : [],
      progressPhotos: Array.isArray(recent.progressPhotos) ? recent.progressPhotos : [],
    }
  }, [progressData])

  const recentSetRows = useMemo(() => {
    return getAllRecentSetRows(normalizedProgress.recentWorkouts)
  }, [normalizedProgress.recentWorkouts])

  const recentSetSummary = useMemo(() => {
    const validRecentSetRows = recentSetRows.filter((row) => row.isValid)

    const strongestRecentSet =
      validRecentSetRows
        .slice()
        .sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0] || null

    const biggestVolumeRecentSet =
      validRecentSetRows
        .slice()
        .sort((a, b) => b.volume - a.volume)[0] || null

    return {
      validRecentSetRows,
      strongestRecentSet,
      biggestVolumeRecentSet,
      latestWorkout: normalizedProgress.recentWorkouts[0] || null,
    }
  }, [recentSetRows, normalizedProgress.recentWorkouts])

  return (
    <div className="ff-hevy-page ff-hevy-page-progress">

      <AppPageIntro
        eyebrow="Evolução"
        title="Progresso"
        description="Cards, gráficos e detalhes organizados para consultar rápido no celular."
        metrics={[
          { label: 'Status', value: loading || syncing ? 'Sync' : 'OK' },
          { label: 'Fonte', value: source === 'database' ? 'API' : 'Local' },
          { label: 'Séries', value: recentSetRows.length },
        ]}
      />

    <>
      <PageHeader
        title="Evolução"
        description="Acompanhe peso, volume, frequência, PRs, fotos, séries e histórico detalhado."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {loading || syncing
                ? 'Sincronizando...'
                : source === 'database'
                  ? 'Sincronizado'
                  : 'Local'}
            </Badge>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading || syncing}
            >
              <RefreshCcw size={16} />
              Atualizar
            </Button>
          </div>
        }
      />

      <ProgressQuickLinksSection />

      {!progressData ? (
        <Card>
          <EmptyState
            title="Sem dados de evolução"
            description="Finalize treinos, registre seu peso ou envie fotos para começar a acompanhar sua evolução."
            action={
              <Link to="/workouts">
                <Button>Ir para treinos</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="ff-hevy-progress space-y-5 sm:space-y-6">
          <ProgressSummaryCards
            summary={normalizedProgress.summary}
            insights={normalizedProgress.insights}
          />

          <ProgressRecentHighlights recentSetSummary={recentSetSummary} />

          <Suspense fallback={<ChartLoadingCard title="Preparando gráficos principais" />}>
            {chartsReady ? (
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
                <BodyWeightChart
                  data={normalizedProgress.bodyWeight}
                  accentColor={chartAccentColor}
                />

                <MuscleGroupChart
                  data={normalizedProgress.muscleGroups}
                  accentColor={chartAccentColor}
                />
              </section>
            ) : (
              <ChartLoadingCard title="Preparando gráficos principais" />
            )}
          </Suspense>

          <Suspense fallback={<ChartLoadingCard title="Preparando volume semanal" />}>
            {chartsReady ? (
              <TrainingVolumeChart
                data={normalizedProgress.weeklyProgress}
                accentColor={chartAccentColor}
              />
            ) : (
              <ChartLoadingCard title="Preparando volume semanal" />
            )}
          </Suspense>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            {chartsReady ? (
              <MonthlyProgressChart
                data={normalizedProgress.monthlyProgress}
                accentColor={chartAccentColor}
              />
            ) : (
              <ChartLoadingCard title="Preparando resumo mensal" />
            )}

            <SetVolumeDetails data={recentSetRows} />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <RecentWorkoutDetails workouts={normalizedProgress.recentWorkouts} />

            <BodyWeightLog data={normalizedProgress.bodyWeight} />
          </section>

          <WorkoutLocationReport workouts={normalizedProgress.recentWorkouts} />

          <ProgressPhotosAndReadingSection normalizedProgress={normalizedProgress} />
        </div>
      )}
    </>
  
    </div>
  )
}

export default Progress
