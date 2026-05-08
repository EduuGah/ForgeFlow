import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

const GOAL_TYPES = [
  {
    value: 'weekly_workouts',
    label: 'Treinar X vezes na semana',
    unit: ' treinos',
    period: 'weekly',
    direction: 'increase',
  },
  {
    value: 'monthly_workouts',
    label: 'Fazer X treinos no mês',
    unit: ' treinos',
    period: 'monthly',
    direction: 'increase',
  },
  {
    value: 'body_weight',
    label: 'Chegar em um peso corporal',
    unit: 'kg',
    period: 'none',
    direction: 'reach',
  },
  {
    value: 'exercise_pr_weight',
    label: 'Bater PR de carga em exercício',
    unit: 'kg',
    period: 'none',
    direction: 'increase',
  },
  {
    value: 'monthly_volume',
    label: 'Atingir volume mensal',
    unit: 'kg',
    period: 'monthly',
    direction: 'increase',
  },
  {
    value: 'progress_photos',
    label: 'Registrar fotos no mês',
    unit: ' fotos',
    period: 'monthly',
    direction: 'increase',
  },
  {
    value: 'custom',
    label: 'Meta personalizada',
    unit: '',
    period: 'none',
    direction: 'increase',
  },
]

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function GoalFormModal({ open, goal, exerciseOptions = [], onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'weekly_workouts',
    targetValue: '',
    currentValue: '',
    unit: ' treinos',
    exerciseName: '',
    direction: 'increase',
    period: 'weekly',
    deadline: '',
    color: '',
  })

  useEffect(() => {
    if (!open) return

    if (goal) {
      setForm({
        title: goal.title || '',
        description: goal.description || '',
        type: goal.type || 'custom',
        targetValue: goal.targetValue ?? '',
        currentValue: goal.currentValue ?? '',
        unit: goal.unit || '',
        exerciseName: goal.exerciseName || '',
        direction: goal.direction || 'increase',
        period: goal.period || 'none',
        deadline: goal.deadline ? String(goal.deadline).slice(0, 10) : '',
        color: goal.color || '',
      })
    } else {
      setForm({
        title: 'Treinar 4x na semana',
        description: 'Meta automática baseada nos treinos finalizados nesta semana.',
        type: 'weekly_workouts',
        targetValue: 4,
        currentValue: '',
        unit: ' treinos',
        exerciseName: '',
        direction: 'increase',
        period: 'weekly',
        deadline: '',
        color: '',
      })
    }
  }, [goal, open])

  const selectedType = useMemo(() => {
    return GOAL_TYPES.find((item) => item.value === form.type) || GOAL_TYPES.at(-1)
  }, [form.type])

  if (!open) return null

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleTypeChange(type) {
    const config = GOAL_TYPES.find((item) => item.value === type) || GOAL_TYPES.at(-1)

    setForm((current) => ({
      ...current,
      type,
      unit: config.unit,
      period: config.period,
      direction: config.direction,
      exerciseName: type === 'exercise_pr_weight' ? current.exerciseName : '',
      currentValue: type === 'custom' ? current.currentValue : '',
      title:
        type === 'weekly_workouts'
          ? 'Treinar 4x na semana'
          : type === 'monthly_workouts'
            ? 'Fazer 20 treinos no mês'
            : type === 'body_weight'
              ? 'Chegar no peso alvo'
              : type === 'exercise_pr_weight'
                ? 'Bater PR em exercício'
                : type === 'monthly_volume'
                  ? 'Atingir volume mensal'
                  : type === 'progress_photos'
                    ? 'Registrar fotos no mês'
                    : current.title,
      description:
        type === 'custom'
          ? current.description
          : 'Meta calculada automaticamente com os dados reais do ForgeFlow.',
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      ...form,
      targetValue: Number(form.targetValue),
      currentValue: form.currentValue === '' ? 0 : Number(form.currentValue),
      deadline: form.deadline || null,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[var(--ff-text)]">
              {goal ? 'Editar meta' : 'Nova meta'}
            </h2>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Crie metas manuais ou metas automáticas baseadas nos dados reais do app.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] transition hover:text-[var(--ff-text)]"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Select
            label="Tipo de meta"
            value={form.type}
            onChange={(event) => handleTypeChange(event.target.value)}
          >
            {GOAL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Título"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Ex: Treinar 4x na semana"
              required
            />

            <Input
              label="Valor alvo"
              type="number"
              min="0"
              step="0.1"
              value={form.targetValue}
              onChange={(event) => updateField('targetValue', event.target.value)}
              placeholder="Ex: 4"
              required
            />
          </div>

          {form.type === 'custom' && (
            <Input
              label="Valor atual manual"
              type="number"
              min="0"
              step="0.1"
              value={form.currentValue}
              onChange={(event) => updateField('currentValue', event.target.value)}
              placeholder="Ex: 2"
            />
          )}

          {form.type === 'exercise_pr_weight' && (
            <Select
              label="Exercício"
              value={form.exerciseName}
              onChange={(event) => updateField('exerciseName', event.target.value)}
              required
            >
              <option value="">Selecione um exercício</option>
              {exerciseOptions.map((exercise) => (
                <option key={exercise} value={exercise}>
                  {exercise}
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              label="Unidade"
              value={form.unit}
              onChange={(event) => updateField('unit', event.target.value)}
              placeholder="kg, treinos, fotos..."
            />

            <Select
              label="Direção"
              value={form.direction}
              onChange={(event) => updateField('direction', event.target.value)}
            >
              <option value="increase">Aumentar</option>
              <option value="decrease">Diminuir</option>
              <option value="reach">Alcançar</option>
            </Select>

            <Select
              label="Período"
              value={form.period}
              onChange={(event) => updateField('period', event.target.value)}
            >
              <option value="none">Sem período</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </Select>
          </div>

          <Input
            label="Prazo opcional"
            type="date"
            min={getTodayDate()}
            value={form.deadline}
            onChange={(event) => updateField('deadline', event.target.value)}
          />

          <Textarea
            label="Descrição"
            rows={4}
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Explique o motivo ou contexto da meta..."
          />

          <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
            <strong className="text-[var(--ff-text)]">Como essa meta será calculada:</strong>{' '}
            {selectedType.value === 'custom'
              ? 'você atualiza o valor atual manualmente.'
              : 'o ForgeFlow busca os dados reais no histórico, peso, fotos ou PRs e calcula o progresso automaticamente.'}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit">
              {goal ? 'Salvar alterações' : 'Criar meta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GoalFormModal
