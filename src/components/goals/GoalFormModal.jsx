import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Dumbbell,
  Flag,
  Info,
  Target,
  Trophy,
  X,
} from 'lucide-react'

import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'

const GOAL_TYPES = [
  {
    value: 'weekly_workouts',
    label: 'Treinar X vezes na semana',
    short: 'Treinos semanais',
    unit: 'treinos',
    period: 'weekly',
    direction: 'increase',
    placeholder: 'Ex: 4',
    helper: 'Exemplo: treinar 4 vezes nesta semana. O app conta os treinos finalizados na semana atual.',
    titleExample: 'Treinar 4x por semana',
  },
  {
    value: 'monthly_workouts',
    label: 'Finalizar X treinos no mês',
    short: 'Treinos mensais',
    unit: 'treinos',
    period: 'monthly',
    direction: 'increase',
    placeholder: 'Ex: 20',
    helper: 'Exemplo: finalizar 20 treinos neste mês. O app conta os treinos finalizados no mês atual.',
    titleExample: 'Fazer 20 treinos no mês',
  },
  {
    value: 'body_weight',
    label: 'Chegar em um peso corporal',
    short: 'Peso corporal',
    unit: 'kg',
    period: 'none',
    direction: 'reach',
    placeholder: 'Ex: 75',
    helper: 'Exemplo: chegar em 75kg. O app usa seu último peso registrado no perfil/peso corporal.',
    titleExample: 'Chegar em 75kg',
  },
  {
    value: 'exercise_pr_weight',
    label: 'Bater carga em um exercício',
    short: 'PR de carga',
    unit: 'kg',
    period: 'none',
    direction: 'increase',
    placeholder: 'Ex: 100',
    helper: 'Exemplo: bater 100kg no supino. O app procura sua maior carga registrada nesse exercício.',
    titleExample: 'Bater 100kg no supino',
  },
  {
    value: 'monthly_volume',
    label: 'Atingir volume mensal',
    short: 'Volume mensal',
    unit: 'kg',
    period: 'monthly',
    direction: 'increase',
    placeholder: 'Ex: 100000',
    helper: 'Exemplo: atingir 100.000kg de volume no mês. O app soma peso × reps dos treinos do mês.',
    titleExample: 'Atingir 100.000kg de volume mensal',
  },
  {
    value: 'progress_photos',
    label: 'Registrar fotos de evolução no mês',
    short: 'Fotos mensais',
    unit: 'fotos',
    period: 'monthly',
    direction: 'increase',
    placeholder: 'Ex: 1',
    helper: 'Exemplo: registrar 1 foto por mês. Para metas criadas no meio do mês, o app conta apenas as novas fotos feitas depois da criação da meta.',
    titleExample: 'Registrar 1 foto de evolução por mês',
  },
  {
    value: 'custom',
    label: 'Meta manual/personalizada',
    short: 'Manual',
    unit: '',
    period: 'none',
    direction: 'increase',
    placeholder: 'Ex: 10',
    helper: 'Use quando a meta não vem automaticamente do app. Você informa o valor atual manualmente ao editar.',
    titleExample: 'Minha meta personalizada',
  },
]

function getGoalTypeConfig(type) {
  return GOAL_TYPES.find((item) => item.value === type) || GOAL_TYPES[0]
}

function formatGoalValue(value, unit) {
  const number = Number(value || 0)

  if (!unit) return number.toLocaleString('pt-BR')

  return `${number.toLocaleString('pt-BR')} ${unit}`
}

function GoalTypeCard({ item, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? 'rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4 text-left shadow-[0_0_24px_var(--ff-accent-shadow)]'
          : 'rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-left transition hover:border-[var(--ff-accent-border)] hover:bg-[var(--ff-card-hover)]'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--ff-text)]">
            {item.short}
          </p>

          <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
            {item.label}
          </p>
        </div>

        {selected && (
          <span className="rounded-full bg-[var(--ff-accent)] px-2 py-1 text-[10px] font-black text-white">
            Atual
          </span>
        )}
      </div>
    </button>
  )
}

