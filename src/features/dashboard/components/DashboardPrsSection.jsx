import { Search, X } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import DashboardSectionIntro from './DashboardSectionIntro'

function DashboardPrsSection({
  exercisePRs,
  recentPRs,
  prSearch,
  setPrSearch,
  formatShortDate,
  formatVolume,
}) {
  return (
    <>
<DashboardSectionIntro eyebrow="Recordes" title="Seus PRs e destaques" description="Veja seus recordes recentes com contexto completo: data, treino, tipo de PR e volume da série." className="mt-2" />

<section id="dashboard-prs" className="scroll-mt-24 mt-3 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
  <Card>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold">Recordes pessoais</h2>

        <p className="mt-1 text-sm text-zinc-500">
          Melhores marcas registradas por exercício, separando carga máxima e volume.
        </p>
      </div>

      <Badge variant="purple">
        {exercisePRs.length} exercícios
      </Badge>
    </div>

    <div className="mt-4 flex h-12 items-center gap-3 rounded-xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
      <Search size={20} />

      <input
        type="text"
        placeholder="Buscar exercício..."
        value={prSearch}
        onChange={(event) => setPrSearch(event.target.value)}
        className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted-2)]"
      />

      {prSearch && (
        <button
          type="button"
          onClick={() => setPrSearch('')}
          className="text-zinc-500 transition hover:text-white"
        >
          <X size={18} />
        </button>
      )}
    </div>

    <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-2">
      {exercisePRs.length === 0 && (
        <EmptyState
          title="Nenhum PR encontrado"
          description="Tente buscar outro exercício ou finalize treinos."
        />
      )}

      {exercisePRs.map((pr, index) => (
        <div
          key={pr.exerciseName}
          className="rounded-3xl border border-zinc-800 bg-[#18181b] p-4 transition hover:-translate-y-0.5 hover:border-[var(--ff-accent-border)]/40 hover:bg-[#1f1f23]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)]">
                  #{index + 1}
                </span>

                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-bold leading-snug text-white">
                    {pr.exerciseName}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    {pr.muscleGroup}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[var(--ff-accent-text)]">
                  Peso PR
                </p>
                <Badge>Peso</Badge>
              </div>

              <p className="mt-1 text-lg font-black">
                {pr.weightPR.weight}kg × {pr.weightPR.reps}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {formatShortDate(pr.weightPR.date)} • {pr.weightPR.workoutName || 'Treino'} • Série {pr.weightPR.setNumber || '-'}
              </p>
            </div>

            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-orange-300">
                  Volume PR
                </p>
                <Badge>Volume</Badge>
              </div>

              <p className="mt-1 text-lg font-black">
                {pr.volumePR.volume}kg
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {pr.volumePR.weight}kg × {pr.volumePR.reps}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {formatShortDate(pr.volumePR.date)} • {pr.volumePR.workoutName || 'Treino'} • Série {pr.volumePR.setNumber || '-'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>

  <Card>
    <h2 className="text-xl font-bold">PRs recentes</h2>

    <p className="mt-1 text-sm text-zinc-500">
      Últimos recordes registrados durante os treinos.
    </p>

    <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-2">
      {recentPRs.length === 0 && (
        <EmptyState
          title="Nenhum PR recente"
          description="Finalize treinos com peso e reps para gerar recordes."
        />
      )}

      {recentPRs.map((pr, index) => (
        <div
          key={`${pr.exerciseName}-${index}`}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="line-clamp-2 font-bold leading-snug text-white">
                {pr.exerciseName}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {pr.muscleGroup || 'Sem grupo'} • {formatShortDate(pr.date)}
              </p>

              <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                {pr.workoutName || 'Treino'} • Série {pr.setNumber || '-'} • Volume {formatVolume(pr.volume)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Badge>
                {pr.isWeightPR && pr.isVolumePR
                  ? 'Peso + Volume'
                  : pr.isWeightPR
                    ? 'Peso PR'
                    : pr.isVolumePR
                      ? 'Volume PR'
                      : 'PR'}
              </Badge>

              <span className="text-xs font-black text-[var(--ff-accent-text)]">
                {pr.weight}kg × {pr.reps}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
</section>
    </>
  )
}

export default DashboardPrsSection
