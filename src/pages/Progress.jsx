import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCcw } from 'lucide-react'

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

function Progress() {
  const { user } = useAuth()

  const [progressData, setProgressData] = useState(null)
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
      setLoading((current) => current && !progressData)
      setSyncing(true)

      const cachedProgress = getUserStorageData(user, 'progress-stats', null)

      if (cachedProgress && !deferredSelectedExercise) {
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

        setProgressData(data)

        if (!deferredSelectedExercise) {
          saveUserStorageData(user, 'progress-stats', data)
        }

        setSource('database')
      } catch (error) {
        console.error(error)

        if (!isMounted) return

        setProgressData((current) => current || cachedProgress)
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
  }, [user, deferredSelectedExercise, refreshKey, progressData])

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

          <ProgressPhotosAndReadingSection normalizedProgress={normalizedProgress} />
        </div>
      )}
    </>
  )
}

export default Progress
