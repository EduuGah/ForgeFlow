import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Dumbbell,
  Medal,
  Pencil,
  Ruler,
  Save,
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

import { getAppSettings } from '../utils/settingsUtils'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import AccountSecurityCard from '../components/profile/AccountSecurityCard'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { generateSmartNotifications } from '../utils/notificationUtils'
import {
  getUserStorageData,
  saveUserStorageData,
} from '../utils/userStorage'

import {
  getCompletedSets,
  getExercisePRs,
  getHeaviestExercise,
  getMostTrainedExercise,
} from '../utils/analyticsUtils'

function getTodayDateInputValue() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function normalizeBodyWeightFromApi(item) {
  const rawDate = item.date || item.createdAt

  return {
    ...item,
    id: item._id || item.id,
    weight: Number(item.weight) || 0,
    date: rawDate ? String(rawDate).slice(0, 10) : '',
    note: item.note || '',
  }
}

function normalizeHistoryFromApi(session) {
  return {
    ...session,
    id: session._id || session.id,
    duration: session.durationSeconds ?? session.duration ?? 0,
    workoutName: session.workoutName || session.name || 'Treino',
    exercises: Array.isArray(session.exercises) ? session.exercises : [],
    finishedAt: session.finishedAt || session.createdAt,
  }
}

function isFutureDate(dateString) {
  if (!dateString) return false
  return dateString > getTodayDateInputValue()
}

function parseWeightValue(value) {
  if (!value) return null

  const normalized = String(value).trim().replace(',', '.')
  const number = Number(normalized)

  return Number.isFinite(number) && number > 0 ? number : null
}

