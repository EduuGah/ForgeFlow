import { Activity, BarChart3, CalendarDays, Dumbbell, Flame, Trophy, Weight } from 'lucide-react'

import Card from '../../../components/ui/Card'

function DashboardMetricsSection({
  history,
  totalVolume,
  totalTrainingSeconds,
  prCount,
  consistencyStats,
  averageDuration,
  favoriteWorkouts,
  favoriteExercises,
  weightPRCount,
  volumePRCount,
  bestVolumeSet,
  lastSession,
  lastWorkoutVolume,
  averageVolume,
  profile,
  formatVolume,
  formatDuration,
  formatShortDate,
}) {
  return (
    <>
      <section className="ff-dashboard-metrics-primary mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Treinos</p>
            <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">{history.length}</h2>

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
            finalizados
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Volume total</p>
            <Weight size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
            {formatVolume(totalVolume)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            peso × reps
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Tempo total</p>
            <Activity size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {formatDuration(totalTrainingSeconds)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            treinando
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">PRs</p>
            <Trophy size={20} className="text-yellow-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black">{prCount}</h2>

          <p className="mt-2 text-xs text-zinc-500">
            recordes
          </p>
        </Card>
      </section>

      <section className="ff-dashboard-metrics-secondary mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Streak atual</p>
            <Flame size={20} className="text-orange-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-orange-300">
            {consistencyStats.currentStreak}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            {consistencyStats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Últimos 7 dias</p>
            <CalendarDays size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {consistencyStats.workoutsLast7Days}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            treinos feitos
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Média por treino</p>
            <BarChart3 size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black">
            {formatDuration(averageDuration)}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            duração média
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Favoritos</p>
            <Trophy size={20} className="text-yellow-400" />
          </div>

          <h2 className="mt-2 text-3xl font-black text-[var(--ff-warning-text)]">
            {favoriteWorkouts.length + favoriteExercises.length}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            {favoriteWorkouts.length} treinos • {favoriteExercises.length} exercícios
          </p>
        </Card>
      </section>

      <section className="ff-dashboard-metrics-secondary mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">PRs de peso</p>
            <Trophy size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
            {weightPRCount}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Recordes por maior carga
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">PRs de volume</p>
            <Flame size={20} className="text-orange-400" />
          </div>

          <h2 className="mt-2 text-2xl font-black text-orange-300">
            {volumePRCount}
          </h2>

          <p className="mt-2 text-xs text-zinc-500">
            Recordes por peso × reps
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">Melhor volume em série</p>
            <Weight size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          {bestVolumeSet ? (
            <>
              <h2 className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
                {bestVolumeSet.volume}kg
              </h2>

              <p className="mt-2 text-xs text-zinc-500">
                {bestVolumeSet.exerciseName} • {bestVolumeSet.weight}kg × {bestVolumeSet.reps}
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-black">--</h2>
              <p className="mt-2 text-xs text-zinc-500">Sem dados ainda</p>
            </>
          )}
        </Card>
      </section>

      <section className="ff-dashboard-metrics-detail mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)]">
                <Dumbbell size={14} />
                Último treino
              </div>

              <h2 className="mt-4 text-2xl font-black">
                {lastSession
                  ? lastSession.workoutName
                  : 'Nenhum treino finalizado'}
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                {lastSession
                  ? `${formatShortDate(lastSession.finishedAt)} • ${formatDuration(lastSession.duration || lastSession.durationSeconds)} • ${formatVolume(lastWorkoutVolume)}`
                  : 'Finalize um treino para ver o resumo aqui.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Exercícios</p>
                <p className="mt-1 text-xl font-black">
                  {lastSession?.exercises?.length || 0}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Volume</p>
                <p className="mt-1 text-xl font-black text-[var(--ff-accent-text)]">
                  {formatVolume(lastWorkoutVolume)}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Duração</p>
                <p className="mt-1 text-xl font-black">
                  {lastSession
                    ? formatDuration(lastSession.duration || lastSession.durationSeconds)
                    : '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Consistência</h2>

          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Nos últimos 30 dias você finalizou:
          </p>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-5xl font-black text-[var(--ff-accent-text)]">
              {consistencyStats.workoutsLast30Days}
            </span>

            <span className="pb-2 text-sm font-bold text-zinc-400">
              treino(s)
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs text-zinc-500">Volume médio por treino</p>

            <p className="mt-1 text-lg font-black text-[var(--ff-accent-text)]">
              {formatVolume(averageVolume)}
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
            <p className="text-xs font-bold text-[var(--ff-warning-text)]">
              Melhor sequência
            </p>

            <p className="mt-1 text-lg font-black text-[var(--ff-warning-text)]">
              {consistencyStats.bestStreak} dia(s)
            </p>
          </div>

          {consistencyStats.lastWorkoutDate && (
            <p className="mt-3 text-xs text-zinc-500">
              Último treino em {formatShortDate(consistencyStats.lastWorkoutDate)}
            </p>
          )}

          <p className="mt-4 text-sm text-zinc-500">
            {profile?.weeklyTarget
              ? `Sua meta atual é ${profile.weeklyTarget.toLowerCase()} por semana.`
              : consistencyStats.workoutsLast30Days > 0
                ? 'Continue registrando seus treinos para acompanhar sua consistência.'
                : 'Finalize seus primeiros treinos para começar a medir consistência.'}
          </p>
        </Card>
      </section>
    </>
  )
}

export default DashboardMetricsSection
