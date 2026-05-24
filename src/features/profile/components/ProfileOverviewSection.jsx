import { Dumbbell, Medal, Ruler, Scale, Target, Trophy, UserRound } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { formatShortDate } from '../profileUtils'

function ProfileStat({ label, value, helper }) {
  return (
    <div className="min-w-0 text-center sm:text-left">
      <p className="text-2xl font-black leading-none text-[var(--ff-text)]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[var(--ff-muted)]">{label}</p>
      {helper && <p className="mt-1 text-[11px] text-[var(--ff-muted-2)]">{helper}</p>}
    </div>
  )
}

function ProfileMetricCard({ label, value, helper, icon }) {
  return (
    <Card className="ff-hevy-metric-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ff-muted)]">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          {icon}
        </span>
      </div>

      <h3 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{value}</h3>

      {helper && (
        <p className="mt-2 text-xs font-bold text-[var(--ff-muted)]">{helper}</p>
      )}
    </Card>
  )
}

export default function ProfileOverviewSection({
  profile,
  currentWeight,
  lastWeightRecord,
  totalWorkouts,
  totalSets,
  weightDifference,
  prsCount,
}) {
  const displayName = profile.name || 'Atleta ForgeFlow'

  return (
    <>
      <section className="ff-profile-hero-card overflow-hidden rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 shadow-2xl shadow-black/25 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-4 sm:items-center sm:gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] shadow-[0_16px_40px_rgba(0,0,0,.28)] sm:h-24 sm:w-24">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <UserRound size={44} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
                    {displayName}
                  </h1>
                  <Badge variant="purple">ForgeFlow</Badge>
                </div>

                <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-[var(--ff-text-soft)]">
                  {profile.goal || 'Defina seu objetivo para deixar o painel mais personalizado.'}
                  {profile.experience ? ` • ${profile.experience}` : ''}
                </p>

                {profile.preferredSplit && (
                  <p className="mt-2 text-sm font-bold text-[var(--ff-accent-text)]">
                    Split preferido: {profile.preferredSplit}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 rounded-[1.5rem] border border-[var(--ff-border)] bg-black/25 p-4 sm:max-w-2xl">
              <ProfileStat label="Treinos" value={totalWorkouts} />
              <ProfileStat label="Séries" value={totalSets} />
              <ProfileStat label="Recordes" value={prsCount} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <div className="rounded-[1.35rem] border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-bold text-[var(--ff-muted)]">Peso atual</p>
              <p className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
                {currentWeight ? `${currentWeight} kg` : '--'}
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-bold text-[var(--ff-muted)]">Altura</p>
              <p className="mt-2 text-2xl font-black">
                {profile.height ? `${profile.height} cm` : '--'}
              </p>
            </div>

            <div className="col-span-2 rounded-[1.35rem] border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-bold text-[var(--ff-muted)]">Último registro corporal</p>
              <p className="mt-2 text-sm font-bold text-[var(--ff-text-soft)]">
                {lastWeightRecord
                  ? `${lastWeightRecord.weight} kg em ${formatShortDate(lastWeightRecord.date)}`
                  : 'Nenhum registro no gráfico'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <ProfileMetricCard
          label="Peso"
          value={currentWeight ? `${currentWeight} kg` : '--'}
          helper={
            weightDifference
              ? `Variação: ${weightDifference > 0 ? '+' : ''}${weightDifference} kg`
              : 'Sem variação'
          }
          icon={<Scale size={18} />}
        />

        <ProfileMetricCard
          label="Altura"
          value={profile.height ? `${profile.height} cm` : '--'}
          helper="Dados do perfil"
          icon={<Ruler size={18} />}
        />

        <ProfileMetricCard
          label="Treinos"
          value={totalWorkouts}
          helper={profile.weeklyTarget || 'Concluídos'}
          icon={<Dumbbell size={18} />}
        />

        <ProfileMetricCard
          label="PRs"
          value={prsCount}
          helper="Registrados"
          icon={<Trophy size={18} className="text-yellow-400" />}
        />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
              <Target size={22} />
            </span>
            <div>
              <h2 className="text-lg font-black">Objetivo e rotina</h2>
              <p className="text-sm text-[var(--ff-muted)]">Dados rápidos para orientar sua evolução.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs text-[var(--ff-muted)]">Objetivo atual</p>
              <p className="mt-1 font-black">{profile.goal || 'Não definido'}</p>
            </div>
            <div className="rounded-2xl bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs text-[var(--ff-muted)]">Divisão</p>
              <p className="mt-1 font-black text-[var(--ff-accent-text)]">{profile.preferredSplit || 'Não definida'}</p>
            </div>
            <div className="rounded-2xl bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs text-[var(--ff-muted)]">Meta semanal</p>
              <p className="mt-1 font-black">{profile.weeklyTarget || 'Não definida'}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300">
              <Medal size={22} />
            </span>
            <div>
              <h2 className="text-lg font-black">Perfil de atleta</h2>
              <p className="text-sm text-[var(--ff-muted)]">Seu histórico resumido.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="purple">{totalWorkouts} treinos</Badge>
            <Badge>{totalSets} séries</Badge>
            <Badge variant="purple">{prsCount} PRs</Badge>
          </div>
        </Card>
      </section>
    </>
  )
}