function formatShortDate(dateString) {
  if (!dateString) return 'Sem data'

  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year.slice(2)}`
  }

  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function getSafeBodyWeightList(user) {
  const savedWeights = getUserStorageData(user, 'bodyweight', [])

  return savedWeights
    .filter((item) => item?.date && !isFutureDate(item.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function Profile() {
  const { user, setUser } = useAuth()

  const [isProfileLoaded, setIsProfileLoaded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    avatarUrl: '',
    height: '',
    currentWeight: '',
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

  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  const dateInputRef = useRef(null)
  const settings = getAppSettings()

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadProfileData() {
      const userProfile = user?.profile || {}

      setProfile({
        name: user?.name || '',
        avatarUrl: user?.avatarUrl || '',
        height: userProfile.height || '',
        currentWeight: userProfile.currentWeight || '',
        goal: userProfile.mainGoal || '',
        experience: userProfile.trainingLevel || '',
        weeklyTarget: userProfile.trainingFrequency
          ? `${userProfile.trainingFrequency} treinos`
          : '',
        preferredSplit: userProfile.preferredSplit || '',
        notes: userProfile.notes || '',
      })

      const cachedBodyWeight = getSafeBodyWeightList(user)
      const cachedHistory = getUserStorageData(user, 'history', [])

      setBodyWeight(cachedBodyWeight)
      setHistory(cachedHistory)
      setIsProfileLoaded(true)

      try {
        const [bodyWeightResult, historyResult] = await Promise.allSettled([
          apiFetch('/body-weight'),
          apiFetch('/workout-history'),
        ])

        if (!isMounted) return

        const normalizedBodyWeight = bodyWeightResult.status === 'fulfilled' && Array.isArray(bodyWeightResult.value)
          ? bodyWeightResult.value.map(normalizeBodyWeightFromApi)
          : cachedBodyWeight

        const normalizedHistory = historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)
          ? historyResult.value.map(normalizeHistoryFromApi)
          : cachedHistory

        setBodyWeight(normalizedBodyWeight)
        setHistory(normalizedHistory)

        saveUserStorageData(user, 'bodyweight', normalizedBodyWeight)
        saveUserStorageData(user, 'history', normalizedHistory)
      } catch (error) {
        console.error(error)

        if (isMounted) {
          setBodyWeight(cachedBodyWeight)
          setHistory(cachedHistory)

          showToast(
            'error',
            'Usando dados locais',
            'Não foi possível carregar seus dados do servidor.'
          )
        }
      }
    }

    loadProfileData()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    if (!isProfileLoaded) return

    const safeWeights = bodyWeight.filter((item) => !isFutureDate(item.date))
    saveUserStorageData(user, 'bodyweight', safeWeights)
  }, [bodyWeight, isProfileLoaded, user])

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

  const profileWeight = profile.currentWeight || user?.profile?.currentWeight || null
  const currentWeight = bodyWeight.at(-1)?.weight || profileWeight || null
  const firstWeight = bodyWeight[0]?.weight || null
  const lastWeightRecord = bodyWeight.at(-1) || null

  const bodyWeightChartData = useMemo(() => {
    const groupedByDate = new Map()

    bodyWeight
      .filter((item) => item?.date && !isFutureDate(item.date))
      .forEach((item) => {
        groupedByDate.set(item.date, item)
      })

    return Array.from(groupedByDate.values()).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    )
  }, [bodyWeight])

  const weightDifference =
    currentWeight && firstWeight
      ? (Number(currentWeight) - Number(firstWeight)).toFixed(1)
      : null

  function updateProfileField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }))
  }

  function showToast(type, title, message = '') {
    setToast({
      type,
      title,
      message,
    })

    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  async function syncProfileWithAccount(nextProfile) {
    const trainingFrequencyNumber = nextProfile.weeklyTarget
      ? Number(String(nextProfile.weeklyTarget).replace(/\D/g, ''))
      : ''

    const updatedUser = await apiFetch('/me/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: nextProfile.name,
        avatarUrl: nextProfile.avatarUrl,
        height: nextProfile.height,
        currentWeight: nextProfile.currentWeight,
        mainGoal: nextProfile.goal,
        trainingLevel: nextProfile.experience,
        trainingFrequency: trainingFrequencyNumber,
        preferredSplit: nextProfile.preferredSplit,
        notes: nextProfile.notes,
      }),
    })

    setUser(updatedUser)

    return updatedUser
  }

  async function handleSaveProfile() {
    try {
      await syncProfileWithAccount(profile)

      setIsEditOpen(false)
      showToast(
        'success',
        'Perfil atualizado',
        'As alterações foram salvas na sua conta.'
      )
    } catch (error) {
      showToast(
        'error',
        'Erro ao salvar perfil',
        error.message || 'Não foi possível salvar o perfil.'
      )
    }
  }

  function handleDateChange(value) {
    if (isFutureDate(value)) {
      setDateInput('')

      showToast(
        'error',
        'Data inválida',
        'Não é possível registrar peso em uma data futura.'
      )

      return
    }

    setDateInput(value)
  }

  async function handleAddWeight(event) {
    event.preventDefault()

    if (!weightInput || !dateInput) {
      showToast('error', 'Registro incompleto', 'Informe o peso e a data.')
      return
    }

    if (isFutureDate(dateInput)) {
      setDateInput('')

      showToast(
        'error',
        'Data inválida',
        'Não é possível registrar peso em uma data futura.'
      )

      return
    }

    const parsedWeight = parseWeightValue(weightInput)

    if (!parsedWeight) {
      showToast(
        'error',
        'Peso inválido',
        'Digite um peso válido, como 72,5 ou 72.5.'
      )
      return
    }

    const alreadyHasDate = bodyWeight.find((item) => item.date === dateInput)

    try {
      let savedRecord

      if (alreadyHasDate?.id) {
        const confirmReplace = window.confirm(
          'Já existe um peso registrado nessa data. Deseja substituir pelo novo valor?'
        )

        if (!confirmReplace) return

        const updatedRecordFromApi = await apiFetch(
          `/body-weight/${alreadyHasDate.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              weight: parsedWeight,
              date: dateInput,
            }),
          }
        )

        savedRecord = normalizeBodyWeightFromApi(updatedRecordFromApi)
      } else {
        const savedRecordFromApi = await apiFetch('/body-weight', {
          method: 'POST',
          body: JSON.stringify({
            weight: parsedWeight,
            date: dateInput,
          }),
        })

        savedRecord = normalizeBodyWeightFromApi(savedRecordFromApi)
      }

      const updatedWeights = [
        ...bodyWeight.filter((item) => item.date !== dateInput),
        savedRecord,
      ]
        .filter((item) => !isFutureDate(item.date))
        .sort((a, b) => new Date(a.date) - new Date(b.date))

      setBodyWeight(updatedWeights)
      saveUserStorageData(user, 'bodyweight', updatedWeights)

      generateSmartNotifications({
        user,
        reason: alreadyHasDate?.id ? 'weight-updated' : 'weight-created',
        force: true,
      }).catch((error) => {
        console.error(error)
      })

      setWeightInput('')
      setDateInput('')

      const nextProfile = {
        ...profile,
        currentWeight: parsedWeight,
      }

      setProfile(nextProfile)

      setUser((currentUser) => ({
        ...currentUser,
        profile: {
          ...currentUser?.profile,
          currentWeight: parsedWeight,
        },
      }))

      showToast('success', 'Peso registrado', 'O registro foi salvo na sua conta.')
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao salvar peso',
        error.message || 'Não foi possível salvar o peso no servidor.'
      )
    }
  }

  function handleDeleteWeight(id) {
    const record = bodyWeight.find((item) => item.id === id)

    setConfirmModal({
      title: 'Excluir registro?',
      description: `O peso ${record?.weight || ''}kg será removido do histórico corporal.`,
      confirmText: 'Excluir',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await apiFetch(`/body-weight/${id}`, {
            method: 'DELETE',
          })

          const updatedWeights = bodyWeight.filter((item) => item.id !== id)

          setBodyWeight(updatedWeights)
          saveUserStorageData(user, 'bodyweight', updatedWeights)

          setConfirmModal(null)

          showToast(
            'success',
            'Registro excluído',
            'O peso foi removido da sua conta.'
          )
        } catch (error) {
          console.error(error)

          showToast(
            'error',
            'Erro ao excluir',
            error.message || 'Não foi possível remover o registro.'
          )
        }
      },
    })
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
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-bold text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] hover:shadow-[0_0_20px_var(--ff-accent-shadow)]"
          >
            <Pencil size={18} />
            Editar perfil
          </button>
        }
      />

      <section className="grid grid-cols-1 gap-4 2xl:grid-cols-3 2xl:gap-6">
        <Card className="overflow-hidden border-[var(--ff-accent-border)]/20 bg-gradient-to-br from-[var(--ff-accent-soft)]/20 via-[#18181b] to-[#121212] xl:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] shadow-[0_0_20px_var(--ff-accent-shadow)]">
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

                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  {profile.name || 'Atleta ForgeFlow'}
                </h1>

                <p className="mt-2 text-sm text-zinc-400">
                  {profile.goal || 'Objetivo não definido'} •{' '}
                  {profile.experience || 'Nível não definido'}
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

                <p className="mt-2 text-2xl font-black text-[var(--ff-accent-text)]">
                  {currentWeight ? `${currentWeight} kg` : '--'}
                </p>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Altura
                </p>

                <p className="mt-2 text-2xl font-black">
                  {profile.height ? `${profile.height} cm` : '--'}
                </p>
              </div>

              <div className="col-span-2 rounded-3xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs text-zinc-500">
                  Último peso registrado
                </p>

                <p className="mt-2 text-sm font-bold">
                  {lastWeightRecord
                    ? `${lastWeightRecord.weight} kg em ${formatShortDate(
                        lastWeightRecord.date
                      )}`
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

              <p className="mt-1 font-bold text-[var(--ff-accent-text)]">
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

      <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Peso atual
            </p>

            <Scale size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h3 className="mt-2 text-3xl font-black text-[var(--ff-accent-text)]">
            {currentWeight ? `${currentWeight} kg` : '--'}
          </h3>

          {weightDifference && (
            <p className="mt-2 text-xs text-zinc-500">
              Variação: {weightDifference > 0 ? '+' : ''}
              {weightDifference} kg
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Altura
            </p>

            <Ruler size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h3 className="mt-2 text-3xl font-black">
            {profile.height ? `${profile.height} cm` : '--'}
          </h3>

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
            Dados do perfil
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Treinos
            </p>

            <Dumbbell size={20} className="text-[var(--ff-accent-text)]" />
          </div>

          <h3 className="mt-2 text-3xl font-black">
            {totalWorkouts}
          </h3>

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
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

          <p className="mt-2 text-xs text-[var(--ff-accent-text)]">
            Registrados
          </p>
        </Card>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 2xl:grid-cols-3 2xl:gap-6">
        <div className="space-y-6 xl:col-span-2">
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

              <Weight size={24} className="text-[var(--ff-accent-text)]" />
            </div>

            <div className="mt-5 h-72">
              {bodyWeightChartData.length === 0 ? (
                <EmptyState
                  title="Nenhum peso registrado"
                  description="Adicione seu primeiro peso corporal para gerar o gráfico."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyWeightChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="date"
                      stroke="#71717a"
                      tickFormatter={formatShortDate}
                    />
                    <YAxis stroke="#71717a" />
                    <Tooltip
                      labelFormatter={(value) =>
                        `Data: ${formatShortDate(value)}`
                      }
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
                      <h3 className="mt-1 text-2xl font-black text-[var(--ff-accent-text)]">
                        {heaviestExercise.weight} kg
                      </h3>

                      <p className="mt-1 text-sm text-zinc-400">
                        {heaviestExercise.exerciseName} ×{' '}
                        {heaviestExercise.reps} reps
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
                    {totalWorkouts} treinos concluídos • {totalSets} séries
                    concluídas
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

              <div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto pr-2">
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
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--ff-accent-border)]/20 bg-[var(--ff-accent-soft)]/10 text-sm font-bold text-[var(--ff-accent-text)]">
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
                        {pr.weight} kg × {pr.reps}
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
              Adicione registros para acompanhar sua evolução corporal no gráfico.
            </p>

            <form onSubmit={handleAddWeight} className="mt-5 space-y-4">
              <div>
                <Input
                  label="Peso em kg"
                  placeholder="Ex: 72,5"
                  value={weightInput}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^\d,.]/g, '')
                    setWeightInput(value)
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
                      handleDateChange('')
                      showToast(
                        'error',
                        'Data inválida',
                        'Não é possível registrar peso em uma data futura.'
                      )
                    }
                  }}
                  onChange={(event) => handleDateChange(event.target.value)}
                  onBlur={(event) => {
                    const selectedDate = event.target.value

                    if (isFutureDate(selectedDate)) {
                      event.target.value = ''
                      handleDateChange('')
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
                Esse registro atualiza o gráfico e também usa o último peso como
                peso atual do perfil.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">
              Registros de peso
            </h2>

            <div className="mt-5 max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {bodyWeightChartData.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Nenhum registro ainda.
                </p>
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
                      <p className="font-bold">
                        {item.weight} kg
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

          <AccountSecurityCard />
        </div>
      </section>

      {isEditOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 px-4 pb-4 backdrop-blur-sm sm:items-center sm:py-6">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] border border-zinc-800 bg-[#121212] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl shadow-[0_0_20px_var(--ff-accent-shadow)] sm:rounded-3xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--ff-accent-text)]">
                  Editar perfil
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Dados do atleta
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Essas informações ficam salvas na sua conta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-xl font-bold text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 md:col-span-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name || 'Foto de perfil'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <UserRound size={34} />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-zinc-200">
                      Foto de perfil
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      Use uma URL de imagem. Upload próprio será adicionado
                      depois com Cloudinary/S3.
                    </p>

                    <div className="mt-3">
                      <Input
                        label="URL da foto de perfil"
                        placeholder="https://..."
                        value={profile.avatarUrl}
                        onChange={(event) =>
                          updateProfileField('avatarUrl', event.target.value)
                        }
                      />
                    </div>

                    {profile.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => updateProfileField('avatarUrl', '')}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-4 text-xs font-bold text-red-300 transition hover:bg-red-500/20"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Input
                label="Nome"
                placeholder="Seu nome"
                value={profile.name}
                onChange={(event) =>
                  updateProfileField('name', event.target.value)
                }
              />

              <div>
                <Input
                  label="Altura em cm"
                  inputMode="numeric"
                  placeholder="Ex: 175"
                  value={profile.height}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^\d]/g, '')
                    updateProfileField('height', value)
                  }}
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Use centímetros. Exemplo: 1,75m = 175.
                </p>
              </div>

              <div>
                <Input
                  label="Peso atual em kg"
                  placeholder="Ex: 72,5"
                  value={profile.currentWeight}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^\d,.]/g, '')
                    updateProfileField('currentWeight', value)
                  }}
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Esse é o peso atual do perfil. Para alimentar o gráfico, use o
                  card “Registrar peso”.
                </p>
              </div>

              <Select
                label="Objetivo"
                value={profile.goal}
                onChange={(event) =>
                  updateProfileField('goal', event.target.value)
                }
              >
                <option value="">Selecione</option>
                <option value="Bulking">Bulking</option>
                <option value="Cutting">Cutting</option>
                <option value="Recomposição">Recomposição</option>
                <option value="Força">Força</option>
                <option value="Hipertrofia">Hipertrofia</option>
                <option value="Emagrecimento">Emagrecimento</option>
                <option value="Condicionamento">Condicionamento</option>
              </Select>

              <Select
                label="Nível"
                value={profile.experience}
                onChange={(event) =>
                  updateProfileField('experience', event.target.value)
                }
              >
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </Select>

              <Select
                label="Meta semanal"
                value={profile.weeklyTarget}
                onChange={(event) =>
                  updateProfileField('weeklyTarget', event.target.value)
                }
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
                onChange={(event) =>
                  updateProfileField('preferredSplit', event.target.value)
                }
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Notas pessoais"
                placeholder="Ex: foco em força no supino, melhorar cardio, evitar dor no ombro..."
                rows={4}
                value={profile.notes}
                onChange={(event) =>
                  updateProfileField('notes', event.target.value)
                }
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleSaveProfile}
                className="w-full"
              >
                <Save size={17} />
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

      <ConfirmModal
        open={Boolean(confirmModal)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        confirmText={confirmModal?.confirmText}
        variant={confirmModal?.variant}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />

      <Toast
        show={Boolean(toast)}
        type={toast?.type}
        title={toast?.title}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </>
  )
}

export default Profile