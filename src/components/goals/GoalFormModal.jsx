import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  Dumbbell,
  Flag,
  Info,
  Repeat2,
  Search,
  Target,
  Trophy,
  X,
} from 'lucide-react'

import Button from '../ui/Button'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import { getExerciseMedia } from '../../utils/exerciseMediaUtils'

const GOAL_TYPES = [
  {
    value: 'daily_workouts',
    label: 'Treinar X vezes no dia',
    short: 'Treinos diários',
    unit: 'treinos',
    period: 'daily',
    direction: 'increase',
    placeholder: 'Ex: 1',
    helper: 'Exemplo: treinar 1 vez hoje. O app conta apenas os treinos finalizados no dia atual e zera automaticamente amanhã.',
    titleExample: 'Treinar hoje',
  },
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
    value: 'streak_days',
    label: 'Manter uma sequência de dias treinando',
    short: 'Sequência de dias',
    unit: 'dias',
    period: 'none',
    direction: 'increase',
    placeholder: 'Ex: 7',
    helper: 'Exemplo: manter 7 dias de sequência. O app conta automaticamente os dias seguidos com treino registrado até hoje.',
    titleExample: 'Manter 7 dias de sequência',
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
    value: 'nutrition',
    label: 'Água ou nutrição futura',
    short: 'Nutrição futura',
    unit: 'dias',
    period: 'none',
    direction: 'increase',
    placeholder: 'Ex: 5',
    helper: 'Preparada para a área de nutrição. Por enquanto funciona como meta manual, sem quebrar quando a nutrição real for conectada.',
    titleExample: 'Bater meta de água 5 dias',
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

const PERIOD_OPTIONS = [
  {
    value: 'daily',
    label: 'Diária',
    helper: 'Zera todos os dias.',
  },
  {
    value: 'weekly',
    label: 'Semanal',
    helper: 'Zera toda semana.',
  },
  {
    value: 'monthly',
    label: 'Mensal',
    helper: 'Zera todo mês.',
  },
  {
    value: 'none',
    label: 'Não repete',
    helper: 'Meta única, sem reset automático.',
  },
]

const REMINDER_DAY_OPTIONS = [
  { key: 'monday', label: 'Seg' },
  { key: 'tuesday', label: 'Ter' },
  { key: 'wednesday', label: 'Qua' },
  { key: 'thursday', label: 'Qui' },
  { key: 'friday', label: 'Sex' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
]

function getPeriodLabel(period) {
  return PERIOD_OPTIONS.find((item) => item.value === period)?.label || 'Não repete'
}

function getGoalTypeConfig(type) {
  return GOAL_TYPES.find((item) => item.value === type) || GOAL_TYPES[0]
}

function isManualGoalType(type) {
  return ['custom', 'nutrition'].includes(type)
}

function formatGoalValue(value, unit) {
  const number = Number(value || 0)

  if (!unit) return number.toLocaleString('pt-BR')

  return `${number.toLocaleString('pt-BR')} ${unit}`
}


function GoalTypeSelector({ selectedConfig, type, open, onToggle, onSelect }) {
  return (
    <div className="ff-goal-type-picker">
      <button
        type="button"
        className="ff-goal-type-picker__current"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="ff-goal-type-picker__icon">
          <Flag size={18} />
        </span>

        <span className="ff-goal-type-picker__copy">
          <strong>{selectedConfig.short}</strong>
          <small>{selectedConfig.label}</small>
        </span>

        <span className="ff-goal-type-picker__meta">
          Atual
          <ChevronDown size={16} className={open ? 'rotate-180' : ''} />
        </span>
      </button>

      {open && (
        <div className="ff-goal-type-picker__menu" role="listbox" aria-label="Tipos de meta">
          {GOAL_TYPES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={type === item.value ? 'is-selected' : ''}
              onClick={() => onSelect(item.value)}
              role="option"
              aria-selected={type === item.value}
            >
              <span>
                <strong>{item.short}</strong>
                <small>{item.label}</small>
              </span>
              {type === item.value && <em>Selecionada</em>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GoalPeriodPicker({ period, onChange }) {
  return (
    <div className="ff-goal-period-picker">
      <div className="ff-goal-period-picker__head">
        <Repeat2 size={18} />
        <div>
          <p>Reset da meta</p>
          <span>Escolha quando o progresso deve começar de novo.</span>
        </div>
      </div>

      <div className="ff-goal-period-picker__options" role="radiogroup" aria-label="Reset da meta">
        {PERIOD_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={period === item.value ? 'is-active' : ''}
            onClick={() => onChange(item.value)}
            aria-pressed={period === item.value}
          >
            <strong>{item.label}</strong>
            <small>{item.helper}</small>
          </button>
        ))}
      </div>
    </div>
  )
}


function getExerciseId(exercise = {}) {
  return String(exercise.id || exercise._id || '')
}

function getExerciseGroup(exercise = {}) {
  return exercise.muscleGroup || exercise.targetMuscle || exercise.normalizedGroup || 'Grupo não informado'
}

function getExerciseEquipment(exercise = {}) {
  return exercise.equipment || exercise.normalizedEquipment || 'Equipamento livre'
}

function ExercisePickerModal({ open, exercises = [], selectedExerciseId, search, onSearchChange, onSelect, onClose }) {
  const filteredExercises = useMemo(() => {
    const term = search.trim().toLowerCase()

    return exercises
      .filter((exercise) => {
        if (!term) return true

        return `${exercise.name || ''} ${getExerciseGroup(exercise)} ${getExerciseEquipment(exercise)}`
          .toLowerCase()
          .includes(term)
      })
      .sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return String(a.name || '').localeCompare(String(b.name || ''))
      })
      .slice(0, 80)
  }, [exercises, search])

  if (!open) return null

  return (
    <div className="ff-goal-exercise-library fixed inset-0 z-[95] flex items-end justify-center bg-[var(--ff-overlay)] p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="ff-goal-exercise-library__panel flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl sm:rounded-[2rem]">
        <div className="border-b border-[var(--ff-border)] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Biblioteca</p>
              <h3 className="mt-1 text-xl font-black text-[var(--ff-text)]">Escolha o exercício da meta</h3>
              <p className="mt-1 text-sm text-[var(--ff-muted)]">A meta salva o ID do exercício e mantém o nome apenas para exibição.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)]"
              aria-label="Fechar biblioteca"
            >
              <X size={18} />
            </button>
          </div>

          <label className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-[var(--ff-muted)]">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome, músculo ou equipamento..."
              className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
            />
          </label>
        </div>

        <div className="ff-goal-exercise-library__list min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredExercises.length ? filteredExercises.map((exercise) => {
            const id = getExerciseId(exercise)
            const selected = id && id === selectedExerciseId
            const media = getExerciseMedia(exercise)

            return (
              <button
                key={id || exercise.name}
                type="button"
                onClick={() => onSelect(exercise)}
                className={selected ? 'ff-goal-exercise-option is-selected' : 'ff-goal-exercise-option'}
              >
                <span className="ff-goal-exercise-option__media">
                  {media ? <img src={media} alt={exercise.name} loading="lazy" /> : <Dumbbell size={22} />}
                </span>
                <span className="min-w-0">
                  <strong>{exercise.name || 'Exercício sem nome'}</strong>
                  <small>{getExerciseGroup(exercise)} · {getExerciseEquipment(exercise)}</small>
                </span>
                {selected && <em>Selecionado</em>}
              </button>
            )
          }) : (
            <div className="rounded-3xl border border-dashed border-[var(--ff-border)] p-6 text-center text-sm font-bold text-[var(--ff-muted)]">
              Nenhum exercício encontrado nessa busca.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GoalFormModal({
  open,
  goal,
  exerciseOptions = [],
  exercises = [],
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('weekly_workouts')
  const [period, setPeriod] = useState('weekly')
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [targetValue, setTargetValue] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [unit, setUnit] = useState('treinos')
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('19:00')
  const [reminderDays, setReminderDays] = useState(() => REMINDER_DAY_OPTIONS.map((day) => day.key))
  const [formError, setFormError] = useState('')

  const selectedConfig = useMemo(() => {
    return getGoalTypeConfig(type)
  }, [type])

  const selectedExercise = useMemo(() => {
    return exercises.find((exercise) => {
      const id = getExerciseId(exercise)
      return (exerciseId && id === exerciseId) || (!exerciseId && exerciseName && exercise.name === exerciseName)
    }) || null
  }, [exerciseId, exerciseName, exercises])


  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    document.body.classList.add('ff-modal-open', 'ff-fullscreen-modal-open')
    document.documentElement.classList.add('ff-modal-open', 'ff-fullscreen-modal-open')

    return () => {
      document.body.classList.remove('ff-modal-open', 'ff-fullscreen-modal-open')
      document.documentElement.classList.remove('ff-modal-open', 'ff-fullscreen-modal-open')
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    setFormError('')

    if (goal) {
      setTitle(goal.title || '')
      setDescription(goal.description || '')
      setType(goal.type || 'custom')
      setPeriod(goal.period || getGoalTypeConfig(goal.type || 'custom').period || 'none')
      setIsTypeMenuOpen(false)
      setTargetValue(goal.targetValue ? String(goal.targetValue) : '')
      setCurrentValue(goal.currentValue ? String(goal.currentValue) : '')
      setUnit(goal.unit || getGoalTypeConfig(goal.type).unit || '')
      setExerciseName(goal.exerciseName || '')
      setExerciseId(goal.exerciseId || '')
      setExerciseSearch('')
      setShowExerciseLibrary(false)
      setDeadline(goal.deadline ? String(goal.deadline).slice(0, 10) : '')
      setReminderEnabled(Boolean(goal.reminderEnabled))
      setReminderTime(/^\d{2}:\d{2}$/.test(String(goal.reminderTime || '')) ? goal.reminderTime : '19:00')
      setReminderDays(Array.isArray(goal.reminderDays) && goal.reminderDays.length ? goal.reminderDays : REMINDER_DAY_OPTIONS.map((day) => day.key))
      return
    }

    const defaultType = 'weekly_workouts'
    const config = getGoalTypeConfig(defaultType)

    setTitle(config.titleExample)
    setDescription('')
    setType(defaultType)
    setPeriod(config.period)
    setIsTypeMenuOpen(false)
    setTargetValue('')
    setCurrentValue('')
    setUnit(config.unit)
    setExerciseName('')
    setExerciseId('')
    setExerciseSearch('')
    setShowExerciseLibrary(false)
    setDeadline('')
    setReminderEnabled(false)
    setReminderTime('19:00')
    setReminderDays(REMINDER_DAY_OPTIONS.map((day) => day.key))
  }, [open, goal])

  if (!open) return null

  function handleTypeChange(nextType) {
    const config = getGoalTypeConfig(nextType)

    setType(nextType)
    setPeriod(config.period)
    setIsTypeMenuOpen(false)
    setUnit(config.unit)
    setCurrentValue('')
    setExerciseName('')
    setExerciseId('')
    setFormError('')

    if (!goal) {
      setTitle(config.titleExample)
    }
  }

  function handleSelectExercise(exercise) {
    const id = getExerciseId(exercise)
    const name = exercise.name || ''

    setExerciseId(id)
    setExerciseName(name)
    setFormError('')
    setShowExerciseLibrary(false)

    if (!goal && name && (!title || title === selectedConfig.titleExample)) {
      setTitle(`Bater ${targetValue || selectedConfig.placeholder} ${selectedConfig.unit || ''} em ${name}`.trim())
    }
  }

  function handleReminderDayToggle(dayKey) {
    setReminderDays((current) => {
      const days = Array.isArray(current) ? current : []
      return days.includes(dayKey)
        ? days.filter((day) => day !== dayKey)
        : [...days, dayKey]
    })
  }

  function handleSubmit(event) {
    event.preventDefault()

    const parsedTarget = Number(targetValue)

    if (!title.trim()) {
      setFormError('Informe um nome para a meta.')
      return
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      setFormError('Informe um número válido no campo "Quero alcançar".')
      return
    }

    if (type === 'exercise_pr_weight' && !exerciseName.trim()) {
      setFormError('Escolha um exercício na biblioteca.')
      return
    }

    if (reminderEnabled && reminderDays.length === 0) {
      setFormError('Escolha pelo menos um dia para o lembrete.')
      return
    }

    setFormError('')

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      targetValue: parsedTarget,
      currentValue: isManualGoalType(type) ? Number(currentValue || 0) : 0,
      unit,
      exerciseName: type === 'exercise_pr_weight' ? exerciseName.trim() : '',
      exerciseId: type === 'exercise_pr_weight' ? exerciseId : '',
      direction: selectedConfig.direction,
      period,
      deadline: deadline || null,
      reminderEnabled,
      reminderTime,
      reminderDays,
      status: goal?.status || 'active',
      resetProgressBaseline: !goal,
    })
  }

  const modal = (
    <div className="ff-goal-modal fixed inset-0 z-[2147483600] flex items-end justify-center bg-[var(--ff-overlay)] p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="ff-goal-modal__panel flex max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] shadow-2xl sm:max-h-[92vh] sm:rounded-[2rem]">
        <div className="ff-goal-modal__header sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--ff-border)] bg-[var(--ff-card)] p-5">
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

        <form onSubmit={handleSubmit} className="ff-goal-modal__form min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Flag size={18} className="text-[var(--ff-accent-text)]" />
                  <h3 className="font-black text-[var(--ff-text)]">
                    1. Escolha o tipo de meta
                  </h3>
                </div>

                <GoalTypeSelector
                  selectedConfig={selectedConfig}
                  type={type}
                  open={isTypeMenuOpen}
                  onToggle={() => setIsTypeMenuOpen((current) => !current)}
                  onSelect={handleTypeChange}
                />
              </div>

              <GoalPeriodPicker period={period} onChange={setPeriod} />

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
                    <div className="ff-goal-exercise-picker-field">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-sm font-bold text-[var(--ff-text)]">
                          Exercício
                        </label>
                        <button type="button" onClick={() => setShowExerciseLibrary(true)}>
                          Abrir biblioteca
                        </button>
                      </div>

                      {selectedExercise || exerciseName ? (
                        <div className="ff-goal-selected-exercise-card">
                          <span>
                            {selectedExercise ? <img src={getExerciseMedia(selectedExercise)} alt={selectedExercise.name} loading="lazy" /> : <Dumbbell size={22} />}
                          </span>
                          <div>
                            <strong>{exerciseName}</strong>
                            <small>{selectedExercise ? `${getExerciseGroup(selectedExercise)} · ${getExerciseEquipment(selectedExercise)}` : 'Selecionado pelo nome. Abra a biblioteca para vincular o ID.'}</small>
                          </div>
                        </div>
                      ) : (
                        <button type="button" className="ff-goal-empty-exercise-picker" onClick={() => setShowExerciseLibrary(true)}>
                          <Dumbbell size={20} />
                          Selecionar exercício na biblioteca
                        </button>
                      )}

                      <input
                        list="goal-exercises"
                        value={exerciseName}
                        onChange={(event) => {
                          const nextName = event.target.value
                          const matchedExercise = exercises.find((exercise) => exercise.name === nextName)
                          setExerciseName(nextName)
                          setExerciseId(matchedExercise ? getExerciseId(matchedExercise) : '')
                        }}
                        placeholder="Ou digite para compatibilidade"
                        className="mt-3 h-12 w-full rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm text-[var(--ff-text)] outline-none transition placeholder:text-[var(--ff-muted)] focus:border-[var(--ff-accent-border)]"
                      />

                      <datalist id="goal-exercises">
                        {exerciseOptions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>

                      <p className="mt-2 text-xs text-[var(--ff-muted)]">
                        Melhor opção: escolher pela biblioteca. Assim a meta salva o exerciseId e não depende só do nome.
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

                  {isManualGoalType(type) && (
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

                  <div className="ff-goal-reminder-box">
                    <div className="ff-goal-reminder-box__head">
                      <span>
                        <Bell size={17} />
                      </span>
                      <div>
                        <strong>Lembrete da meta</strong>
                        <small>Receba um aviso no horário escolhido para revisar o progresso.</small>
                      </div>
                      <button
                        type="button"
                        className={reminderEnabled ? 'is-active' : ''}
                        onClick={() => setReminderEnabled((current) => !current)}
                        aria-pressed={reminderEnabled}
                      >
                        {reminderEnabled ? 'Ativo' : 'Desativado'}
                      </button>
                    </div>

                    {reminderEnabled && (
                      <div className="ff-goal-reminder-box__body">
                        <label className="ff-goal-time-field">
                          <Clock3 size={16} />
                          <span>Horário</span>
                          <input
                            type="time"
                            value={reminderTime}
                            onChange={(event) => setReminderTime(event.target.value)}
                          />
                        </label>

                        <div className="ff-goal-day-picker" role="group" aria-label="Dias do lembrete da meta">
                          {REMINDER_DAY_OPTIONS.map((day) => (
                            <button
                              key={day.key}
                              type="button"
                              className={reminderDays.includes(day.key) ? 'is-active' : ''}
                              onClick={() => handleReminderDayToggle(day.key)}
                              aria-pressed={reminderDays.includes(day.key)}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                      {isManualGoalType(type)
                        ? `Manual. A renovação ${getPeriodLabel(period).toLowerCase()} zera o valor quando virar o período.`
                        : `Automático, usando os dados salvos no app. Reset: ${getPeriodLabel(period).toLowerCase()}.`}
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

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                      Lembrete
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-bold text-[var(--ff-text)]">
                      <Bell size={15} />
                      {reminderEnabled ? `${reminderTime} · ${reminderDays.length} dia(s)` : 'Desativado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
                <div className="flex items-start gap-3">
                  <Dumbbell size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />

                  <p className="text-sm leading-relaxed text-[var(--ff-muted)]">
                    Dica: comece com metas simples e fáceis de entender. Depois que criar, o card mostra automaticamente quanto falta e se o prazo está perto.
                  </p>
                </div>
              </div>
            </aside>
          </div>

          {formError && (
            <div role="alert" className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-bold text-[var(--ff-danger-text)]">
              {formError}
            </div>
          )}

          <div className="ff-goal-modal__footer mt-6 grid grid-cols-1 gap-3 sm:flex sm:justify-end">
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

      <ExercisePickerModal
        open={showExerciseLibrary}
        exercises={exercises}
        selectedExerciseId={exerciseId}
        search={exerciseSearch}
        onSearchChange={setExerciseSearch}
        onSelect={handleSelectExercise}
        onClose={() => setShowExerciseLibrary(false)}
      />
    </div>
  )

  if (typeof document === 'undefined') return modal

  return createPortal(modal, document.body)
}

export default GoalFormModal
