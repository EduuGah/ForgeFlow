import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Camera,
  ChevronRight,
  Dumbbell,
  LogOut,
  Palette,
  Pencil,
  Scale,
  Shield,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Weight,
} from 'lucide-react'

import AppPageIntro from '../components/app/AppPageIntro'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmModal from '../components/ui/ConfirmModal'
import EmptyState from '../components/ui/EmptyState'
import Toast from '../components/ui/Toast'
import ProfileEditModal from '../features/profile/components/ProfileEditModal'
import {
  buildProfilePayload,
  calculateProfileStats,
  formatCompactNumber,
  getSafeProfileStorage,
  getSafeUserArray,
  normalizeProfilePreferences,
  normalizeUserProfile,
} from '../features/profile/profileUtils'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../services/api'
import {
  accentColors,
  applyAppSettingsToDocument,
  getUserAppSettings,
  saveUserAppSettings,
} from '../utils/settingsUtils'
import { saveUserStorageData } from '../utils/userStorage'

function getInitial(name = '') {
  return String(name || 'F').trim().slice(0, 1).toUpperCase() || 'F'
}

function getLastWorkoutLabel(stats) {
  if (!stats.lastWorkout) return 'Nenhum treino ainda'
  if (!stats.lastWorkoutDate) return stats.lastWorkout
  return `${stats.lastWorkout} · ${stats.lastWorkoutDate}`
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={checked ? 'ff-premium-switch is-on' : 'ff-premium-switch'}
    >
      <span />
    </button>
  )
}

function ProfileHero({ profile, stats, onEdit }) {
  return (
    <section className="ff-profile-premium-hero">
      <div className="ff-profile-premium-hero__avatar">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name || 'Foto de perfil'} loading="lazy" decoding="async" />
        ) : (
          <span>{getInitial(profile.name || profile.username)}</span>
        )}
      </div>

      <div className="ff-profile-premium-hero__content">
        <div className="min-w-0">
          <h2>{profile.name || 'Atleta ForgeFlow'}</h2>
          <p>{profile.username || profile.email || 'Complete seu perfil'}</p>
        </div>

        <div className="ff-profile-premium-hero__badges">
          {profile.goal && <Badge variant="purple">{profile.goal}</Badge>}
          {profile.trainingLevel && <Badge>{profile.trainingLevel}</Badge>}
        </div>
      </div>

      <Button type="button" onClick={onEdit}>
        <Pencil size={16} />
        Editar perfil
      </Button>

      <div className="ff-profile-premium-hero__metrics">
        <div>
          <strong>{stats.totalWorkouts}</strong>
          <span>Treinos</span>
        </div>
        <div>
          <strong>{stats.currentStreak}</strong>
          <span>Sequência</span>
        </div>
        <div>
          <strong>{stats.prs}</strong>
          <span>Recordes</span>
        </div>
        <div>
          <strong>{stats.progressPhotos}</strong>
          <span>Fotos</span>
        </div>
      </div>
    </section>
  )
}

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <Card className="ff-profile-stat-card">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
      <Icon size={18} />
    </Card>
  )
}

function ProgressSummary({ stats }) {
  const hasProgress = stats.totalWorkouts > 0 || stats.progressPhotos > 0

  return (
    <Card className="ff-profile-section-card">
      <div className="ff-section-title-row">
        <div>
          <span>Resumo do progresso</span>
          <h2>Seu painel pessoal</h2>
        </div>
        <Badge>{getLastWorkoutLabel(stats)}</Badge>
      </div>

      {!hasProgress ? (
        <EmptyState
          icon={Dumbbell}
          title="Finalize alguns treinos"
          description="Seu resumo de progresso aparece aqui conforme você registra treinos, PRs e fotos."
        />
      ) : (
        <div className="ff-profile-stats-grid">
          <StatCard icon={Dumbbell} label="Treinos finalizados" value={stats.totalWorkouts} detail="histórico salvo" />
          <StatCard icon={Weight} label="Volume total" value={formatCompactNumber(stats.totalVolume, 'kg')} detail="peso × reps" />
          <StatCard icon={Trophy} label="Melhor sequência" value={`${stats.bestStreak} dias`} detail="consistência" />
          <StatCard icon={Target} label="PRs registrados" value={stats.prs} detail="por exercício" />
          <StatCard icon={Camera} label="Fotos de progresso" value={stats.progressPhotos} detail="evolução visual" />
          <StatCard icon={Scale} label="Peso atual" value={stats.currentWeight ? `${stats.currentWeight} kg` : '—'} detail="último registro" />
        </div>
      )}
    </Card>
  )
}

function PreferenceRow({ icon: Icon, title, description, value, to, children }) {
  const content = (
    <article className="ff-profile-preference-row">
      <div className="ff-profile-preference-row__icon">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {children || (
        <div className="ff-profile-preference-row__value">
          <span>{value}</span>
          {to && <ChevronRight size={16} />}
        </div>
      )}
    </article>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }

  return content
}

