import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Dumbbell,
  Info,
  LogOut,
  Shield,
  UserRound,
  Utensils,
} from 'lucide-react'

import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import ConfirmModal from '../components/ui/ConfirmModal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Toast from '../components/ui/Toast'
import NotificationSettingsSection from '../components/settings/NotificationSettingsSection'
import TutorialLauncher from '../components/tutorial/TutorialLauncher'
import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch } from '../services/api'
import { clearForgeFlowPwaCache } from '../utils/pwaUtils'
import {
  accentColors,
  applyAppSettingsToDocument,
  defaultSettings,
  getUserAppSettings,
  mergeSettingsByFreshness,
  saveUserAppSettings,
} from '../utils/settingsUtils'
import { getUserStorageData } from '../utils/userStorage'
import { normalizeWorkoutFromApi } from '../utils/workoutNormalizers'
import {
  GooglePasswordNotice,
  SettingsAppearanceSection,
  SettingsBackupSection,
  SettingsPasswordSection,
  SettingsTrainingPreferencesSection,
} from '../features/settings/components/SettingsSections'
import { SettingToggleCard } from '../features/settings/components/SettingsBaseControls'
import SettingsNavigation, { getSettingsCategory } from '../features/settings/components/SettingsNavigation'

function getSyncBadgeText(syncStatus) {
  if (syncStatus === 'loading') return 'Carregando'
  if (syncStatus === 'syncing') return 'Sincronizando'
  if (syncStatus === 'local') return 'Salvo local'
  if (syncStatus === 'error') return 'Falha ao sincronizar'
  return 'Preferências salvas'
}

