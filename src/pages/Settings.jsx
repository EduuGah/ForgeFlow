import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Moon,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  X,
  Monitor,
  Smartphone,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'

import { useAuth } from '../context/AuthContext'
import { apiDownload, apiFetch } from '../services/api'

import {
  accentColors,
  applyAppSettingsToDocument,
  defaultSettings,
  getUserAppSettings,
  saveUserAppSettings,
} from '../utils/settingsUtils'

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_22px_var(--ff-accent-shadow)]/20">
        <Icon size={23} />
      </div>

      <div>
        <h2 className="text-xl font-black tracking-tight text-[var(--ff-text)]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

function ToggleSwitch({ active, onChange, label }) {
  const isActive = Boolean(active)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      onClick={() => onChange(!isActive)}
      className={[
        'group inline-flex min-w-[112px] items-center justify-between gap-2 rounded-full border p-1.5 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--ff-accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--ff-bg)]',
        isActive
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_20px_var(--ff-accent-shadow)]/25'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-border-strong)] hover:text-[var(--ff-text)]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
          isActive
            ? 'translate-x-[72px] bg-[var(--ff-accent)] text-white'
            : 'translate-x-0 bg-[var(--ff-surface-3)] text-[var(--ff-muted)]',
        ].join(' ')}
      >
        {isActive ? <Check size={15} /> : <X size={15} />}
      </span>

      <span
        className={[
          'pointer-events-none w-[64px] text-center text-xs font-black uppercase tracking-wide transition',
          isActive ? '-translate-x-8' : 'translate-x-0',
        ].join(' ')}
      >
        {isActive ? 'Ativo' : 'Off'}
      </span>
    </button>
  )
}

function SettingToggleCard({ title, description, active, onChange }) {
  const isActive = Boolean(active)

  return (
    <button
      type="button"
      onClick={() => onChange(!isActive)}
      className={[
        'group flex min-h-[132px] w-full flex-col justify-between rounded-3xl border p-5 text-left transition-all duration-200',
        'hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--ff-accent)]/40',
        isActive
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_26px_var(--ff-accent-shadow)]/15'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={[
                'h-2.5 w-2.5 rounded-full transition',
                isActive ? 'bg-[var(--ff-accent)]' : 'bg-[var(--ff-muted-2)]',
              ].join(' ')}
            />

            <p className="font-bold text-[var(--ff-text)]">
              {title}
            </p>
          </div>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </div>

        <ToggleSwitch
          active={isActive}
          label={title}
          onChange={onChange}
        />
      </div>
    </button>
  )
}

function ThemeOption({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-3xl border p-5 text-left transition hover:-translate-y-0.5',
        active
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_26px_var(--ff-accent-shadow)]/20'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-surface)] text-[var(--ff-accent-text)]">
          <Icon size={22} />
        </div>

        {active && (
          <span className="rounded-full bg-[var(--ff-accent)] px-2 py-1 text-xs font-black text-white">
            Atual
          </span>
        )}
      </div>

      <p className="mt-4 font-black text-[var(--ff-text)]">
        {title}
      </p>

      <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
        {description}
      </p>
    </button>
  )
}

function ColorOption({ colorKey, color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
        active
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)]',
      ].join(' ')}
    >
      <span
        className="h-8 w-8 shrink-0 rounded-full shadow-lg ring-2 ring-white/10"
        style={{
          background: `linear-gradient(135deg, ${color.primary}, ${color.primaryHover})`,
          boxShadow: `0 0 18px ${color.shadow}`,
        }}
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[var(--ff-text)]">
          {color.name}
        </span>

        <span className="block truncate text-xs text-[var(--ff-muted)]">
          {colorKey}
        </span>
      </span>

      {active && (
        <Check size={18} className="text-[var(--ff-accent-text)]" />
      )}
    </button>
  )
}