function PreferencesSection({ settings, profile, onSettingChange, onPrivacyToggle }) {
  const accentName = accentColors[settings.accentColor]?.name || 'Azul'

  return (
    <Card className="ff-profile-section-card">
      <div className="ff-section-title-row">
        <div>
          <span>Preferências</span>
          <h2>Experiência do app</h2>
        </div>
      </div>

      <div className="ff-profile-preference-list">
        <PreferenceRow icon={Bell} title="Notificações" description="Gerenciar lembretes e permissões" value="Abrir" to="/notifications" />

        <PreferenceRow icon={Weight} title="Unidade de peso" description="Padrão usado nos treinos" value={settings.weightUnit || 'kg'}>
          <select value={settings.weightUnit || 'kg'} onChange={(event) => onSettingChange('weightUnit', event.target.value)}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </PreferenceRow>

        <PreferenceRow icon={Sparkles} title="Tema do app" description="Aparência geral" value={settings.themeMode || 'dark'}>
          <select value={settings.themeMode || 'dark'} onChange={(event) => onSettingChange('themeMode', event.target.value)}>
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
            <option value="system">Sistema</option>
          </select>
        </PreferenceRow>

        <PreferenceRow icon={Palette} title="Cor de destaque" description="Cor principal dos botões e cards" value={accentName}>
          <select value={settings.accentColor || 'blue'} onChange={(event) => onSettingChange('accentColor', event.target.value)}>
            {Object.entries(accentColors).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </PreferenceRow>

        <PreferenceRow icon={Shield} title="Ocultar fotos de progresso" description="Mostra proteção extra nas áreas visuais">
          <ToggleSwitch
            checked={Boolean(profile.preferences.hideProgressPhotos)}
            onChange={() => onPrivacyToggle('hideProgressPhotos')}
            label="Ocultar fotos de progresso"
          />
        </PreferenceRow>

        <PreferenceRow icon={Shield} title="Confirmar antes de abrir fotos" description="Evita abrir imagens sensíveis por acidente">
          <ToggleSwitch
            checked={Boolean(profile.preferences.confirmBeforeOpeningPhotos)}
            onChange={() => onPrivacyToggle('confirmBeforeOpeningPhotos')}
            label="Confirmar antes de abrir fotos"
          />
        </PreferenceRow>

        <PreferenceRow icon={Shield} title="Ocultar dados no compartilhamento" description="Remove dados sensíveis dos cards compartilhados">
          <ToggleSwitch
            checked={Boolean(profile.preferences.hideShareSensitiveData)}
            onChange={() => onPrivacyToggle('hideShareSensitiveData')}
            label="Ocultar dados no compartilhamento"
          />
        </PreferenceRow>
      </div>
    </Card>
  )
}

function AccountSection({ profile, onLogout }) {
  return (
    <Card className="ff-profile-section-card">
      <div className="ff-section-title-row">
        <div>
          <span>Conta</span>
          <h2>Acesso e informações</h2>
        </div>
      </div>

      <div className="ff-profile-account-grid">
        <div>
          <span>Email</span>
          <strong>{profile.email || 'Não informado'}</strong>
        </div>
        <div>
          <span>Conta conectada</span>
          <strong>{profile.email ? 'Ativa' : 'Local'}</strong>
        </div>
        <div>
          <span>Sincronização</span>
          <strong>Conta + dados locais</strong>
        </div>
      </div>

      <div className="ff-profile-account-actions">
        <Button type="button" variant="danger" onClick={onLogout}>
          <LogOut size={16} />
          Sair da conta
        </Button>
      </div>
    </Card>
  )
}

function AboutSection() {
  return (
    <Card className="ff-profile-about-card">
      <div>
        <span>Sobre o ForgeFlow</span>
        <strong>ForgeFlow</strong>
        <p>Versão 1.0.0</p>
      </div>
      <UserRound size={20} />
    </Card>
  )
}

function Profile() {
  const { user, setUser, logout } = useAuth()
  const [profile, setProfile] = useState(() => normalizeUserProfile({ user }))
  const [settings, setSettings] = useState(() => getUserAppSettings(user))
  const [history, setHistory] = useState([])
  const [progressPhotos, setProgressPhotos] = useState([])
  const [bodyWeight, setBodyWeight] = useState([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((type, title, message = '') => {
    setToast({ type, title, message })

    window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }, [])

  useEffect(() => {
    if (!user) return

    const storedProfile = getSafeProfileStorage(user)
    const normalizedProfile = normalizeUserProfile({ user, storedProfile })
    const cachedSettings = getUserAppSettings(user)

    setProfile(normalizedProfile)
    setSettings(cachedSettings)
    setHistory(getSafeUserArray(user, 'history'))
    setProgressPhotos(getSafeUserArray(user, 'progress-photos'))
    setBodyWeight(getSafeUserArray(user, 'bodyweight'))

    let mounted = true

    Promise.allSettled([
      apiFetch('/workout-history'),
      apiFetch('/progress-photos'),
      apiFetch('/body-weight'),
    ]).then(([historyResult, photosResult, weightResult]) => {
      if (!mounted) return

      if (historyResult.status === 'fulfilled' && Array.isArray(historyResult.value)) {
        setHistory(historyResult.value)
        saveUserStorageData(user, 'history', historyResult.value)
      }

      if (photosResult.status === 'fulfilled' && Array.isArray(photosResult.value)) {
        setProgressPhotos(photosResult.value)
        saveUserStorageData(user, 'progress-photos', photosResult.value)
      }

      if (weightResult.status === 'fulfilled' && Array.isArray(weightResult.value)) {
        setBodyWeight(weightResult.value)
        saveUserStorageData(user, 'bodyweight', weightResult.value)
      }
    }).catch(() => {
      // Dados locais já foram carregados.
    })

    return () => {
      mounted = false
    }
  }, [user])

  const stats = useMemo(() => {
    return calculateProfileStats(history, progressPhotos, bodyWeight)
  }, [bodyWeight, history, progressPhotos])

  function updateProfileField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }))
  }

  async function handleSaveProfile() {
    const normalizedProfile = normalizeUserProfile({
      user,
      storedProfile: {
        ...profile,
        preferences: normalizeProfilePreferences(profile.preferences),
      },
    })

    setSavingProfile(true)
    saveUserStorageData(user, 'user-profile-v2', normalizedProfile)

    try {
      const updatedUser = await apiFetch('/me/profile', {
        method: 'PUT',
        body: JSON.stringify(buildProfilePayload(normalizedProfile)),
      })

      setUser(updatedUser)
      setProfile(normalizeUserProfile({ user: updatedUser, storedProfile: normalizedProfile }))
      setIsEditOpen(false)
      showToast('success', 'Perfil atualizado', 'As alterações foram salvas na sua conta.')
    } catch {
      setProfile(normalizedProfile)
      setIsEditOpen(false)
      showToast('success', 'Perfil salvo neste dispositivo', 'A conta será sincronizada quando o servidor estiver disponível.')
    } finally {
      setSavingProfile(false)
    }
  }

  function handleSettingChange(key, value) {
    const updatedSettings = saveUserAppSettings(user, {
      ...settings,
      [key]: value,
    })

    setSettings(updatedSettings)
    applyAppSettingsToDocument(updatedSettings)
    showToast('success', 'Preferência salva', 'Sua experiência foi atualizada.')
  }

  function handlePrivacyToggle(key) {
    const nextPreferences = normalizeProfilePreferences({
      ...profile.preferences,
      [key]: !profile.preferences?.[key],
    })
    const nextProfile = {
      ...profile,
      preferences: nextPreferences,
    }

    setProfile(nextProfile)
    saveUserStorageData(user, 'user-profile-v2', nextProfile)
    showToast('success', 'Privacidade atualizada', 'A preferência foi salva.')
  }

  async function handleShareProfile() {
    const safeName = profile.preferences.hideShareSensitiveData ? 'Atleta ForgeFlow' : profile.name || 'Atleta ForgeFlow'
    const text = `${safeName}: ${stats.totalWorkouts} treinos, ${stats.prs} PRs e ${formatCompactNumber(stats.totalVolume, 'kg')} de volume no ForgeFlow.`
    const title = `Perfil ForgeFlow de ${safeName}`

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: `${window.location.origin}/profile` })
      } else {
        await navigator.clipboard?.writeText(text)
        showToast('success', 'Resumo copiado', 'O texto do perfil foi copiado.')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        showToast('error', 'Compartilhamento indisponível', 'Não foi possível compartilhar agora.')
      }
    }
  }

  function requestLogout() {
    setConfirmModal({
      title: 'Deseja sair da conta?',
      description: 'Você precisará entrar novamente para acessar seus dados.',
      confirmText: 'Sair',
      variant: 'danger',
      onConfirm: () => {
        setConfirmModal(null)
        logout({ redirect: true })
      },
    })
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-profile profile-page">
      <AppPageIntro
        eyebrow="Perfil"
        title="Perfil"
        description="Suas informações, preferências e progresso."
        metrics={[
          { label: 'Treinos', value: stats.totalWorkouts },
          { label: 'Sequência', value: `${stats.currentStreak}d` },
          { label: 'PRs', value: stats.prs },
        ]}
        action={
          <div className="ff-page-intro-actions">
            <button type="button" onClick={() => setIsEditOpen(true)} aria-label="Editar perfil">
              <Pencil size={18} />
            </button>
            <button type="button" onClick={handleShareProfile} aria-label="Compartilhar perfil">
              <Sparkles size={18} />
            </button>
          </div>
        }
      />

      <div className="ff-profile-body ff-page-mobile-main-grid">
        <ProfileHero profile={profile} stats={stats} onEdit={() => setIsEditOpen(true)} />
        <ProgressSummary stats={stats} />
        <PreferencesSection
          settings={settings}
          profile={profile}
          onSettingChange={handleSettingChange}
          onPrivacyToggle={handlePrivacyToggle}
        />
        <AccountSection profile={profile} onLogout={requestLogout} />
        <AboutSection />
      </div>

      <ProfileEditModal
        open={isEditOpen}
        profile={profile}
        saving={savingProfile}
        onClose={() => setIsEditOpen(false)}
        onSave={handleSaveProfile}
        onUpdateField={updateProfileField}
        onToast={showToast}
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
    </div>
  )
}

export default Profile
