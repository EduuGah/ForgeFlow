import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import DashboardSectionIntro from './DashboardSectionIntro'

function DashboardRecoverySection({
  muscleRecovery,
  mostRecoveredMuscles,
  musclesStillRecovering,
  getRecoveryStyle,
  formatRecoveryDate,
}) {
  return (
    <>
      <DashboardSectionIntro eyebrow="Evolução" title="Como você está treinando" description="Resumo de frequência, consistência, volume e distribuição muscular para entender rapidamente sua fase atual." className="mt-2" />

      <section id="dashboard-performance" className="scroll-mt-24 mt-3 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <Card className="">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Recuperação muscular
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Estimativa baseada nos grupos musculares treinados recentemente.
              </p>
            </div>

            <Badge>
              {muscleRecovery.length} grupos
            </Badge>
          </div>

          <div className="mt-5">
            {muscleRecovery.filter((item) => item.level !== 'unknown').length === 0 ? (
              <EmptyState
                title="Sem dados de recuperação"
                description="Finalize alguns treinos para calcular a recuperação dos grupos musculares."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {muscleRecovery
                  .filter((item) => item.level !== 'unknown')
                  .slice(0, 4)
                  .map((item) => {
                    const style = getRecoveryStyle(item.level)

                    return (
                      <div
                        key={item.muscleGroup}
                        className={`rounded-3xl border ${style.border} ${style.bg} p-4`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-white">
                              {item.muscleGroup}
                            </h3>

                            <p className={`mt-1 text-xs font-bold ${style.text}`}>
                              {item.status}
                            </p>
                          </div>

                          <span className={`text-lg font-black ${style.text}`}>
                            {item.recoveryPercent}%
                          </span>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                          <div
                            className={`h-full rounded-full ${style.bar}`}
                            style={{
                              width: `${item.recoveryPercent}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl border border-black/20 bg-black/20 p-3">
                            <p className="text-xs text-zinc-500">
                              Último treino
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {formatRecoveryDate(item.lastTrainedAt)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-black/20 bg-black/20 p-3">
                            <p className="text-xs text-zinc-500">
                              Séries
                            </p>

                            <p className="mt-1 text-sm font-bold">
                              {item.totalSets}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                          {item.message}
                        </p>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">
            Sugestão rápida
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Use isso para escolher melhor o próximo treino.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-bold text-[var(--ff-success-text)]">
                Mais recuperados
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {mostRecoveredMuscles.length > 0 ? (
                  mostRecoveredMuscles.map((item) => (
                    <Badge key={item.muscleGroup}>
                      {item.muscleGroup}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    Sem dados ainda.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-xs font-bold text-[var(--ff-warning-text)]">
                Ainda recuperando
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {musclesStillRecovering.length > 0 ? (
                  musclesStillRecovering.map((item) => (
                    <Badge key={item.muscleGroup}>
                      {item.muscleGroup}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">
                    Nenhum grupo crítico agora.
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-zinc-500">
              A recuperação é estimada pelo tempo desde o último treino. Depois podemos melhorar usando volume, séries e intensidade.
            </p>
          </div>
        </Card>
      </section>
    </>
  )
}

export default DashboardRecoverySection
