import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, ClipboardList, Download, Dumbbell, HelpCircle, Info, Languages, Lock, Moon, Shield, UserRound } from 'lucide-react'


import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import NotificationSettingsSection from '../components/settings/NotificationSettingsSection'

import { useAuth } from '../context/AuthContext'
import { getUserStorageData } from '../utils/userStorage'
import { normalizeWorkoutFromApi } from '../utils/workoutNormalizers'
import { apiDownload, apiFetch } from '../services/api'

import {
  accentColors,
  applyAppSettingsToDocument,
  defaultSettings,
  getUserAppSettings,
  saveUserAppSettings,
} from '../utils/settingsUtils'
import { clearForgeFlowPwaCache } from '../utils/pwaUtils'
import {
  GooglePasswordNotice,
  SettingsAppearanceSection,
  SettingsBackupSection,
  SettingsMaintenanceSection,
  SettingsPasswordSection,
  SettingsRiskSidebar,
  SettingsTrainingPreferencesSection,
  SettingsTutorialSection,
} from '../features/settings/components/SettingsSections'


const settingsGroups = [
  {
    title: 'Conta',
    rows: [
      { icon: UserRound, label: 'Perfil', href: '/profile', hint: 'Foto, bio e dados do atleta' },
      { icon: Lock, label: 'Conta', target: 'security', hint: 'Senha e acesso' },
      { label: 'Gerenciar Subscrição', pro: true, disabled: true, hint: 'Em breve' },
      { icon: Bell, label: 'Notificações', target: 'notifications', hint: 'Lembretes e alertas do app' },
    ],
  },
  {
    title: 'Preferências',
    rows: [
      { icon: Dumbbell, label: 'Treinamentos', target: 'training', hint: 'Descanso, unidades e preferências' },
      { icon: Shield, label: 'Privacidade e social', href: '/privacy', hint: 'Dados, visibilidade e segurança' },
      { icon: ClipboardList, label: 'Unidades', target: 'training', hint: 'Peso e padrões de treino' },
      { icon: Languages, label: 'Idioma', disabled: true, hint: 'Em breve' },
      { icon: Download, label: 'Integrações', disabled: true, hint: 'Em breve' },
      { icon: Moon, label: 'Tema', target: 'appearance', hint: 'Cor do app e aparência' },
      { icon: Download, label: 'Exportar e importar dados', target: 'backup', hint: 'Backup e relatórios' },
    ],
  },
  {
    title: 'Ajuda',
    rows: [
      { icon: Info, label: 'Guia de Arranque', target: 'tutorial', hint: 'Rever introdução do app' },
      { icon: ClipboardList, label: 'Ajuda de Rotina', href: '/schedule', hint: 'Agenda semanal de treinos' },
      { icon: HelpCircle, label: 'Perguntas Frequentes', disabled: true, hint: 'Em breve' },
      { icon: Download, label: 'Contactar-nos', disabled: true, hint: 'Em breve' },
      { icon: Info, label: 'Sobre', href: '/data-safety', hint: 'Segurança de dados' },
    ],
  },
]



