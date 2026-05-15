import { Link } from 'react-router-dom'
import { Activity, CalendarDays, Dumbbell, Target, UserRound } from 'lucide-react'

import Card from '../../../components/ui/Card'
import DashboardSectionIntro from './DashboardSectionIntro'

function DashboardOverviewSection({
  profile,
  lastSession,
  currentWeight,
  heaviestExercise,
  strongestMuscleGroup,
  profileCompletion,
  formatShortDate,
}) {
  return (
    <>
      <DashboardSectionIntro eyebrow="Visão geral" title="Seu painel principal" />

      <section id="dashboard-overview" className="scroll-mt-24 mb-8 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <Card className="overflow-hidden border-[var(--ff-accent-border)]/20 bg-gradient-to-br from-[var(--ff-accent-soft)]/20 via-[var(--ff-card)] to-[var(--ff-surface-2)]">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-[var(--ff-accent-border)]/30 bg-zinc-950 shadow-[0_0_28px_var(--ff-accent-shadow)]/20">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      loading="eager"
                      decoding="async"
                      alt={profile?.name || 'Foto de perfil'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--ff-accent-soft)]/20 text-3xl font-black text-[var(--ff-accent-text)]">
                      {(profile?.name || 'F').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute inset-0 rounded-3xl ring-1 ring-white/10" />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)]">
                    <Activity size={14} />
                    ForgeFlow ativo
                  </div>

                  <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
                    {profile?.name
                      ? `Olá, ${profile.name}`
                      : 'Bem-vindo ao ForgeFlow'}
                  </h1>
                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Veja seu progresso, frequência, volume, recordes e próximos treinos em uma visão geral.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <Link to="/workouts">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] px-5 text-sm font-bold text-[var(--ff-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)] sm:w-auto"
                  >
                    <Dumbbell size={18} />
                    Iniciar treino
                  </button>
                </Link>

                <Link to="/history">
                  <button
                    type="button"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-5 text-sm font-bold text-[var(--ff-text)] transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)]/50 hover:bg-[var(--ff-card-hover)] sm:w-auto"
                  >
                    <CalendarDays size={18} />
                    Ver histórico
                  </button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <p className="text-xs text-zinc-500">Último treino</p>

                <p className="mt-2 text-lg font-bold leading-snug text-white">
                  {lastSession ? lastSession.workoutName : '--'}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {lastSession
                    ? formatShortDate(lastSession.finishedAt)
                    : 'Sem histórico'}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <p className="text-xs text-zinc-500">Peso atual</p>

                <p className="mt-2 text-lg font-bold text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight}kg` : '--'}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {profile?.height ? `${profile.height}cm altura` : 'Perfil incompleto'}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 sm:col-span-2 lg:col-span-1">
                <p className="text-xs text-zinc-500">Melhor destaque</p>

                <p className="mt-2 text-lg font-bold leading-snug text-white">
                  {heaviestExercise
                    ? `${heaviestExercise.exerciseName} • ${heaviestExercise.weight}kg x ${heaviestExercise.reps}`
                    : strongestMuscleGroup
                      ? `${strongestMuscleGroup.group} • ${strongestMuscleGroup.total} séries`
                      : '--'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
              <Target size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">Perfil do atleta</h2>
              <p className="text-sm text-zinc-500">Resumo da sua conta</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-300">
                Perfil preenchido
              </p>

              <p className="text-sm font-black text-[var(--ff-accent-text)]">
                {profileCompletion}%
              </p>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
                style={{
                  width: `${profileCompletion}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Objetivo</p>
              <p className="mt-1 font-bold">{profile?.goal || 'Não definido'}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Nível</p>
                <p className="mt-1 font-bold">
                  {profile?.experience || '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Peso</p>
                <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight}kg` : '—'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Meta semanal</p>
              <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                {profile?.weeklyTarget || 'Não definida'}
              </p>
            </div>

            <Link to="/profile">
              <button
                type="button"
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-[#18181b] text-sm font-bold text-white transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
              >
                <UserRound size={18} />
                Editar perfil
              </button>
            </Link>
          </div>
        </Card>
      </section>
    </>
  )
}

export default DashboardOverviewSection
