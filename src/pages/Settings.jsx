import { useCallback, useEffect, useMemo, useState } from 'react'

import PageHeader from '../components/ui/PageHeader'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

import { useAuth } from '../context/AuthContext'
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

function Settings() {
  const { user, setUser } = useAuth()

  const [settings, setSettings] = useState(defaultSettings)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [pendingSettingKey, setPendingSettingKey] = useState('')
  const [colorSearch, setColorSearch] = useState('')

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
    if (!user) return undefined

    let isMounted = true

    async function loadSettings() {
      const cachedSettings = getUserAppSettings(user)

      setSettings(cachedSettings)
      applyAppSettingsToDocument(cachedSettings)
      setSyncStatus('loading')

      try {
        const settingsFromDatabase = await apiFetch('/settings')

        if (!isMounted) return

        const mergedSettings = saveUserAppSettings(user, {
          ...cachedSettings,
          ...settingsFromDatabase,
        })

        setSettings(mergedSettings)
        applyAppSettingsToDocument(mergedSettings)
        setSyncStatus('idle')
      } catch {
        if (!isMounted) return

        setSettings(cachedSettings)
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
    const updatedSettings = {
      ...settings,
      [key]: value,
    }

    setSettings(updatedSettings)
    setPendingSettingKey(key)
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

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Ajuste visual, preferências úteis, backup e segurança da sua conta."
        action={
          <Badge variant={syncStatus === 'idle' ? 'purple' : 'default'}>
            {syncBadgeText}
          </Badge>
        }
      />

      <GooglePasswordNotice user={user} />

      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ff-hevy-settings space-y-5 sm:space-y-6">
          <SettingsTutorialSection />

          <SettingsMaintenanceSection onClearPwaCache={handleClearPwaCache} />

          <SettingsAppearanceSection
            settings={settings}
            currentAccent={currentAccent}
            colorSearch={colorSearch}
            onColorSearchChange={setColorSearch}
            visibleAccentColors={visibleAccentColors}
            pendingSettingKey={pendingSettingKey}
            onUpdateSetting={handleUpdateSetting}
          />

          <SettingsTrainingPreferencesSection
            settings={settings}
            onUpdateSetting={handleUpdateSetting}
          />

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
        </div>

        <SettingsRiskSidebar
          user={user}
          syncBadgeText={syncBadgeText}
          deleteAccountForm={deleteAccountForm}
          deletingAccount={deletingAccount}
          onDeleteAccountFormChange={setDeleteAccountForm}
          onResetSettings={handleResetSettings}
          onDeleteAccount={handleDeleteAccount}
        />
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
    </>
  )
}

export default Settings
