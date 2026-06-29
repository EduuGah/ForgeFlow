import { Search, X } from 'lucide-react'

import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import ExerciseRecordCard from '../../../components/fitness/ExerciseRecordCard'
import DashboardSectionIntro from './DashboardSectionIntro'

function DashboardPrsSection({
  exercisePRs,
  recentPRs,
  prSearch,
  setPrSearch,
  formatVolume,
}) {
  return (
    <>
      <DashboardSectionIntro
        eyebrow="Recordes"
        title="Seus PRs e destaques"
        description="Recordes agora aparecem como cards rápidos com foto, data, carga, reps, volume e atalho para a página do exercício."
        className="mt-2"
      />

      <section id="dashboard-prs" className="scroll-mt-24 mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <Card className="ff-hevy-section-card">
          <div className="ff-section-head">
            <div>
              <p className="ff-section-eyebrow">Ranking completo</p>
              <h2 className="ff-section-title">Recordes pessoais</h2>
              <p className="ff-section-description">
                Melhores marcas por exercício com contexto visual para identificar rápido.
              </p>
            </div>

            <Badge variant="purple">
              {exercisePRs.length} exercícios
            </Badge>
          </div>

          <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-input)] px-4 text-[var(--ff-muted)]">
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
                className="text-[var(--ff-muted-2)] transition hover:text-[var(--ff-text)]"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="ff-mobile-list mt-5 space-y-3">
            {exercisePRs.length === 0 && (
              <EmptyState
                title="Nenhum PR encontrado"
                description="Tente buscar outro exercício ou finalize treinos."
              />
            )}

            {exercisePRs.map((pr, index) => (
              <div key={pr.exerciseName} className="space-y-2">
                <ExerciseRecordCard
                  rank={index + 1}
                  badge="Peso PR"
                  exerciseName={pr.exerciseName}
                  muscleGroup={pr.muscleGroup}
                  date={pr.weightPR?.date}
                  workoutName={pr.weightPR?.workoutName}
                  setNumber={pr.weightPR?.setNumber}
                  weight={pr.weightPR?.weight}
                  reps={pr.weightPR?.reps}
                  volume={pr.weightPR?.volume}
                  emphasis="blue"
                />

                <ExerciseRecordCard
                  compact
                  badge="Volume PR"
                  exerciseName={pr.exerciseName}
                  muscleGroup={pr.muscleGroup}
                  date={pr.volumePR?.date}
                  workoutName={pr.volumePR?.workoutName}
                  setNumber={pr.volumePR?.setNumber}
                  weight={pr.volumePR?.weight}
                  reps={pr.volumePR?.reps}
                  volume={pr.volumePR?.volume}
                  emphasis="gold"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="ff-hevy-section-card">
          <div className="ff-section-head">
            <div>
              <p className="ff-section-eyebrow">Últimos treinos</p>
              <h2 className="ff-section-title">PRs recentes</h2>
              <p className="ff-section-description">
                Atalhos para revisar rapidamente onde o recorde aconteceu.
              </p>
            </div>
          </div>

          <div className="ff-mobile-list mt-5 space-y-3">
            {recentPRs.length === 0 && (
              <EmptyState
                title="Nenhum PR recente"
                description="Finalize treinos com peso e reps para gerar recordes."
              />
            )}

            {recentPRs.map((pr, index) => (
              <ExerciseRecordCard
                key={`${pr.exerciseName}-${index}`}
                badge={
                  pr.isWeightPR && pr.isVolumePR
                    ? 'Peso + Volume'
                    : pr.isWeightPR
                      ? 'Peso PR'
                      : pr.isVolumePR
                        ? 'Volume PR'
                        : 'PR'
                }
                exerciseName={pr.exerciseName}
                muscleGroup={pr.muscleGroup}
                date={pr.date}
                workoutName={pr.workoutName}
                setNumber={pr.setNumber}
                weight={pr.weight}
                reps={pr.reps}
                volume={pr.volume}
                emphasis={pr.isVolumePR && !pr.isWeightPR ? 'gold' : 'blue'}
              />
            ))}

            {recentPRs.length > 0 && (
              <p className="text-xs leading-relaxed text-[var(--ff-muted)]">
                Volume destacado: {formatVolume(recentPRs[0]?.volume || 0)} na série mais recente da lista.
              </p>
            )}
          </div>
        </Card>
      </section>
    </>
  )
}

export default DashboardPrsSection