function SettingsSectionHeader({ icon: Icon, eyebrow, title, description, action }) {
  return (
    <div className="ff-settings-section-header">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
          <Icon size={23} />
        </span>
        <div className="min-w-0">
          {eyebrow && <p className="ff-section-eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

function SettingsRow({ title, description, children }) {
  return (
    <div className="settings-row ff-settings-row">
      <div className="settings-row-content min-w-0">
        <strong className="settings-option-title">{title}</strong>
        {description && <p>{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingsNutritionSection({ settings, onUpdateSetting, onNavigate }) {
  function updateNumericSetting(key, rawValue, min = 0) {
    if (rawValue === '') {
      onUpdateSetting(key, '')
      return
    }

    const number = Number(rawValue)
    onUpdateSetting(key, Number.isFinite(number) ? Math.max(min, number) : '')
  }

  return (
    <Card className="settings-card p-4 sm:p-5" id="settings-nutrition" data-settings-panel="nutrition">
      <SettingsSectionHeader
        icon={Utensils}
        eyebrow="Nutrição"
        title="Água, refeições e metas"
        description="Preferências simples usadas pela página Nutrição e pelos lembretes existentes."
        action={<Button type="button" variant="secondary" onClick={onNavigate} className="hidden sm:inline-flex">Abrir Nutrição</Button>}
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Meta de água diária (ml)"
          type="number"
          min="500"
          inputMode="numeric"
          value={settings.dailyWaterGoalMl}
          onChange={(event) => updateNumericSetting('dailyWaterGoalMl', event.target.value, 500)}
        />
        <Input
          label="Meta de calorias"
          type="number"
          min="0"
          inputMode="numeric"
          value={settings.dailyCaloriesGoal}
          onChange={(event) => updateNumericSetting('dailyCaloriesGoal', event.target.value, 0)}
          placeholder="Opcional"
        />
        <Input
          label="Meta de proteína (g)"
          type="number"
          min="0"
          inputMode="numeric"
          value={settings.proteinGoal}
          onChange={(event) => updateNumericSetting('proteinGoal', event.target.value, 0)}
          placeholder="Opcional"
        />
        <Select
          label="Lembrete de água"
          value={settings.hydrationReminderEnabled ? settings.waterReminderCadence : 'off'}
          onChange={(event) => {
            const value = event.target.value
            onUpdateSetting({
              hydrationReminderEnabled: value !== 'off',
              waterReminderCadence: value,
            })
          }}
        >
          <option value="off">Desativado</option>
          <option value="1h">A cada 1 hora</option>
          <option value="2h">A cada 2 horas</option>
          <option value="3h">A cada 3 horas</option>
          <option value="4h">A cada 4 horas</option>
        </Select>
      </div>

      <Button type="button" variant="secondary" onClick={onNavigate} className="mt-4 w-full sm:hidden">
        Abrir Nutrição
      </Button>
    </Card>
  )
}

function SettingsPrivacySection({ settings, onUpdateSetting }) {
  return (
    <Card className="settings-card p-4 sm:p-5" id="settings-privacy" data-settings-panel="privacy">
      <SettingsSectionHeader
        icon={Shield}
        eyebrow="Privacidade"
        title="Controle o que aparece"
        description="Você controla quais informações aparecem no app e nos compartilhamentos."
      />

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SettingToggleCard
          title="Ocultar fotos de progresso"
          description="Evita prévias visuais em áreas sensíveis do app."
          active={settings.hideProgressPhotos}
          onChange={(value) => onUpdateSetting('hideProgressPhotos', value)}
        />
        <SettingToggleCard
          title="Confirmar antes de abrir fotos"
          description="Adiciona uma etapa antes de abrir fotos de progresso."
          active={settings.confirmBeforeOpeningPhotos}
          onChange={(value) => onUpdateSetting('confirmBeforeOpeningPhotos', value)}
        />
        <SettingToggleCard
          title="Ocultar dados sensíveis no compartilhamento"
          description="Remove dados pessoais dos cards compartilhados quando disponível."
          active={settings.hideSensitiveShareData}
          onChange={(value) => onUpdateSetting('hideSensitiveShareData', value)}
        />
        <SettingToggleCard
          title="Ocultar peso corporal nos cards"
          description="Mantém o peso fora dos cards de compartilhamento."
          active={settings.hideBodyWeightOnShare}
          onChange={(value) => onUpdateSetting('hideBodyWeightOnShare', value)}
        />
      </div>
    </Card>
  )
}

function SettingsWorkoutPolishSection({ settings, onUpdateSetting }) {
  return (
    <Card className="settings-card p-4 sm:p-5">
      <SettingsSectionHeader
        icon={Dumbbell}
        eyebrow="Treinos"
        title="Experiência de treino"
        description="Preferências rápidas para deixar o treino ativo mais confortável no mobile."
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Unidade de peso"
          value={settings.weightUnit}
          onChange={(event) => onUpdateSetting('weightUnit', event.target.value)}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </Select>
        <Select
          label="Densidade visual"
          value={settings.visualDensity}
          onChange={(event) => onUpdateSetting('visualDensity', event.target.value)}
        >
          <option value="comfortable">Confortável</option>
          <option value="compact">Compacta</option>
        </Select>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SettingToggleCard
          title="Mostrar PRs"
          description="Exibe recordes pessoais nos locais compatíveis."
          active={settings.showPRs}
          onChange={(value) => onUpdateSetting('showPRs', value)}
        />
        <SettingToggleCard
          title="Manter treino ativo visível"
          description="Mantém o atalho da sessão atual acessível."
          active={settings.keepActiveWorkoutVisible}
          onChange={(value) => onUpdateSetting('keepActiveWorkoutVisible', value)}
        />
        <SettingToggleCard
          title="Vibração ao concluir série"
          description="Feedback tátil leve quando o aparelho permitir."
          active={settings.hapticFeedback}
          onChange={(value) => onUpdateSetting('hapticFeedback', value)}
        />
        <SettingToggleCard
          title="Confirmar antes de concluir treino"
          description="Evita finalizar uma sessão por toque acidental."
          active={settings.confirmBeforeFinishWorkout}
          onChange={(value) => onUpdateSetting('confirmBeforeFinishWorkout', value)}
        />
      </div>
    </Card>
  )
}

function SettingsAccountSection({ user, syncBadgeText, onProfile, onLogout }) {
  const email = user?.email || 'Não informado'

  return (
    <Card className="settings-card p-4 sm:p-5" data-tutorial="settings-profile">
      <SettingsSectionHeader
        icon={UserRound}
        eyebrow="Conta"
        title="Perfil e acesso"
        description="Dados essenciais da conta, sem mostrar informações técnicas internas."
      />

      <div className="mt-5 space-y-3">
        <SettingsRow title="Perfil" description="Editar informações pessoais">
          <Button type="button" variant="secondary" onClick={onProfile} className="px-3">Abrir</Button>
        </SettingsRow>
        <SettingsRow title="Email" description={email}>
          <Badge>{user?.provider === 'google' ? 'Google' : 'Conta'}</Badge>
        </SettingsRow>
        <SettingsRow title="Sincronização" description={syncBadgeText}>
          <Badge>{syncBadgeText}</Badge>
        </SettingsRow>
        <button type="button" className="ff-logout-button" onClick={onLogout}>
          <LogOut size={18} />
          Sair da conta
        </button>
      </div>
    </Card>
  )
}

function SettingsAboutSection({ syncBadgeText, onClearPwaCache, onResetSettings }) {
  return (
    <Card className="settings-card p-4 sm:p-5">
      <SettingsSectionHeader
        icon={Info}
        eyebrow="App"
        title="Manutenção"
        description="Cache, versão e preferências locais em um só lugar."
        action={<Badge>{syncBadgeText}</Badge>}
      />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button type="button" variant="secondary" onClick={onClearPwaCache}>
          Limpar cache do app
        </Button>
        <Button type="button" variant="ghost" onClick={onResetSettings}>
          Restaurar padrão
        </Button>
      </div>
    </Card>
  )
}

function Settings() {
  const { user, setUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(defaultSettings)
  const [workouts, setWorkouts] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [pendingSettingKey, setPendingSettingKey] = useState('')
  const [colorSearch, setColorSearch] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [exportingType, setExportingType] = useState('')
  const [exportPassword, setExportPassword] = useState('')
  const [deleteAccountForm, setDeleteAccountForm] = useState({ password: '', confirmText: '' })
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [activeCategory, setActiveCategory] = useState('visual')

  const currentAccent = useMemo(() => {
    return accentColors[settings.accentColor] || accentColors.blue || Object.values(accentColors)[0]
  }, [settings.accentColor])

  const visibleAccentColorKeys = useMemo(() => {
    const search = colorSearch.trim().toLowerCase()

    return Object.entries(accentColors)
      .filter(([key, color]) => !search || `${key} ${color.name}`.toLowerCase().includes(search))
      .map(([key]) => key)
  }, [colorSearch])

  const syncBadgeText = useMemo(() => getSyncBadgeText(syncStatus), [syncStatus])

  const showToast = useCallback((type, title, message = '') => {
    setToast({ type, title, message })
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const requestedPanel = location.state?.openSettingsPanel || location.state?.activeSettingsSection || params.get('section') || location.hash?.replace('#', '')

    if (!requestedPanel) return
    setActiveCategory(getSettingsCategory(requestedPanel))
    if (requestedPanel === 'security' || requestedPanel === 'advanced') setShowAdvancedSettings(true)

    if (location.search || location.hash || location.state) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.search, location.hash, location.state, navigate])

  useEffect(() => {
    if (!user) return undefined

    let isMounted = true

    async function loadSettings() {
      const cachedSettings = getUserAppSettings(user)
      setSettings(cachedSettings)
      applyAppSettingsToDocument(cachedSettings)
      setSyncStatus('loading')

      try {
        const [settingsFromDatabase, remoteWorkouts] = await Promise.all([
          apiFetch('/settings'),
          apiFetch('/workouts').catch(() => null),
        ])

        if (!isMounted) return

        const mergedSettings = saveUserAppSettings(
          user,
          mergeSettingsByFreshness(cachedSettings, settingsFromDatabase),
          { touch: false }
        )

        setSettings(mergedSettings)
        applyAppSettingsToDocument(mergedSettings)
        setWorkouts(Array.isArray(remoteWorkouts) ? remoteWorkouts.map((workout) => normalizeWorkoutFromApi(workout)) : getUserStorageData(user, 'workouts', []))
        setSyncStatus('idle')
      } catch (error) {
        console.error(error)
        if (!isMounted) return
        setSettings(cachedSettings)
        setWorkouts(getUserStorageData(user, 'workouts', []))
        applyAppSettingsToDocument(cachedSettings)
        setSyncStatus('local')
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [user])

  useEffect(() => {
    function handleSettingsChanged(event) {
      if (!event?.detail) return
      setSettings(event.detail)
    }

    window.addEventListener('forgeflow:settings-changed', handleSettingsChanged)
    return () => window.removeEventListener('forgeflow:settings-changed', handleSettingsChanged)
  }, [])

  async function handleUpdateSetting(key, value) {
    const patch = typeof key === 'object' && key !== null ? key : { [key]: value }
    const updatedSettings = { ...settings, ...patch }
    const pendingKey = typeof key === 'string' ? key : Object.keys(patch)[0] || 'settings'

    setSettings(updatedSettings)
    setPendingSettingKey(pendingKey)
    setSyncStatus('syncing')
    const normalizedSettings = saveUserAppSettings(user, updatedSettings)
    applyAppSettingsToDocument(normalizedSettings)

    try {
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(normalizedSettings),
      })

      setSyncStatus('idle')
      showToast('success', 'Preferências salvas', 'As alterações foram aplicadas.')
    } catch (error) {
      console.error(error)
      setSyncStatus('local')
      showToast('error', 'Salvo localmente', 'Não foi possível sincronizar com a conta agora.')
    } finally {
      setPendingSettingKey('')
    }

    return updatedSettings
  }

  async function handleSetPassword(event) {
    event.preventDefault()
    setSavingPassword(true)

    try {
      const payload = {
        password: passwordForm.password,
        confirmPassword: passwordForm.confirmPassword,
      }

      if (user?.hasPassword) payload.currentPassword = passwordForm.currentPassword

      const data = await apiFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setUser(data.user)
      setPasswordForm({ currentPassword: '', password: '', confirmPassword: '' })
      showToast('success', user?.hasPassword ? 'Senha alterada' : 'Senha criada', data.message)
    } catch (error) {
      showToast('error', 'Erro ao salvar senha', error.message || 'Não foi possível atualizar sua senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  function handleLogoutRequest() {
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

  function handleResetSettings() {
    setConfirmModal({
      title: 'Restaurar configurações?',
      description: 'As preferências do app voltarão para o padrão. Seus dados de treino e nutrição não serão apagados.',
      confirmText: 'Restaurar',
      variant: 'danger',
      onConfirm: async () => {
        setSettings(defaultSettings)
        setSyncStatus('syncing')
        saveUserAppSettings(user, defaultSettings)
        applyAppSettingsToDocument(defaultSettings)
        setConfirmModal(null)

        try {
          await apiFetch('/settings', {
            method: 'PUT',
            body: JSON.stringify(defaultSettings),
          })
          setSyncStatus('idle')
          showToast('success', 'Configurações restauradas', 'As preferências voltaram ao padrão.')
        } catch {
          setSyncStatus('local')
          showToast('error', 'Restaurado localmente', 'Não foi possível sincronizar agora.')
        }
      },
    })
  }

  async function handleDeleteAccount() {
    if (deleteAccountForm.confirmText.trim().toUpperCase() !== 'EXCLUIR') {
      showToast('error', 'Confirmação inválida', 'Digite EXCLUIR para confirmar a exclusão.')
      return
    }

    setConfirmModal({
      title: 'Excluir conta permanentemente?',
      description: 'Esta ação remove sua conta e seus dados associados. Não será possível desfazer.',
      confirmText: 'Excluir conta',
      variant: 'danger',
      onConfirm: async () => {
        setDeletingAccount(true)

        try {
          await apiFetch('/me', {
            method: 'DELETE',
            body: JSON.stringify(deleteAccountForm),
          })
          setConfirmModal(null)
          logout({ redirect: true })
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao excluir conta', error.message || 'Não foi possível excluir sua conta.')
        } finally {
          setDeletingAccount(false)
        }
      },
    })
  }

  async function handleClearPwaCache() {
    try {
      await clearForgeFlowPwaCache()
      showToast('success', 'Cache limpo', 'Recarregue o app para buscar a versão mais recente.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao limpar cache', 'Não foi possível limpar o cache automaticamente.')
    }
  }

  async function handleExportJson() {
    try {
      setExportingType('json')
      const date = new Date().toISOString().slice(0, 10)
      await apiDownload('/export-data', `forgeflow-backup-${date}.json`, { password: exportPassword })
      showToast('success', 'Backup exportado', 'Seus dados foram baixados em JSON.')
    } catch (error) {
      showToast('error', 'Erro ao exportar', error.message || 'Não foi possível exportar seus dados.')
    } finally {
      setExportingType('')
    }
  }

  async function handleExportCsv() {
    try {
      setExportingType('csv')
      const date = new Date().toISOString().slice(0, 10)
      await apiDownload('/export/workout-history.csv', `forgeflow-historico-${date}.csv`, { password: exportPassword })
      showToast('success', 'Histórico exportado', 'O arquivo CSV foi baixado.')
    } catch (error) {
      showToast('error', 'Erro ao exportar', error.message || 'Não foi possível exportar o CSV.')
    } finally {
      setExportingType('')
    }
  }

  async function handleExportPdf() {
    try {
      setExportingType('pdf')
      const date = new Date().toISOString().slice(0, 10)
      await apiDownload('/export/report.pdf', `forgeflow-relatorio-${date}.pdf`)
      showToast('success', 'Relatório exportado', 'O PDF foi baixado.')
    } catch (error) {
      showToast('error', 'Erro ao exportar PDF', error.message || 'Não foi possível exportar o PDF.')
    } finally {
      setExportingType('')
    }
  }

  async function handleImportJson(event) {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    setConfirmModal({
      title: 'Importar backup?',
      description: 'Os dados do arquivo serão adicionados à sua conta. Nada será apagado no modo atual.',
      confirmText: 'Importar',
      variant: 'default',
      onConfirm: async () => {
        setConfirmModal(null)

        try {
          const text = await file.text()
          const backup = JSON.parse(text)
          const result = await apiFetch('/import-data', {
            method: 'POST',
            body: JSON.stringify({ backup, mode: 'merge' }),
          })
          showToast('success', 'Backup importado', result?.message || 'Os dados foram importados.')
        } catch (error) {
          showToast('error', 'Erro ao importar', error.message || 'Não foi possível importar o backup.')
        }
      },
    })
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-settings settings-page">
      <div className="ff-settings-page">
        <header className="ff-settings-hub-header">
          <div>
            <span>Preferências</span>
            <h1>Configurações</h1>
            <p>Escolha uma área para ajustar o ForgeFlow.</p>
          </div>
          <Badge variant={syncStatus === 'idle' ? 'purple' : 'default'}>{syncBadgeText}</Badge>
        </header>

        <SettingsNavigation activeCategory={activeCategory} onChange={setActiveCategory} />

        <section className="ff-settings-category-content" key={activeCategory}>
          {activeCategory === 'visual' && (
            <div id="settings-appearance" data-settings-panel="appearance" className="scroll-mt-24">
              <SettingsAppearanceSection
                settings={settings}
                currentAccent={currentAccent}
                colorSearch={colorSearch}
                onColorSearchChange={setColorSearch}
                visibleAccentColorKeys={visibleAccentColorKeys}
                pendingSettingKey={pendingSettingKey}
                onUpdateSetting={handleUpdateSetting}
              />
            </div>
          )}

          {activeCategory === 'training' && (
            <div className="space-y-5">
              <SettingsWorkoutPolishSection settings={settings} onUpdateSetting={handleUpdateSetting} />

              <div id="settings-training" data-settings-panel="training" className="scroll-mt-24">
                <SettingsTrainingPreferencesSection settings={settings} onUpdateSetting={handleUpdateSetting} />
              </div>

              <SettingsNutritionSection settings={settings} onUpdateSetting={handleUpdateSetting} onNavigate={() => navigate('/nutrition')} />
            </div>
          )}

          {activeCategory === 'reminders' && (
            <div id="settings-notifications" data-settings-panel="notifications" className="scroll-mt-24">
              <NotificationSettingsSection
                settings={settings}
                workouts={workouts}
                onUpdateSetting={handleUpdateSetting}
                onShowToast={showToast}
              />
            </div>
          )}

          {activeCategory === 'account' && (
            <div className="space-y-5">
              <GooglePasswordNotice user={user} />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SettingsAccountSection user={user} syncBadgeText={syncBadgeText} onProfile={() => navigate('/profile')} onLogout={handleLogoutRequest} />
                <SettingsPrivacySection settings={settings} onUpdateSetting={handleUpdateSetting} />
                <SettingsAboutSection
                  syncBadgeText={syncBadgeText}
                  onClearPwaCache={handleClearPwaCache}
                  onResetSettings={handleResetSettings}
                />
              </div>

              <section className="ff-settings-advanced" id="settings-security" data-settings-panel="security">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings((current) => !current)}
                  className="ff-settings-advanced__toggle"
                  aria-expanded={showAdvancedSettings}
                >
                  <span className="min-w-0">
                    <strong>Avançado e segurança</strong>
                    <small>Backup, senha, importação e exclusão de conta.</small>
                  </span>
                  <ChevronRight className={showAdvancedSettings ? 'shrink-0 rotate-90 transition' : 'shrink-0 transition'} size={18} />
                </button>

                {showAdvancedSettings && (
                  <div className="mt-5 space-y-5">
                    <SettingsBackupSection
                      exportPassword={exportPassword}
                      exportingType={exportingType}
                      onExportPasswordChange={setExportPassword}
                      onExportJson={handleExportJson}
                      onExportCsv={handleExportCsv}
                      onExportPdf={handleExportPdf}
                      onImportJson={handleImportJson}
                    />

                    <SettingsPasswordSection
                      user={user}
                      passwordForm={passwordForm}
                      savingPassword={savingPassword}
                      onPasswordFormChange={setPasswordForm}
                      onSubmit={handleSetPassword}
                    />

                    <Card className="settings-card border-red-500/20 p-4 sm:p-5">
                      <SettingsSectionHeader
                        icon={Shield}
                        eyebrow="Área sensível"
                        title="Excluir conta"
                        description="A exclusão é permanente e exige confirmação forte."
                      />
                      <div className="mt-5 space-y-3">
                        {user?.hasPassword && (
                          <Input
                            type="password"
                            label="Senha atual"
                            value={deleteAccountForm.password}
                            onChange={(event) => setDeleteAccountForm((current) => ({ ...current, password: event.target.value }))}
                            placeholder="Digite sua senha"
                          />
                        )}
                        <Input
                          label="Confirmação"
                          value={deleteAccountForm.confirmText}
                          onChange={(event) => setDeleteAccountForm((current) => ({ ...current, confirmText: event.target.value }))}
                          placeholder="Digite EXCLUIR"
                        />
                        <Button type="button" variant="danger" onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full">
                          {deletingAccount ? 'Excluindo...' : 'Excluir conta permanentemente'}
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeCategory === 'help' && <TutorialLauncher />}
        </section>
      </div>

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

export default Settings
