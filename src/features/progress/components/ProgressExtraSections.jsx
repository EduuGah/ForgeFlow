import { Link } from 'react-router-dom'
import {
  Camera,
  Clock3,
  Flame,
  Info,
  Medal,
  Target,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import EmptyState from '../../../components/ui/EmptyState'
import { formatDuration, formatVolume } from '../../../components/progress/ProgressSummaryCards'
import { formatDate, formatLongDate, formatWeight, getSessionDate } from '../progressUtils'
import { DetailStat } from './ProgressChartSections'

export function ProgressQuickLinksSection() {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Link
        to="/exercise-progress"
        className="rounded-3xl border border-yellow-400/25 bg-yellow-500/10 p-4 text-yellow-100 transition hover:border-yellow-400/45"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200/80">
          Ranking de PRs
        </p>
        <h2 className="mt-2 text-xl font-black">Ver evolução por exercício</h2>
        <p className="mt-2 text-sm text-yellow-100/70">
          Carga, volume e histórico de séries em uma tela dedicada.
        </p>
      </Link>

      <Link
        to="/history"
        className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:border-[var(--ff-accent-border)]"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
          Histórico
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--ff-text)]">Revisar treinos</h2>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">
          Veja sessões antigas e detalhes por data.
        </p>
      </Link>

      <Link
        to="/progress-photos"
        className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 transition hover:border-[var(--ff-accent-border)]"
      >
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
          Fotos
        </p>
        <h2 className="mt-2 text-xl font-black text-[var(--ff-text)]">Comparar evolução</h2>
        <p className="mt-2 text-sm text-[var(--ff-muted)]">
          Acompanhe mudanças visuais ao longo do tempo.
        </p>
      </Link>
    </section>
  )
}


export function ProgressRecentHighlights({ recentSetSummary }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DetailStat
        icon={Medal}
        label="Melhor série recente"
        value={recentSetSummary.strongestRecentSet ? formatWeight(recentSetSummary.strongestRecentSet.weight) : '—'}
        description={
          recentSetSummary.strongestRecentSet
            ? `${recentSetSummary.strongestRecentSet.exerciseName} • Série ${recentSetSummary.strongestRecentSet.setNumber} • ${recentSetSummary.strongestRecentSet.reps} reps • ${formatDate(recentSetSummary.strongestRecentSet.date)}`
            : 'Sem séries recentes válidas.'
        }
      />

      <DetailStat
        icon={Flame}
        label="Maior volume recente"
        value={recentSetSummary.biggestVolumeRecentSet ? formatVolume(recentSetSummary.biggestVolumeRecentSet.volume) : '—'}
        description={
          recentSetSummary.biggestVolumeRecentSet
            ? `${recentSetSummary.biggestVolumeRecentSet.exerciseName} • ${formatWeight(recentSetSummary.biggestVolumeRecentSet.weight)} × ${recentSetSummary.biggestVolumeRecentSet.reps}`
            : 'Sem volume recente.'
        }
      />

      <DetailStat
        icon={Clock3}
        label="Último treino"
        value={recentSetSummary.latestWorkout?.workoutName || '—'}
        description={
          recentSetSummary.latestWorkout
            ? `${formatLongDate(getSessionDate(recentSetSummary.latestWorkout))} • ${formatDuration(recentSetSummary.latestWorkout.durationSeconds || recentSetSummary.latestWorkout.duration)}`
            : 'Nenhum treino recente encontrado.'
        }
      />

      <DetailStat
        icon={Target}
        label="Séries recentes"
        value={recentSetSummary.validRecentSetRows.length}
        description="Quantidade de séries válidas nos últimos treinos retornados pela rota de evolução."
      />
    </section>
  )
}


export function ProgressPhotosAndReadingSection({ normalizedProgress }) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
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
          {normalizedProgress.progressPhotos.length === 0 ? (
            <EmptyState
              title="Sem fotos"
              description="Envie fotos de evolução para complementar seus gráficos."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {normalizedProgress.progressPhotos.slice(0, 8).map((photo) => (
                <Link
                  key={photo._id || photo.id}
                  to="/progress-photos"
                  className="group overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] transition hover:scale-[1.02] hover:border-[var(--ff-accent-border)]"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt="Foto de evolução"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="p-2">
                    <p className="truncate text-xs font-bold text-[var(--ff-text)]">
                      {formatDate(photo.date)}
                    </p>

                    {photo.weight !== null && photo.weight !== undefined && (
                      <p className="text-[11px] text-[var(--ff-muted)]">
                        {formatWeight(photo.weight)}
                      </p>
                    )}
                  </div>
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
              Leitura rápida
            </h2>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Um resumo textual para entender os números sem depender só dos gráficos.
            </p>
          </div>

          <Info size={24} className="text-[var(--ff-accent-text)]" />
        </div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--ff-muted)]">
          <p>
            Você tem <strong className="text-[var(--ff-text)]">{normalizedProgress.summary.totalFinishedWorkouts || 0}</strong> treino(s)
            finalizado(s), com volume total de{' '}
            <strong className="text-[var(--ff-accent-text)]">{formatVolume(normalizedProgress.summary.totalVolume || 0)}</strong>.
          </p>

          <p>
            Seu volume médio por treino está em{' '}
            <strong className="text-[var(--ff-text)]">{formatVolume(normalizedProgress.summary.averageVolumePerWorkout || 0)}</strong>,
            e sua duração média é de{' '}
            <strong className="text-[var(--ff-text)]">{formatDuration(normalizedProgress.summary.averageDurationSeconds || 0)}</strong>.
          </p>

          {normalizedProgress.insights.mostTrainedMuscle && (
            <p>
              O grupo com maior volume/séries no período é{' '}
              <strong className="text-[var(--ff-accent-text)]">{normalizedProgress.insights.mostTrainedMuscle.muscleGroup}</strong>,
              com {normalizedProgress.insights.mostTrainedMuscle.sets || 0} série(s).
            </p>
          )}

          {normalizedProgress.insights.bestWeightPr && (
            <p>
              Sua maior carga registrada foi em{' '}
              <strong className="text-[var(--ff-text)]">{normalizedProgress.insights.bestWeightPr.exerciseName}</strong>:
              {' '}
              <strong className="text-[var(--ff-accent-text)]">{formatWeight(normalizedProgress.insights.bestWeightPr.bestWeight)}</strong>
              {' '}por {normalizedProgress.insights.bestWeightPr.bestWeightReps || 0} rep(s), no treino{' '}
              <strong className="text-[var(--ff-text)]">{normalizedProgress.insights.bestWeightPr.bestWeightWorkoutName || 'Treino'}</strong>.
            </p>
          )}

          {normalizedProgress.insights.bestVolumePr && (
            <p>
              A melhor série em volume foi em{' '}
              <strong className="text-[var(--ff-text)]">{normalizedProgress.insights.bestVolumePr.exerciseName}</strong>,
              somando <strong className="text-[var(--ff-warning-text)]">{formatVolume(normalizedProgress.insights.bestVolumePr.bestVolume)}</strong>.
            </p>
          )}
        </div>
      </Card>
    </section>
  )
}
