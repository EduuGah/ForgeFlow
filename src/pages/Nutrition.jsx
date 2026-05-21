import { useMemo, useState } from 'react'
import { Droplets, Flame, Plus, Scale, Trash2, Utensils } from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  addMeal,
  addWater,
  getTodayNutrition,
  removeMeal,
  updateNutritionGoals,
} from '../services/nutritionService'

function clampPercent(value, goal) {
  const safeGoal = Math.max(1, Number(goal) || 1)
  return Math.max(0, Math.min(100, Math.round((Number(value) || 0) / safeGoal * 100)))
}

function StatCard({ icon: Icon, label, value, goal, suffix }) {
  const percent = clampPercent(value, goal)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={21} />
        </div>
        <Badge>{percent}%</Badge>
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-muted)]">{label}</p>
      <h3 className="mt-1 text-2xl font-black text-[var(--ff-text)]">{value}<span className="text-sm text-[var(--ff-muted)]">/{goal}{suffix}</span></h3>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
        <div className="h-full rounded-full bg-[var(--ff-accent)] transition-all" style={{ width: `${percent}%` }} />
      </div>
    </Card>
  )
}

function Nutrition() {
  const [nutrition, setNutrition] = useState(() => getTodayNutrition())
  const [meal, setMeal] = useState({ name: '', calories: '', proteinG: '', time: new Date().toTimeString().slice(0, 5) })
  const [goals, setGoals] = useState(() => ({
    waterGoalMl: getTodayNutrition().waterGoalMl,
    calorieGoal: getTodayNutrition().calorieGoal,
    proteinGoalG: getTodayNutrition().proteinGoalG,
  }))

  const waterCups = useMemo(() => Math.round((Number(nutrition.waterMl) || 0) / 250), [nutrition.waterMl])

  function handleAddWater(amount) {
    setNutrition(addWater(amount))
  }

  function handleAddMeal(event) {
    event.preventDefault()
    if (!meal.name.trim() && !meal.calories && !meal.proteinG) return
    setNutrition(addMeal(meal))
    setMeal({ name: '', calories: '', proteinG: '', time: new Date().toTimeString().slice(0, 5) })
  }

  function handleSaveGoals(event) {
    event.preventDefault()
    setNutrition(updateNutritionGoals(goals))
  }

  return (
    <>
      <PageHeader
        title="Nutrição"
        description="Controle inicial de água, refeições, calorias e proteína para acompanhar sua rotina junto com os treinos."
        action={<Badge>Beta</Badge>}
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Droplets} label="Água hoje" value={nutrition.waterMl} goal={nutrition.waterGoalMl} suffix="ml" />
        <StatCard icon={Flame} label="Calorias" value={nutrition.calories} goal={nutrition.calorieGoal} suffix="kcal" />
        <StatCard icon={Scale} label="Proteína" value={nutrition.proteinG} goal={nutrition.proteinGoalG} suffix="g" />
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Hidratação</p>
                <h2 className="mt-1 text-xl font-black">{waterCups} copos registrados</h2>
                <p className="mt-1 text-sm text-[var(--ff-muted)]">Adicione água rapidamente ao longo do dia.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button variant="secondary" onClick={() => handleAddWater(250)}>+250ml</Button>
                <Button onClick={() => handleAddWater(500)}>+500ml</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                <Utensils size={21} />
              </div>
              <div>
                <h2 className="text-xl font-black">Refeições de hoje</h2>
                <p className="text-sm text-[var(--ff-muted)]">Registro simples para não perder a noção do dia.</p>
              </div>
            </div>

            <form onSubmit={handleAddMeal} className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_120px_120px_120px_auto]">
              <Input label="Nome" value={meal.name} onChange={(event) => setMeal((current) => ({ ...current, name: event.target.value }))} placeholder="Pré-treino, almoço..." />
              <Input label="Calorias" type="number" min="0" value={meal.calories} onChange={(event) => setMeal((current) => ({ ...current, calories: event.target.value }))} />
              <Input label="Proteína" type="number" min="0" value={meal.proteinG} onChange={(event) => setMeal((current) => ({ ...current, proteinG: event.target.value }))} />
              <Input label="Hora" type="time" value={meal.time} onChange={(event) => setMeal((current) => ({ ...current, time: event.target.value }))} />
              <div className="flex items-end">
                <Button type="submit" className="w-full"><Plus size={16} /> Add</Button>
              </div>
            </form>

            <div className="mt-5 space-y-2">
              {nutrition.meals?.length ? nutrition.meals.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{item.name}</p>
                    <p className="text-xs text-[var(--ff-muted)]">{item.time} · {item.calories} kcal · {item.proteinG}g proteína</p>
                  </div>
                  <Button variant="ghost" onClick={() => setNutrition(removeMeal(item.id))} className="shrink-0 px-3"><Trash2 size={16} /></Button>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-[var(--ff-border)] p-5 text-center text-sm text-[var(--ff-muted)]">
                  Nenhuma refeição registrada hoje.
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">Metas do dia</p>
          <h2 className="mt-1 text-xl font-black">Ajuste rápido</h2>
          <p className="mt-1 text-sm text-[var(--ff-muted)]">Por enquanto as metas ficam salvas localmente neste dispositivo.</p>

          <form onSubmit={handleSaveGoals} className="mt-4 space-y-3">
            <Input label="Meta de água (ml)" type="number" min="500" value={goals.waterGoalMl} onChange={(event) => setGoals((current) => ({ ...current, waterGoalMl: event.target.value }))} />
            <Input label="Meta de calorias" type="number" min="500" value={goals.calorieGoal} onChange={(event) => setGoals((current) => ({ ...current, calorieGoal: event.target.value }))} />
            <Input label="Meta de proteína (g)" type="number" min="20" value={goals.proteinGoalG} onChange={(event) => setGoals((current) => ({ ...current, proteinGoalG: event.target.value }))} />
            <Button type="submit" className="w-full">Salvar metas</Button>
          </form>

          <div className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
            <h3 className="font-black">Próximas melhorias</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              Esta base já prepara o caminho para histórico nutricional, macros por objetivo, lembretes de refeições e integração com peso corporal.
            </p>
          </div>
        </Card>
      </section>
    </>
  )
}

export default Nutrition
