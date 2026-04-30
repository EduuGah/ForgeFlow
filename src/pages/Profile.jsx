import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Dumbbell,
  Flame,
  Medal,
  Pencil,
  Ruler,
  Scale,
  Target,
  Trash2,
  Trophy,
  UserRound,
  Weight,
} from 'lucide-react'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'

import {
  getCompletedSets,
  getExercisePRs,
  getHeaviestExercise,
  getMostTrainedExercise,
  getStorageData,
} from '../utils/analyticsUtils'

function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function Profile() {
  const [isProfileLoaded, setIsProfileLoaded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    height: '',
    goal: '',
    experience: '',
    weeklyTarget: '',
    preferredSplit: '',
    notes: '',
  })

  const [bodyWeight, setBodyWeight] = useState([])
  const [weightInput, setWeightInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [history, setHistory] = useState([])

  const dateInputRef = useRef(null)

  useEffect(() => {
    const savedProfile = getStorageData('forgeflow:profile', {
      name: '',
      height: '',
      goal: '',
      experience: '',
      weeklyTarget: '',
      preferredSplit: '',
      notes: '',
    })

    setProfile(savedProfile)
    setBodyWeight(getStorageData('forgeflow:bodyweight', []))
    setHistory(getStorageData('forgeflow:history', []))
    setIsProfileLoaded(true)
  }, [])

  useEffect(() => {
    if (!isProfileLoaded) return

    localStorage.setItem('forgeflow:profile', JSON.stringify(profile))
  }, [profile, isProfileLoaded])

  useEffect(() => {
    if (!isProfileLoaded) return

    localStorage.setItem('forgeflow:bodyweight', JSON.stringify(bodyWeight))
  }, [bodyWeight, isProfileLoaded])

  const completedSets = useMemo(() => getCompletedSets(history), [history])

  const prs = useMemo(() => {
    return getExercisePRs(completedSets).sort((a, b) => b.weight - a.weight)
  }, [completedSets])

  const heaviestExercise = useMemo(() => {
    return getHeaviestExercise(completedSets)
  }, [completedSets])

  const mostTrainedExercise = useMemo(() => {
    return getMostTrainedExercise(completedSets)
  }, [completedSets])

  const totalSets = completedSets.length
  const totalWorkouts = history.length
  const currentWeight = bodyWeight.at(-1)?.weight || null
  const firstWeight = bodyWeight[0]?.weight || null
  const lastWeightRecord = bodyWeight.at(-1) || null

  const weightDifference =
    currentWeight && firstWeight
      ? (currentWeight - firstWeight).toFixed(1)
      : null

  function updateProfileField(field, value) {
    setProfile({
      ...profile,
      [field]: value,
    })
  }

  function handleAddWeight(event) {
    event.preventDefault()

    if (!weightInput || !dateInput) {
      alert('Informe o peso e a data.')
      return
    }

    const newRecord = {
      id: crypto.randomUUID(),
      weight: Number(weightInput),
      date: dateInput,
    }

    const updatedWeights = [...bodyWeight, newRecord].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )

    setBodyWeight(updatedWeights)
    setWeightInput('')
    setDateInput('')
  }

  function handleDeleteWeight(id) {
    const confirmDelete = window.confirm('Deseja excluir este registro de peso?')

    if (!confirmDelete) return

    setBodyWeight(bodyWeight.filter((item) => item.id !== id))
  }

  return (
    <>
      <PageHeader
        title="Perfil"
        description="Dados pessoais, objetivo, evolução corporal e melhores marcas."
        action={
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white shadow-[0_0_18px_rgba(139,92,246,0.35)] transition hover:bg-violet-500 hover:shadow-[0_0_26px_rgba(139,92,246,0.55)]"
          >
            <Pencil size={18} />
            Editar perfil
          </button>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-[#18181b] to-[#121212]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_28px_rgba(139,92,246,0.25)]">
                <UserRound size={44} />
              </div>

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-300">
                  <Medal size={14} />
                  ForgeFlow Athlete
                </div>

                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  {profile.name || 'Atleta ForgeFlow'}
                </h1>

                <p className="mt-2 text-sm text-zinc-400">
                  {profile.goal || 'Objetivo não definido'} • {profile.experience || 'Nível não definido'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="purple">
                    {totalWorkouts} treinos
                  </Badge>

                  <Badge>
                    {totalSets} séries
                  </Badge>

                  {profile.weeklyTarget && (
                    <Badge variant="purple">
                      {profile.weeklyTarget}/semana
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-[280px]">
              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Peso atual
                </p>

                <p className="mt-2 text-2xl font-black text-violet-300">
                  {currentWeight ? `${currentWeight}kg` : '--'}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Altura
                </p>

                <p className="mt-2 text-2xl font-black">
                  {profile.height || '--'}
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Último peso registrado
                </p>

                <p className="mt-2 text-sm font-bold">
                  {lastWeightRecord
                    ? `${lastWeightRecord.weight}kg em ${formatShortDate(lastWeightRecord.date)}`
                    : 'Nenhum registro'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Target size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Objetivo
              </h2>

              <p className="text-sm text-zinc-500">
                Meta pessoal
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Objetivo atual
              </p>

              <p className="mt-1 font-bold">
                {profile.goal || 'Não definido'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Divisão preferida
              </p>

              <p className="mt-1 font-bold text-violet-300">
                {profile.preferredSplit || 'Não definida'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">
                Meta semanal
              </p>

              <p className="mt-1 font-bold">
                {profile.weeklyTarget || 'Não definida'}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Peso atual
            </p>

            <Scale size={20} className="text-violet-400" />
          </div>

          <h3 className="mt-2 text-3xl font-black text-violet-400">
            {currentWeight ? `${currentWeight}kg` : '--'}
          </h3>

          {weightDifference && (
            <p className="mt-2 text-xs text-zinc-500">
              Variação: {weightDifference > 0 ? '+' : ''}
              {weightDifference}kg
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Altura
            </p>

            <Ruler size={20} className="text-violet-400" />
          </div>

          <h3 className="mt-2 text-3xl font-black">
            {profile.height || '--'}
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Dados do perfil
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Treinos
            </p>

                        <Dumbbell size={20} className="text-violet-400" />
          </div>

          <h3 className="mt-2 text-3xl font-black">
            {totalWorkouts}
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Concluídos
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              PRs
            </p>

            <Trophy size={20} className="text-yellow-400" />
          </div>

          <h3 className="mt-2 text-3xl font-black">
            {prs.length}
          </h3>

          <p className="mt-2 text-xs text-violet-400">
            Registrados
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Evolução do peso corporal
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Gráfico baseado nos registros adicionados.
                </p>
              </div>

              <Weight size={24} className="text-violet-400" />
            </div>

            <div className="mt-5 h-72">
              {bodyWeight.length === 0 ? (
                <EmptyState
                  title="Nenhum peso registrado"
                  description="Adicione seu primeiro peso corporal para gerar o gráfico."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyWeight}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      contentStyle={{
                        background: '#09090b',
                        border: '1px solid #27272a',
                        borderRadius: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
                  <Medal size={24} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Destaques pessoais
                  </h2>

                  <p className="text-sm text-zinc-500">
                    Melhores marcas
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">
                    Maior carga registrada
                  </p>

                  {heaviestExercise ? (
                    <>
                      <h3 className="mt-1 text-2xl font-black text-violet-300">
                        {heaviestExercise.weight}kg
                      </h3>

                      <p className="mt-1 text-sm text-zinc-400">
                        {heaviestExercise.exerciseName} × {heaviestExercise.reps} reps
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-500">
                      Sem dados ainda.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">
                    Exercício mais feito
                  </p>

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
                    <p className="mt-2 text-sm text-zinc-500">
                      Sem dados ainda.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-xs text-zinc-500">
                    Total pessoal
                  </p>

                  <p className="mt-2 text-sm text-zinc-400">
                    {totalWorkouts} treinos concluídos • {totalSets} séries concluídas
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-bold">
                PRs por exercício
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Melhores marcas salvas no histórico.
              </p>

              <div className="mt-5 max-h-[430px] overflow-y-auto pr-2 space-y-3">
                {prs.length === 0 && (
                  <EmptyState
                    title="Nenhum PR encontrado"
                    description="Finalize treinos com peso e reps para gerar PRs."
                  />
                )}

                {prs.map((pr, index) => (
                  <div
                    key={pr.exerciseName}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-400">
                            #{index + 1}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate font-bold">
                              {pr.exerciseName}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {pr.muscleGroup}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Badge>
                        {pr.weight}kg × {pr.reps}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-bold">
              Registrar peso
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Adicione registros para acompanhar sua evolução corporal.
            </p>

            <form onSubmit={handleAddWeight} className="mt-5 space-y-4">
              <Input
                label="Peso"
                type="number"
                step="0.1"
                placeholder="Ex: 72.5"
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
              />

              <div>
                <label className="text-sm font-medium text-zinc-400">
                  Data
                </label>

                <input
                  ref={dateInputRef}
                  type="date"
                  value={dateInput}
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  onFocus={() => dateInputRef.current?.showPicker?.()}
                  onChange={(event) => setDateInput(event.target.value)}
                  className="mt-2 w-full cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <Button type="submit" className="w-full">
                Adicionar peso
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Registros de peso
            </h2>

            <div className="mt-5 max-h-[400px] overflow-y-auto pr-2 space-y-2">
              {bodyWeight.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum registro ainda.
                </p>
              )}

              {bodyWeight
                .slice()
                .reverse()
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                  >
                    <div>
                      <p className="font-bold">
                        {item.weight}kg
                      </p>

                      <p className="text-xs text-zinc-500">
                        {formatShortDate(item.date)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteWeight(item.id)}
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
              <h2 className="text-xl font-bold">
                Notas pessoais
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                {profile.notes}
              </p>
            </Card>
          )}
        </div>
      </section>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-2xl rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-violet-950/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-violet-400">
                  Editar perfil
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Dados do atleta
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Essas informações ficam salvas no navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome"
                placeholder="Seu nome"
                value={profile.name}
                onChange={(event) => updateProfileField('name', event.target.value)}
              />

              <Input
                label="Altura"
                placeholder="Ex: 1.75"
                value={profile.height}
                onChange={(event) => updateProfileField('height', event.target.value)}
              />

              <Select
                label="Objetivo"
                value={profile.goal}
                onChange={(event) => updateProfileField('goal', event.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Bulking">Bulking</option>
                <option value="Cutting">Cutting</option>
                <option value="Recomposição">Recomposição</option>
                <option value="Força">Força</option>
                <option value="Hipertrofia">Hipertrofia</option>
              </Select>

              <Select
                label="Nível"
                value={profile.experience}
                onChange={(event) => updateProfileField('experience', event.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </Select>

              <Select
                label="Meta semanal"
                value={profile.weeklyTarget}
                onChange={(event) => updateProfileField('weeklyTarget', event.target.value)}
              >
                <option value="">Selecione</option>
                <option value="2 treinos">2 treinos</option>
                <option value="3 treinos">3 treinos</option>
                <option value="4 treinos">4 treinos</option>
                <option value="5 treinos">5 treinos</option>
                <option value="6 treinos">6 treinos</option>
              </Select>

              <Input
                label="Divisão preferida"
                placeholder="Ex: Push Pull Legs"
                value={profile.preferredSplit}
                onChange={(event) => updateProfileField('preferredSplit', event.target.value)}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Notas pessoais"
                placeholder="Ex: foco em força no supino, melhorar cardio, evitar dor no ombro..."
                rows={4}
                value={profile.notes}
                onChange={(event) => updateProfileField('notes', event.target.value)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="w-full"
              >
                Salvar alterações
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditOpen(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Profile