function GoalFormModal({
  open,
  goal,
  exerciseOptions = [],
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('weekly_workouts')
  const [targetValue, setTargetValue] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [unit, setUnit] = useState('treinos')
  const [exerciseName, setExerciseName] = useState('')
  const [deadline, setDeadline] = useState('')

  const selectedConfig = useMemo(() => {
    return getGoalTypeConfig(type)
  }, [type])

  useEffect(() => {
    if (!open) return

    if (goal) {
      setTitle(goal.title || '')
      setDescription(goal.description || '')
      setType(goal.type || 'custom')
      setTargetValue(goal.targetValue ? String(goal.targetValue) : '')
      setCurrentValue(goal.currentValue ? String(goal.currentValue) : '')
      setUnit(goal.unit || getGoalTypeConfig(goal.type).unit || '')
      setExerciseName(goal.exerciseName || '')
      setDeadline(goal.deadline ? String(goal.deadline).slice(0, 10) : '')
      return
    }

    const defaultType = 'weekly_workouts'
    const config = getGoalTypeConfig(defaultType)

    setTitle(config.titleExample)
    setDescription('')
    setType(defaultType)
    setTargetValue('')
    setCurrentValue('')
    setUnit(config.unit)
    setExerciseName('')
    setDeadline('')
  }, [open, goal])

  if (!open) return null

  function handleTypeChange(nextType) {
    const config = getGoalTypeConfig(nextType)

    setType(nextType)
    setUnit(config.unit)
    setCurrentValue('')
    setExerciseName('')

    if (!goal) {
      setTitle(config.titleExample)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const parsedTarget = Number(targetValue)

    if (!title.trim()) {
      alert('Informe um nome para a meta.')
      return
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      alert('Informe um número válido no campo "Quero alcançar".')
      return
    }

    if (type === 'exercise_pr_weight' && !exerciseName.trim()) {
      alert('Informe o exercício da meta.')
      return
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      targetValue: parsedTarget,
      currentValue: type === 'custom' ? Number(currentValue || 0) : 0,
      unit,
      exerciseName: type === 'exercise_pr_weight' ? exerciseName.trim() : '',
      direction: selectedConfig.direction,
      period: selectedConfig.period,
      deadline: deadline || null,
      status: goal?.status || 'active',
      resetProgressBaseline: !goal,
    })
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--ff-border)] bg-[var(--ff-card)] p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[var(--ff-accent-text)]">
              {goal ? 'Editar meta' : 'Nova meta'}
            </p>

            <h2 className="mt-1 text-2xl font-black text-[var(--ff-text)]">
              Monte sua meta
            </h2>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Escolha o tipo e diga o número que você quer alcançar. O resto o ForgeFlow calcula.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Flag size={18} className="text-[var(--ff-accent-text)]" />
                  <h3 className="font-black text-[var(--ff-text)]">
                    1. Escolha o tipo de meta
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {GOAL_TYPES.map((item) => (
                    <GoalTypeCard
                      key={item.value}
                      item={item}
                      selected={type === item.value}
                      onClick={() => handleTypeChange(item.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Target size={18} className="text-[var(--ff-accent-text)]" />
                  <h3 className="font-black text-[var(--ff-text)]">
                    2. Preencha sua meta
                  </h3>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Nome da meta"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={selectedConfig.titleExample}
                  />

                  <Textarea
                    label="Descrição opcional"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    placeholder="Ex: foco do mês, observação pessoal, contexto da meta..."
                  />

                  {type === 'exercise_pr_weight' && (
                    <div>
                      <label className="text-sm font-bold text-[var(--ff-text)]">
                        Exercício
                      </label>

                      <input
                        list="goal-exercises"
                        value={exerciseName}
                        onChange={(event) => setExerciseName(event.target.value)}
                        placeholder="Ex: Supino reto com barra"
                        className="mt-2 h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted)] focus:border-[var(--ff-accent-border)]"
                      />

                      <datalist id="goal-exercises">
                        {exerciseOptions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>

                      <p className="mt-2 text-xs text-[var(--ff-muted)]">
                        Dica: escreva igual ao nome do exercício salvo na biblioteca para o cálculo ficar certinho.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Quero alcançar"
                      type="number"
                      min="0"
                      step="0.1"
                      value={targetValue}
                      onChange={(event) => setTargetValue(event.target.value)}
                      placeholder={selectedConfig.placeholder}
                    />

                    <Input
                      label="Unidade"
                      value={unit}
                      onChange={(event) => setUnit(event.target.value)}
                      placeholder="Ex: kg, treinos, fotos"
                    />
                  </div>

                  {type === 'custom' && (
                    <Input
                      label="Onde estou agora"
                      type="number"
                      step="0.1"
                      value={currentValue}
                      onChange={(event) => setCurrentValue(event.target.value)}
                      placeholder="Ex: 0"
                    />
                  )}

                  <Input
                    label="Prazo opcional"
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-card)] text-[var(--ff-accent-text)]">
                    <Info size={18} />
                  </div>

                  <div>
                    <p className="font-black text-[var(--ff-text)]">
                      Como funciona
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                      {selectedConfig.helper}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-[var(--ff-accent-text)]" />
                  <p className="font-black text-[var(--ff-text)]">
                    Prévia
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                      Meta
                    </p>
                    <p className="mt-1 font-black text-[var(--ff-text)]">
                      {title || selectedConfig.titleExample}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                      Objetivo
                    </p>
                    <p className="mt-1 font-black text-[var(--ff-accent-text)]">
                      {targetValue
                        ? formatGoalValue(targetValue, unit)
                        : `Informe o número alvo`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                      Cálculo
                    </p>
                    <p className="mt-1 leading-relaxed text-[var(--ff-muted)]">
                      {type === 'custom'
                        ? 'Manual. Você atualiza o progresso editando a meta.'
                        : 'Automático, usando os dados salvos no app.'}
                    </p>
                  </div>

                  {deadline && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                        Prazo
                      </p>
                      <p className="mt-1 flex items-center gap-2 font-bold text-[var(--ff-text)]">
                        <CalendarDays size={15} />
                        {new Date(`${deadline}T12:00:00`).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
                <div className="flex items-start gap-3">
                  <Dumbbell size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />

                  <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                    Os campos antigos <strong className="text-[var(--ff-text)]">Valor alvo</strong> e <strong className="text-[var(--ff-text)]">Direção</strong> foram simplificados. Agora você só escolhe o tipo e preenche <strong className="text-[var(--ff-text)]">Quero alcançar</strong>.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:flex sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancelar
            </Button>

            <Button type="submit">
              <Target size={18} />
              {goal ? 'Salvar alterações' : 'Criar meta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GoalFormModal