function Settings() {
  const { user, setUser } = useAuth()

  const [settings, setSettings] = useState(defaultSettings)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [pendingSettingKey, setPendingSettingKey] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  })

  const [savingPassword, setSavingPassword] = useState(false)
  const [exportingType, setExportingType] = useState('')

  const currentAccent = useMemo(() => {
    return accentColors[settings.accentColor] || accentColors.purple || Object.values(accentColors)[0]
  }, [settings.accentColor])

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

    const cachedSettings = getUserAppSettings(user)
    setSettings(cachedSettings)
    applyAppSettingsToDocument(cachedSettings)
    setSyncStatus('loading')

    async function loadSettings() {
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

      await apiDownload('/export-data', `forgeflow-backup-${date}.json`)

      showToast(
        'success',
        'Backup exportado',
        'Seus dados foram baixados em JSON.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao exportar',
        error.message || 'Não foi possível exportar seus dados.'
      )
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
        `forgeflow-historico-${date}.csv`
      )

      showToast(
        'success',
        'Histórico exportado',
        'O arquivo CSV foi baixado.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao exportar',
        error.message || 'Não foi possível exportar o CSV.'
      )
    } finally {
      setExportingType('')
    }
  }

  async function handleExportPdf() {
    try {
      setExportingType('pdf')
      const date = new Date().toISOString().slice(0, 10)

      await apiDownload(
        '/export/report.pdf',
        `forgeflow-relatorio-${date}.pdf`
      )

      showToast(
        'success',
        'Relatório exportado',
        'O PDF foi baixado.'
      )
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao exportar PDF',
        error.message || 'Não foi possível exportar o PDF.'
      )
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

      showToast(
        'success',
        'Backup importado',
        result?.message || 'Os dados foram importados.'
      )

      event.target.value = ''
    } catch (error) {
      console.error(error)

      showToast(
        'error',
        'Erro ao importar',
        error.message || 'Não foi possível importar o backup.'
      )

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

      {user?.provider === 'google' && !user?.hasPassword && (
        <div className="mb-6 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5 text-amber-100 shadow-lg shadow-amber-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
              <AlertTriangle size={22} />
            </div>

            <div className="flex-1">
              <h2 className="text-base font-black text-amber-100">
                Crie uma senha para acessar sua conta também pelo login tradicional
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-amber-100/75">
                Sua conta foi criada usando o Google. Para entrar com e-mail e senha no futuro,
                defina uma senha de acesso abaixo.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="ff-hevy-settings space-y-5 sm:space-y-6">
          <Card>
            <SectionTitle
              icon={Palette}
              title="Aparência"
              description="Escolha o tema e personalize a cor principal do ForgeFlow."
            />

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              <ThemeOption
                icon={Moon}
                title="Escuro"
                description="Visual padrão, com fundo preto e contraste alto."
                active={settings.themeMode === 'dark'}
                onClick={() => handleUpdateSetting('themeMode', 'dark')}
              />

              <ThemeOption
                icon={Sun}
                title="Claro"
                description="Fundo claro para usar melhor durante o dia."
                active={settings.themeMode === 'light'}
                onClick={() => handleUpdateSetting('themeMode', 'light')}
              />

              <ThemeOption
                icon={Monitor}
                title="Sistema"
                description="Segue automaticamente o tema do seu dispositivo."
                active={settings.themeMode === 'system'}
                onClick={() => handleUpdateSetting('themeMode', 'system')}
              />
            </div>

            <div className="mt-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-black text-[var(--ff-text)]">
                    Cor principal
                  </h3>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    Todas as cores continuam disponíveis, agora em uma grade visual.
                  </p>
                </div>

                <Badge>
                  {currentAccent?.name || 'Roxo'}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(accentColors).map(([key, color]) => (
                  <ColorOption
                    key={key}
                    colorKey={key}
                    color={color}
                    active={settings.accentColor === key}
                    onClick={() => handleUpdateSetting('accentColor', key)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-[var(--ff-text)]">
                    Prévia
                  </p>

                  <p className="mt-1 text-sm text-[var(--ff-muted)]">
                    Este card usa as mesmas variáveis globais aplicadas no app.
                  </p>
                </div>

                {pendingSettingKey === 'accentColor' && (
                  <Badge>Aplicando cor...</Badge>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--ff-accent)] px-3 py-1 text-xs font-black text-white">
                  Botão principal
                </span>

                <span className="rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-black text-[var(--ff-accent-text)]">
                  Destaque
                </span>

                <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3 py-1 text-xs font-black text-[var(--ff-muted)]">
                  Superfície
                </span>
              </div>
            </div>

            <div className="mt-5">
              <SettingToggleCard
                title="Modo compacto no celular"
                description="Reduz espaçamentos e deixa os cards mais compactos em telas pequenas."
                active={settings.compactMobile}
                onChange={(value) =>
                  handleUpdateSetting('compactMobile', value)
                }
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={SlidersHorizontal}
              title="Preferências de treino"
              description="Somente opções que já têm efeito real nas telas do ForgeFlow."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Select
                label="Modelo padrão de séries"
                value={settings.defaultSetModel}
                onChange={(event) =>
                  handleUpdateSetting('defaultSetModel', event.target.value)
                }
              >
                <option value="hypertrophy">Hipertrofia padrão</option>
                <option value="beginner">Iniciante</option>
                <option value="strength">Força</option>
                <option value="pyramid">Pirâmide</option>
                <option value="custom">Simples</option>
              </Select>

              <Select
                label="Descanso padrão"
                value={settings.defaultRestTimer}
                onChange={(event) =>
                  handleUpdateSetting('defaultRestTimer', event.target.value)
                }
              >
                <option value="Desligado">Desligado</option>
                <option value="30s">30 segundos</option>
                <option value="45s">45 segundos</option>
                <option value="60s">60 segundos</option>
                <option value="90s">90 segundos</option>
                <option value="120s">120 segundos</option>
              </Select>

              <Input
                label="Treinos visíveis"
                type="number"
                min="1"
                max="20"
                inputMode="numeric"
                value={settings.workoutsVisibleLimit}
                onChange={(event) =>
                  handleUpdateSetting(
                    'workoutsVisibleLimit',
                    Number(event.target.value)
                  )
                }
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SettingToggleCard
                title="Esconder detalhes das séries"
                description="Ao iniciar treino, os exercícios podem começar com as séries recolhidas."
                active={settings.collapseSeriesByDefault}
                onChange={(value) =>
                  handleUpdateSetting('collapseSeriesByDefault', value)
                }
              />

              <SettingToggleCard
                title="Minimizar “Meus Treinos”"
                description="A página Treinos abre com a lista de treinos recolhida."
                active={settings.collapseWorkoutsByDefault}
                onChange={(value) =>
                  handleUpdateSetting('collapseWorkoutsByDefault', value)
                }
              />

              <SettingToggleCard
                title="Salvar treino automaticamente"
                description="Mantém um rascunho enquanto você monta ou edita uma rotina."
                active={settings.autoSaveWorkout}
                onChange={(value) =>
                  handleUpdateSetting('autoSaveWorkout', value)
                }
              />

              <SettingToggleCard
                title="Confirmar antes de finalizar"
                description="Abre uma confirmação antes de salvar o treino no histórico."
                active={settings.confirmBeforeFinishWorkout}
                onChange={(value) =>
                  handleUpdateSetting('confirmBeforeFinishWorkout', value)
                }
              />

              <SettingToggleCard
                title="Confirmar antes de cancelar"
                description="Pede confirmação antes de descartar uma sessão ativa."
                active={settings.confirmBeforeCancelWorkout}
                onChange={(value) =>
                  handleUpdateSetting('confirmBeforeCancelWorkout', value)
                }
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={FileJson}
              title="Backup e exportação"
              description="Exporte seus dados do ForgeFlow, importe um backup JSON e baixe seu histórico em formatos úteis."
            />

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button
                type="button"
                onClick={handleExportJson}
                disabled={Boolean(exportingType)}
              >
                <Download size={17} />
                {exportingType === 'json' ? 'Exportando...' : 'Exportar backup JSON'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleExportCsv}
                disabled={Boolean(exportingType)}
              >
                <FileSpreadsheet size={17} />
                {exportingType === 'csv' ? 'Exportando...' : 'Exportar histórico CSV/Excel'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={handleExportPdf}
                disabled={Boolean(exportingType)}
              >
                <FileText size={17} />
                {exportingType === 'pdf' ? 'Exportando...' : 'Exportar relatório PDF'}
              </Button>

              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-5 text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
                <FileJson size={17} />
                Importar backup JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm font-bold text-yellow-300">
                Importação em modo adicionar
              </p>

              <p className="mt-1 text-xs leading-relaxed text-yellow-100/75">
                Por segurança, o backup importado adiciona dados à sua conta sem apagar os dados atuais.
                Depois podemos criar uma opção separada para substituir tudo.
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={SlidersHorizontal}
              title={user?.hasPassword ? 'Alterar senha' : 'Criar senha de acesso'}
              description={
                user?.hasPassword
                  ? 'Atualize sua senha usada no login tradicional.'
                  : 'Sua conta foi criada com Google. Crie uma senha para também entrar usando e-mail e senha.'
              }
            />

            <form onSubmit={handleSetPassword} className="mt-6 space-y-4">
              {user?.hasPassword && (
                <Input
                  label="Senha atual"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                  placeholder="Digite sua senha atual"
                />
              )}

              <Input
                label="Nova senha"
                type="password"
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                placeholder="Mínimo 6 caracteres"
              />

              <Input
                label="Confirmar nova senha"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
                placeholder="Repita a nova senha"
              />

              <Button type="submit" disabled={savingPassword} className="w-full sm:w-auto">
                {savingPassword
                  ? 'Salvando...'
                  : user?.hasPassword
                    ? 'Alterar senha'
                    : 'Criar senha'}
              </Button>
            </form>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <SectionTitle
              icon={AlertTriangle}
              title="Área de risco"
              description="Use apenas quando quiser voltar as preferências para o padrão."
            />

            <div className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
                Status
              </p>

              <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                {syncBadgeText}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
                Alterações visuais são aplicadas imediatamente e sincronizadas com a conta em seguida.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleResetSettings}
              className="mt-5 w-full"
            >
              <RotateCcw size={17} />
              Restaurar configurações padrão
            </Button>
          </Card>
        </aside>
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
