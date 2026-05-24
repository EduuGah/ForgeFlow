import { CalendarDays, Medal, Trash2, Weight } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import AccountSecurityCard from '../../../components/profile/AccountSecurityCard'
import ResponsiveContainer from '../../../components/ui/SafeResponsiveContainer'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import EmptyState from '../../../components/ui/EmptyState'
import Input from '../../../components/ui/Input'
import ExerciseRecordCard from '../../../components/fitness/ExerciseRecordCard'
import { formatShortDate, getTodayDateInputValue, isFutureDate } from '../profileUtils'

export default function ProfileWeightSection({
  profile,
  bodyWeightChartData,
  weightInput,
  dateInput,
  dateInputRef,
  settings,
  heaviestExercise,
  mostTrainedExercise,
  totalWorkouts,
  totalSets,
  prs,
  onAddWeight,
  onWeightInputChange,
  onDateChange,
  onDeleteWeight,
  onShowToast,
}) {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.95fr)]">
      <div className="space-y-5">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Evolução do peso corporal</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Gráfico baseado nos registros adicionados.
              </p>
            </div>

            <Weight size={24} className="text-[var(--ff-accent-text)]" />
          </div>

          <div className="mt-5 h-72">
            {bodyWeightChartData.length === 0 ? (
              <EmptyState
                title="Nenhum peso registrado"
                description="Adicione seu primeiro peso corporal para gerar o gráfico."
              />
            ) : (
              <ResponsiveContainer height={320}>
                <LineChart data={bodyWeightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tickFormatter={formatShortDate}
                  />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    labelFormatter={(value) => `Data: ${formatShortDate(value)}`}
                    formatter={(value) => [`${value} kg`, 'Peso']}
                    contentStyle={{
                      background: '#09090b',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{
                      color: 'var(--ff-accent-text)',
                      fontWeight: '700',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Peso"
                    stroke="var(--ff-accent)"
                    strokeWidth={3}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
                <Medal size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">Destaques pessoais</h2>
                <p className="text-sm text-zinc-500">Melhores marcas</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {heaviestExercise ? (
                <ExerciseRecordCard
                  compact
                  badge="Maior carga"
                  exerciseName={heaviestExercise.exerciseName}
                  muscleGroup={heaviestExercise.muscleGroup}
                  date={heaviestExercise.date}
                  workoutName={heaviestExercise.workoutName}
                  setNumber={heaviestExercise.setNumber}
                  weight={heaviestExercise.weight}
                  reps={heaviestExercise.reps}
                  volume={heaviestExercise.volume}
                  emphasis="blue"
                />
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">Maior carga registrada</p>
                  <p className="mt-2 text-sm text-zinc-500">Sem dados ainda.</p>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Exercício mais feito</p>

                {mostTrainedExercise ? (
                  <>
                    <h3 className="mt-1 text-lg font-bold">
                      {mostTrainedExercise.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {mostTrainedExercise.total} séries feitas
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">Sem dados ainda.</p>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">Total pessoal</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {totalWorkouts} treinos concluídos • {totalSets} séries concluídas
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">PRs por exercício</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Melhores marcas salvas no histórico.
            </p>

            <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-2">
              {prs.length === 0 && (
                <EmptyState
                  title="Nenhum PR encontrado"
                  description="Finalize treinos com peso e reps para gerar PRs."
                />
              )}

              {prs.map((pr, index) => (
                <ExerciseRecordCard
                  key={pr.exerciseName}
                  rank={index + 1}
                  badge="PR"
                  exerciseName={pr.exerciseName}
                  muscleGroup={pr.muscleGroup}
                  date={pr.date}
                  workoutName={pr.workoutName}
                  setNumber={pr.setNumber}
                  weight={pr.weight}
                  reps={pr.reps}
                  volume={pr.volume}
                  emphasis="blue"
                />
              ))}
            </div>
          </Card>
        </section>
      </div>

      <div className="ff-hevy-profile space-y-5 sm:space-y-6">
        <Card>
          <h2 className="text-xl font-bold">Registrar peso</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Adicione registros para acompanhar sua evolução corporal no gráfico.
          </p>

          <form onSubmit={onAddWeight} className="mt-5 space-y-4">
            <div>
              <Input
                label="Peso em kg"
                placeholder="Ex: 72,5"
                value={weightInput}
                onChange={(event) => {
                  const value = event.target.value.replace(/[^\d,.]/g, '')
                  onWeightInputChange(value)
                }}
              />

              <p className="mt-2 text-xs text-zinc-500">
                Pode usar vírgula ou ponto. Exemplo: 72,5 ou 72.5.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <CalendarDays size={16} />
                Data do registro
              </label>

              <input
                ref={dateInputRef}
                type="date"
                max={getTodayDateInputValue()}
                value={dateInput}
                onClick={() => {
                  if (settings.autoOpenCalendar) {
                    dateInputRef.current?.showPicker?.()
                  }
                }}
                onFocus={() => {
                  if (settings.autoOpenCalendar) {
                    dateInputRef.current?.showPicker?.()
                  }
                }}
                onInput={(event) => {
                  const selectedDate = event.currentTarget.value

                  if (isFutureDate(selectedDate)) {
                    event.currentTarget.value = ''
                    onDateChange('')
                    onShowToast(
                      'error',
                      'Data inválida',
                      'Não é possível registrar peso em uma data futura.'
                    )
                  }
                }}
                onChange={(event) => onDateChange(event.target.value)}
                onBlur={(event) => {
                  const selectedDate = event.target.value

                  if (isFutureDate(selectedDate)) {
                    event.target.value = ''
                    onDateChange('')
                  }
                }}
                className="mt-2 w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[var(--ff-accent-border)] focus:ring-2 focus:ring-[var(--ff-accent)]/10"
              />
            </div>

            <Button type="submit" className="w-full">
              Confirmar peso
            </Button>
          </form>

          <div className="mt-4 rounded-2xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 p-3">
            <p className="text-xs leading-relaxed text-zinc-400">
              Esse registro atualiza o gráfico e também usa o último peso como peso atual do perfil.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Registros de peso</h2>

          <div className="mt-5 max-h-[400px] space-y-2 overflow-y-auto pr-2">
            {bodyWeightChartData.length === 0 && (
              <p className="text-sm text-zinc-500">Nenhum registro ainda.</p>
            )}

            {bodyWeightChartData
              .slice()
              .reverse()
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div>
                    <p className="font-bold">{item.weight} kg</p>
                    <p className="text-xs text-zinc-500">{formatShortDate(item.date)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteWeight(item.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        </Card>

        {profile.notes && (
          <Card>
            <h2 className="text-xl font-bold">Notas pessoais</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300">{profile.notes}</p>
          </Card>
        )}

        <AccountSecurityCard />
      </div>
    </section>
  )
}
