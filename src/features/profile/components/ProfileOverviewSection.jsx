import { Dumbbell, Medal, Ruler, Scale, Target, Trophy, UserRound } from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { formatShortDate } from '../profileUtils'

function ProfileMetricCard({ label, value, helper, icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{label}</p>
        {icon}
      </div>

      <h3 className="mt-2 text-3xl font-black">{value}</h3>

      {helper && (
        <p className="mt-2 text-xs text-[var(--ff-accent-text)]">{helper}</p>
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
  return (
    <>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
        <Card className="overflow-hidden border-[var(--ff-accent-border)]/20 bg-gradient-to-br from-[var(--ff-accent-soft)]/20 via-[#18181b] to-[#121212] xl:col-span-2">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] shadow-[0_0_20px_var(--ff-accent-shadow)]">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'Usuário'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <UserRound size={44} />
                )}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 px-3 py-1 text-xs font-bold text-[var(--ff-accent-text)]">
                  <Medal size={14} />
                  ForgeFlow Athlete
                </div>

                <h1 className="mt-3 text-2xl font-black tracking-tight lg:text-3xl">
                  {profile.name || 'Atleta ForgeFlow'}
                </h1>

                <p className="mt-2 text-sm text-zinc-400">
                  {profile.goal || 'Objetivo não definido'} •{' '}
                  {profile.experience || 'Nível não definido'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="purple">{totalWorkouts} treinos</Badge>
                  <Badge>{totalSets} séries</Badge>

                  {profile.weeklyTarget && (
                    <Badge variant="purple">{profile.weeklyTarget}/semana</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-[280px]">
              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Peso atual</p>
                <p className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight} kg` : '--'}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Altura</p>
                <p className="mt-2 text-2xl font-black">
                  {profile.height ? `${profile.height} cm` : '--'}
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">Último peso registrado</p>
                <p className="mt-2 text-sm font-bold">
                  {lastWeightRecord
                    ? `${lastWeightRecord.weight} kg em ${formatShortDate(lastWeightRecord.date)}`
                    : 'Nenhum registro no gráfico'}
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
              <h2 className="text-xl font-bold">Objetivo</h2>
              <p className="text-sm text-zinc-500">Meta pessoal</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Objetivo atual</p>
              <p className="mt-1 font-bold">{profile.goal || 'Não definido'}</p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Divisão preferida</p>
              <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
                {profile.preferredSplit || 'Não definida'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Meta semanal</p>
              <p className="mt-1 font-bold">{profile.weeklyTarget || 'Não definida'}</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProfileMetricCard
          label="Peso atual"
          value={currentWeight ? `${currentWeight} kg` : '--'}
          helper={
            weightDifference
              ? `Variação: ${weightDifference > 0 ? '+' : ''}${weightDifference} kg`
              : null
          }
          icon={<Scale size={20} className="text-[var(--ff-accent-text)]" />}
        />

        <ProfileMetricCard
          label="Altura"
          value={profile.height ? `${profile.height} cm` : '--'}
          helper="Dados do perfil"
          icon={<Ruler size={20} className="text-[var(--ff-accent-text)]" />}
        />

        <ProfileMetricCard
          label="Treinos"
          value={totalWorkouts}
          helper="Concluídos"
          icon={<Dumbbell size={20} className="text-[var(--ff-accent-text)]" />}
        />

        <ProfileMetricCard
          label="PRs"
          value={prsCount}
          helper="Registrados"
          icon={<Trophy size={20} className="text-yellow-400" />}
        />
      </section>
    </>
  )
}