function SettingsNativeDirectory({ selectedPanel, onNavigate, onBack }) {
  if (selectedPanel) {
    const panelTitle = {
      account: 'Conta',
      security: 'Senha e acesso',
      notifications: 'Notificações',
      training: 'Treinamentos',
      appearance: 'Tema',
      backup: 'Dados e backup',
      tutorial: 'Guia de arranque',
      maintenance: 'Manutenção',
    }[selectedPanel] || 'Configuração'

    return (
      <section className="ff-settings-native-detail lg:hidden">
        <button type="button" className="ff-settings-native-back" onClick={onBack}>‹ Voltar</button>
        <h2>{panelTitle}</h2>
        <p>Edite esta preferência abaixo. As alterações são salvas automaticamente quando possível.</p>
      </section>
    )
  }

  return (
    <section className="ff-settings-native mb-6 lg:hidden">
      <div className="ff-settings-native-hero">
        <span>Configurações</span>
        <h2>Controle do app</h2>
        <p>Ajuste conta, treino, tema e dados sem sair da experiência mobile.</p>
      </div>
      {settingsGroups.map((group) => (
        <div key={group.title} className="ff-settings-native-group">
          <h2 className="ff-settings-native-title">{group.title}</h2>
          <div className="ff-settings-native-list">
            {group.rows.map((row) => {
              const Icon = row.icon
              const content = (
                <>
                  {row.pro ? <span className="w-10 text-xs font-black text-[var(--ff-text)]">PRO</span> : Icon ? <Icon size={25} className="w-10" /> : <span className="w-10" />}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium">{row.label}</p>
                    {row.hint && <small>{row.hint}</small>}
                  </div>
                  <ChevronRight size={23} className="chev" />
                </>
              )

              if (row.href) {
                return <a key={row.label} href={row.href} className="ff-settings-native-row">{content}</a>
              }

              return (
                <button
                  key={row.label}
                  type="button"
                  disabled={row.disabled}
                  onClick={() => onNavigate?.(row)}
                  className="ff-settings-native-row w-full text-left disabled:opacity-55"
                >
                  {content}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

function Settings() {
  const { user, setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [settings, setSettings] = useState(defaultSettings)
  const [workouts, setWorkouts] = useState([])
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [pendingSettingKey, setPendingSettingKey] = useState('')
  const [colorSearch, setColorSearch] = useState('')
  const [selectedMobilePanel, setSelectedMobilePanel] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  })

  const [savingPassword, setSavingPassword] = useState(false)
  const [exportingType, setExportingType] = useState('')
  const [exportPassword, setExportPassword] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteAccountForm, setDeleteAccountForm] = useState({
    password: '',
    confirmText: '',
  })

  const currentAccent = useMemo(() => {
    return accentColors[settings.accentColor] || accentColors.purple || Object.values(accentColors)[0]
  }, [settings.accentColor])

  const colorGroups = useMemo(
    () => [
      {
        title: 'Recomendadas',
        keys: ['purple', 'blue', 'cyan', 'green', 'orange', 'rose'],
      },
      {
        title: 'Frias',
        keys: ['indigo', 'sky', 'cyan', 'teal', 'emerald'],
      },
      {
        title: 'Quentes',
        keys: ['yellow', 'amber', 'orange', 'red', 'crimson', 'rose', 'pink', 'fuchsia'],
      },
      {
        title: 'Neutras',
        keys: ['slate', 'zinc'],
      },
    ],
    []
  )

  const visibleAccentColors = useMemo(() => {
    const search = colorSearch.trim().toLowerCase()

    if (search) {
      return [
        {
          title: 'Resultado da busca',
          keys: Object.entries(accentColors)
            .filter(([key, color]) => `${key} ${color.name}`.toLowerCase().includes(search))
            .map(([key]) => key),
        },
      ]
    }

    return colorGroups
  }, [colorGroups, colorSearch])

  const syncBadgeText = useMemo(() => {
    if (syncStatus === 'loading') return 'Carregando'
    if (syncStatus === 'syncing') return 'Sincronizando'
    if (syncStatus === 'local') return 'Salvo local'
    if (syncStatus === 'error') return 'Falha ao sincronizar'

    return 'Conta sincronizada'
  }, [syncStatus])

  const showToast = useCallback((type, title, message = '') => {
    setToast({
      type,
      title,
      message,
    })

    window.setTimeout(() => {
      setToast(null)
    }, 3000)
  }, [])


  useEffect(() => {
    const requestedPanel = location.state?.openSettingsPanel
    if (requestedPanel) {
      setSelectedMobilePanel(requestedPanel)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

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

        const mergedSettings = saveUserAppSettings(user, {
          ...cachedSettings,
          ...settingsFromDatabase,
        })

        if (Array.isArray(remoteWorkouts)) {
          setWorkouts(remoteWorkouts.map((workout) => normalizeWorkoutFromApi(workout)))
        } else {
          setWorkouts(getUserStorageData(user, 'workouts', []))
        }

        setSettings(mergedSettings)
        applyAppSettingsToDocument(mergedSettings)
        setSyncStatus('idle')
      } catch {
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

  async function handleClearPwaCache() {
    try {
      await clearForgeFlowPwaCache()
      showToast('success', 'Cache limpo', 'Recarregue o app para buscar a versão mais recente.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao limpar cache', 'Não foi possível limpar o cache automaticamente.')
    }
  }

  async function handleSetPassword(event) {
    event.preventDefault()

    setSavingPassword(true)

    try {
      const payload = {
        password: passwordForm.password,
        confirmPassword: passwordForm.confirmPassword,
      }

      if (user?.hasPassword) {
        payload.currentPassword = passwordForm.currentPassword
      }

      const data = await apiFetch('/auth/set-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setUser(data.user)

      setPasswordForm({
        currentPassword: '',
        password: '',
        confirmPassword: '',
      })

      showToast(
        'success',
        user?.hasPassword ? 'Senha alterada' : 'Senha criada',
        data.message
      )
    } catch (err) {
      showToast(
        'error',
        'Erro ao salvar senha',
        err.message || 'Não foi possível atualizar sua senha.'
      )
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleUpdateSetting(key, value) {
    const patch = typeof key === 'object' && key !== null ? key : { [key]: value }
    const updatedSettings = {
      ...settings,
      ...patch,
    }
    const pendingKey = typeof key === 'string' ? key : Object.keys(patch)[0] || 'settings'

    setSettings(updatedSettings)
    setPendingSettingKey(pendingKey)
    setSyncStatus('syncing')
    saveUserAppSettings(user, updatedSettings)
    applyAppSettingsToDocument(updatedSettings)

    try {
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(updatedSettings),
      })

      setSyncStatus('idle')
      showToast('success', 'Configuração salva', 'A preferência foi salva na sua conta.')
    } catch {
      setSyncStatus('local')

      showToast(
        'error',
        'Salvo localmente',
        'A configuração foi aplicada, mas não foi possível sincronizar com a conta.'
      )
    } finally {
      setPendingSettingKey('')
    }

    return updatedSettings
  }

  async function handleDeleteAccount() {
    if (deleteAccountForm.confirmText.trim().toUpperCase() !== 'EXCLUIR') {
      showToast('error', 'Confirmação inválida', 'Digite EXCLUIR para confirmar a exclusão.')
      return
    }

    setConfirmModal({
      title: 'Excluir conta permanentemente?',
      description:
        'Esta ação remove sua conta e seus dados associados. Não será possível desfazer.',
      confirmText: 'Excluir conta',
      variant: 'danger',
      onConfirm: async () => {
        setDeletingAccount(true)

        try {
          await apiFetch('/me', {
            method: 'DELETE',
            body: JSON.stringify(deleteAccountForm),
          })

          localStorage.removeItem('forgeflow:token')
          setConfirmModal(null)
          window.location.href = '/login'
        } catch (error) {
          console.error(error)
          showToast('error', 'Erro ao excluir conta', error.message || 'Não foi possível excluir sua conta.')
        } finally {
          setDeletingAccount(false)
        }
      },
    })
  }

  function handleResetSettings() {
    setConfirmModal({
      title: 'Restaurar configurações?',
      description:
        'As preferências do app voltarão para o padrão. Seus dados salvos na conta não serão apagados.',
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

          showToast(
            'success',
            'Configurações restauradas',
            'As preferências voltaram ao padrão e foram salvas na sua conta.'
          )
        } catch {
          setSyncStatus('local')

          showToast(
            'error',
            'Restaurado localmente',
            'As preferências foram restauradas, mas não sincronizaram com a conta.'
          )
        }
      },
    })
  }

  async function handleExportJson() {
    try {
      setExportingType('json')
      const date = new Date().toISOString().slice(0, 10)

      await apiDownload('/export-data', `forgeflow-backup-${date}.json`, { password: exportPassword })

      showToast('success', 'Backup exportado', 'Seus dados foram baixados em JSON.')
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao exportar', error.message || 'Não foi possível exportar seus dados.')
    } finally {
      setExportingType('')
    }
  }

  async function handleExportCsv() {
    try {
      setExportingType('csv')
      const date = new Date().toISOString().slice(0, 10)

      await apiDownload(
        '/export/workout-history.csv',
        `forgeflow-historico-${date}.csv`,
        { password: exportPassword }
      )

      showToast('success', 'Histórico exportado', 'O arquivo CSV foi baixado.')
    } catch (error) {
      console.error(error)
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
      console.error(error)
      showToast('error', 'Erro ao exportar PDF', error.message || 'Não foi possível exportar o PDF.')
    } finally {
      setExportingType('')
    }
  }

  async function handleImportJson(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const confirmed = window.confirm(
      'Deseja importar este backup? Os dados do arquivo serão adicionados à sua conta.'
    )

    if (!confirmed) {
      event.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const backup = JSON.parse(text)

      const result = await apiFetch('/import-data', {
        method: 'POST',
        body: JSON.stringify({
          backup,
          mode: 'merge',
        }),
      })

      showToast('success', 'Backup importado', result?.message || 'Os dados foram importados.')
      event.target.value = ''
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao importar', error.message || 'Não foi possível importar o backup.')
      event.target.value = ''
    }
  }


  function handleNativeSettingsNavigate(row) {
    if (!row?.target) {
      showToast('info', row?.label || 'Em breve', 'Essa opção ainda será adicionada no ForgeFlow.')
      return
    }

    setSelectedMobilePanel(row.target)
  }

  function panelClass(panel) {
    return selectedMobilePanel && selectedMobilePanel !== panel ? 'hidden lg:block' : ''
  }

  return (
    <div className="ff-hevy-page ff-hevy-page-settings">

      <header className="mb-5 flex items-center justify-between gap-3 lg:hidden">
        <div className="w-10" />
        <h1 className="text-center text-xl font-medium tracking-[-0.03em]">Configurações</h1>
        <Badge variant={syncStatus === 'idle' ? 'purple' : 'default'}>{syncBadgeText}</Badge>
      </header>

      <div className="hidden lg:block">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.055em]">Configurações</h1>
            <p className="mt-2 text-sm text-[var(--ff-muted)]">Ajuste visual, preferências úteis, backup e segurança da sua conta.</p>
          </div>
          <Badge variant={syncStatus === 'idle' ? 'purple' : 'default'}>{syncBadgeText}</Badge>
        </div>
      </div>

      <SettingsNativeDirectory selectedPanel={selectedMobilePanel} onNavigate={handleNativeSettingsNavigate} onBack={() => setSelectedMobilePanel('')} />

      {(!selectedMobilePanel || selectedMobilePanel === 'account' || selectedMobilePanel === 'security') && <GooglePasswordNotice user={user} />}

      <section className={`ff-settings-layout grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_320px] ${selectedMobilePanel ? 'is-mobile-panel-open' : 'is-mobile-directory'}`}>
        <div className="ff-hevy-settings space-y-5 sm:space-y-6">
          <div id="settings-tutorial" data-settings-panel="tutorial" className={`scroll-mt-24 ${panelClass('tutorial')}`}>
            <SettingsTutorialSection />
          </div>

          <div id="settings-maintenance" data-settings-panel="maintenance" className={`scroll-mt-24 ${panelClass('maintenance')}`}>
            <SettingsMaintenanceSection onClearPwaCache={handleClearPwaCache} />
          </div>

          <div id="settings-appearance" data-settings-panel="appearance" className={`scroll-mt-24 ${panelClass('appearance')}`}>
            <SettingsAppearanceSection
              settings={settings}
              currentAccent={currentAccent}
              colorSearch={colorSearch}
              onColorSearchChange={setColorSearch}
              visibleAccentColors={visibleAccentColors}
              pendingSettingKey={pendingSettingKey}
              onUpdateSetting={handleUpdateSetting}
            />
          </div>

          <div id="settings-training" data-settings-panel="training" className={`scroll-mt-24 ${panelClass('training')}`}>
            <SettingsTrainingPreferencesSection
              settings={settings}
              onUpdateSetting={handleUpdateSetting}
            />
          </div>

          <div id="settings-notifications" data-settings-panel="notifications" className={`scroll-mt-24 ${panelClass('notifications')}`}>
            <NotificationSettingsSection
              settings={settings}
              workouts={workouts}
              onUpdateSetting={handleUpdateSetting}
              onShowToast={showToast}
            />
          </div>

          <div id="settings-backup" data-settings-panel="backup" className={`scroll-mt-24 ${panelClass('backup')}`}>
            <SettingsBackupSection
              exportPassword={exportPassword}
              exportingType={exportingType}
              onExportPasswordChange={setExportPassword}
              onExportJson={handleExportJson}
              onExportCsv={handleExportCsv}
              onExportPdf={handleExportPdf}
              onImportJson={handleImportJson}
            />
          </div>

          <div id="settings-security" data-settings-panel="security" className={`scroll-mt-24 ${panelClass('security')}`}>
            <SettingsPasswordSection
              user={user}
              passwordForm={passwordForm}
              savingPassword={savingPassword}
              onPasswordFormChange={setPasswordForm}
              onSubmit={handleSetPassword}
            />
          </div>
        </div>

        <div className={selectedMobilePanel && selectedMobilePanel !== 'security' ? 'hidden lg:block' : ''}>
        <SettingsRiskSidebar
          user={user}
          syncBadgeText={syncBadgeText}
          deleteAccountForm={deleteAccountForm}
          deletingAccount={deletingAccount}
          onDeleteAccountFormChange={setDeleteAccountForm}
          onResetSettings={handleResetSettings}
          onDeleteAccount={handleDeleteAccount}
        />
        </div>
      </section>

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
