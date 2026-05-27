import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, CalendarDays, Dumbbell, Pencil, Ruler, Settings as SettingsIcon, Share2 } from 'lucide-react'

import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import ProfileEditModal from '../features/profile/components/ProfileEditModal'
import ProfileWeightSection from '../features/profile/components/ProfileWeightSection'
import {
  getSafeBodyWeightList,
  isFutureDate,
  normalizeBodyWeightFromApi,
  normalizeHistoryFromApi,
  parseWeightValue,
} from '../features/profile/profileUtils'

import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import { generateSmartNotifications } from '../utils/notificationUtils'
import { getAppSettings } from '../utils/settingsUtils'
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

import AppPageIntro from '../components/app/AppPageIntro'

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
    <div className="ff-hevy-page ff-hevy-page-profile">

      <AppPageIntro
        eyebrow="Perfil"
        title={profile?.name || user?.name || 'Meu perfil'}
        description="Resumo do atleta, histórico recente e atalhos principais."
      />

    <>
      <section className="ff-profile-hevy-hero mb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="truncate text-3xl font-black tracking-[-0.06em] text-[var(--ff-text)]">
            {profile.name || user?.name || 'Perfil'}
          </h1>
          <div className="flex items-center gap-2 text-[var(--ff-text-soft)]">
            <button type="button" onClick={() => setIsEditOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--ff-surface-2)]" aria-label="Editar perfil">
              <Pencil size={22} />
            </button>
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--ff-surface-2)]" aria-label="Compartilhar perfil">
              <Share2 size={22} />
            </button>
            <a href="/settings" className="inline-flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-[var(--ff-surface-2)]" aria-label="Configurações">
              <SettingsIcon size={22} />
            </a>
          </div>
        </div>

        <div className="ff-profile-hevy-grid">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name || 'Perfil'} className="ff-profile-avatar" />
          ) : (
            <div className="ff-profile-avatar flex items-center justify-center text-3xl font-black text-[var(--ff-muted)]">
              {(profile.name || user?.name || 'F').slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <h2 className="truncate text-xl font-black tracking-[-0.04em]">{profile.name || user?.name || 'Atleta ForgeFlow'}</h2>
            <div className="ff-profile-stat-row mt-3">
              <div><strong>{totalWorkouts}</strong><span>Treinos</span></div>
              <div><strong>{prs.length}</strong><span>Recordes</span></div>
              <div><strong>{totalSets}</strong><span>Séries</span></div>
            </div>
          </div>
        </div>

        {(profile.notes || profile.goal || profile.preferredSplit) && (
          <div className="space-y-1 text-[var(--ff-text-soft)]">
            {profile.notes && <p className="text-base leading-relaxed">{profile.notes}</p>}
            {profile.goal && <p className="text-sm font-bold text-[var(--ff-accent)]">{profile.goal}</p>}
            {profile.preferredSplit && <p className="text-sm text-[var(--ff-muted)]">Rotina: {profile.preferredSplit}</p>}
          </div>
        )}

        <div className="rounded-[var(--ff-radius-lg)] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-black tracking-[-0.05em]">{Math.round((totalWorkouts || 0) * 1.15)} horas <span className="text-base font-medium text-[var(--ff-muted)]">registradas</span></p>
              <p className="mt-1 text-sm text-[var(--ff-muted)]">Peso atual: {currentWeight || '—'}kg · Último registro: {lastWeightRecord?.date || '—'} · Variação: {weightDifference || '—'}kg</p>
            </div>
            <span className="text-sm font-bold text-[var(--ff-accent)]">Últimos registros</span>
          </div>
          <div className="ff-profile-mini-chart mt-5 grid h-36 grid-cols-8 items-end gap-2 border-b border-[var(--ff-border)] pb-2" aria-label="Gráfico resumido de treinos">
            {Array.from({ length: 8 }).map((_, index) => {
              const value = Math.max(16, Math.min(100, ((history[index]?.exercises?.length || index + 1) * 16) + (index % 3) * 10))
              return <span key={index} className="block w-full self-end rounded-t-md bg-[var(--ff-accent)]" style={{ height: `${value}%` }} />
            })}
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            <span className="shrink-0 rounded-full bg-[var(--ff-accent)] px-5 py-2 text-sm font-bold text-white">Duração</span>
            <span className="shrink-0 rounded-full bg-[var(--ff-surface-2)] px-5 py-2 text-sm font-bold">Volume</span>
            <span className="shrink-0 rounded-full bg-[var(--ff-surface-2)] px-5 py-2 text-sm font-bold">Repetições</span>
          </div>
        </div>

        <div>
          <p className="mb-3 text-base font-bold text-[var(--ff-muted)]">Painel</p>
          <div className="ff-profile-panel-grid">
            <button type="button" className="ff-hevy-panel-button"><BarChart3 size={25} /> Estatísticas</button>
            <a href="/exercises" className="ff-hevy-panel-button"><Dumbbell size={25} /> Exercícios</a>
            <button type="button" className="ff-hevy-panel-button"><Ruler size={25} /> Medições</button>
            <a href="/calendar" className="ff-hevy-panel-button"><CalendarDays size={25} /> Calendário</a>
          </div>
        </div>
      </section>

      <ProfileWeightSection
        profile={profile}
        bodyWeightChartData={bodyWeightChartData}
        weightInput={weightInput}
        dateInput={dateInput}
        dateInputRef={dateInputRef}
        settings={settings}
        heaviestExercise={heaviestExercise}
        mostTrainedExercise={mostTrainedExercise}
        totalWorkouts={totalWorkouts}
        totalSets={totalSets}
        prs={prs}
        onAddWeight={handleAddWeight}
        onWeightInputChange={setWeightInput}
        onDateChange={handleDateChange}
        onDeleteWeight={handleDeleteWeight}
        onShowToast={showToast}
      />

      <ProfileEditModal
        open={isEditOpen}
        profile={profile}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProfile}
        onUpdateField={updateProfileField}
      />

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
  
    </div>
  )
}

export default Profile
