import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, History, RefreshCcw } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

import ProgressSummaryCards, {
  formatDuration,
  formatVolume,
} from '../components/progress/ProgressSummaryCards'
import BodyWeightChart from '../components/progress/BodyWeightChart'
import TrainingVolumeChart from '../components/progress/TrainingVolumeChart'
import MuscleGroupChart from '../components/progress/MuscleGroupChart'
import ExercisePrChart from '../components/progress/ExercisePrChart'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

function formatDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function Progress() {
  const { user } = useAuth()

  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState('local')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [chartAccentColor, setChartAccentColor] = useState('#8b5cf6')
  const [refreshKey, setRefreshKey] = useState(0)

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
    if (!user) return

    async function loadProgress() {
      setLoading(true)

      const cachedProgress = getUserStorageData(user, 'progress-stats', null)

      try {
        const query = selectedExercise
          ? `?exerciseName=${encodeURIComponent(selectedExercise)}`
          : ''

        const data = await apiFetch(`/stats/progress${query}`)

        setProgressData(data)
        saveUserStorageData(user, 'progress-stats', data)
        setSource('database')
      } catch (error) {
        console.error(error)

        setProgressData(cachedProgress)
        setSource('local')
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [user, selectedExercise, refreshKey])

  const summary = progressData?.summary || {}
  const insights = progressData?.insights || {}
  const charts = progressData?.charts || {}
  const recent = progressData?.recent || {}

  const exerciseOptions = useMemo(() => {
    return Array.isArray(charts.exercisePrs) ? charts.exercisePrs : []
  }, [charts.exercisePrs])

  const weeklyProgress = Array.isArray(charts.weeklyProgress)
    ? charts.weeklyProgress
    : []

  const bodyWeight = Array.isArray(charts.bodyWeight)
    ? charts.bodyWeight
    : []

  const muscleGroups = Array.isArray(charts.muscleGroups)
    ? charts.muscleGroups
    : []

  const selectedExerciseTimeline = Array.isArray(charts.selectedExerciseTimeline)
    ? charts.selectedExerciseTimeline
    : []

  return (
    <>
      <PageHeader
        title="Evolução"
        description="Acompanhe peso, volume, frequência, PRs, fotos e progresso geral."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source === 'database' ? 'purple' : 'default'}>
              {loading
                ? 'Carregando...'
                : source === 'database'
                  ? 'Sincronizado'
                  : 'Local'}
            </Badge>

            <Button
              type="button"
              variant="secondary"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={loading}
            >
              <RefreshCcw size={16} />
              Atualizar
            </Button>
          </div>
        }
      />

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
        <div className="space-y-6">
          <ProgressSummaryCards summary={summary} insights={insights} />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <BodyWeightChart data={bodyWeight} accentColor={chartAccentColor} />

            <MuscleGroupChart data={muscleGroups} accentColor={chartAccentColor} />
          </section>

          <TrainingVolumeChart data={weeklyProgress} accentColor={chartAccentColor} />

          <ExercisePrChart
            exerciseOptions={exerciseOptions}
            selectedExercise={selectedExercise}
            onSelectExercise={setSelectedExercise}
            timeline={selectedExerciseTimeline}
            accentColor={chartAccentColor}
          />

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">
                    Fotos recentes
                  </h2>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    Últimos registros visuais da sua evolução.
                  </p>
                </div>

                <Link to="/progress-photos">
                  <Button variant="secondary">
                    <Camera size={16} />
                    Ver fotos
                  </Button>
                </Link>
              </div>

              <div className="mt-5">
                {!recent.progressPhotos || recent.progressPhotos.length === 0 ? (
                  <EmptyState
                    title="Sem fotos"
                    description="Envie fotos de evolução para complementar seus gráficos."
                  />
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {recent.progressPhotos.slice(0, 8).map((photo) => (
                      <Link
                        key={photo._id || photo.id}
                        to="/progress-photos"
                        className="aspect-square overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] transition hover:scale-[1.02] hover:border-[var(--ff-accent-border)]"
                      >
                        <img
                          src={photo.imageUrl}
                          alt="Foto de evolução"
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">
                    Últimos treinos
                  </h2>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    Registros mais recentes do histórico.
                  </p>
                </div>

                <Link to="/history">
                  <Button variant="secondary">
                    <History size={16} />
                    Ver histórico
                  </Button>
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {!recent.workouts || recent.workouts.length === 0 ? (
                  <EmptyState
                    title="Sem treinos"
                    description="Finalize treinos para ver registros recentes."
                  />
                ) : (
                  recent.workouts.slice(0, 6).map((session) => (
                    <div
                      key={session._id || session.id}
                      className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-[var(--ff-text)]">
                            {session.workoutName}
                          </p>

                          <p className="mt-1 text-sm text-[var(--ff-muted)]">
                            {session.exercises?.length || 0} exercício(s) • {formatDuration(session.durationSeconds || session.duration)}
                          </p>
                        </div>

                        <Badge>
                          {formatDate(session.finishedAt || session.createdAt)}
                        </Badge>
                      </div>

                      <p className="mt-3 text-xs font-semibold text-[var(--ff-muted)]">
                        Volume: {formatVolume(session.totalVolume || 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        </div>
      )}
    </>
  )
}

export default Progress
