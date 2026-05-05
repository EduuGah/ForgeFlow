import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Check,
  Database,
  Download,
  HardDrive,
  Palette,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserRound,
  Wifi,
  X,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'

import {
  accentColors,
  defaultSettings,
  getAppSettings,
  saveAppSettings,
} from '../utils/settingsUtils'

const STORAGE_KEYS = [
  'forgeflow:settings',
  'forgeflow:profile',
  'forgeflow:bodyweight',
  'forgeflow:exercises',
  'forgeflow:workouts',
  'forgeflow:folders',
  'forgeflow:set-models',
  'forgeflow:history',
  'forgeflow:active-session',
  'forgeflow:workout-draft',
]

const STORAGE_LABELS = {
  'forgeflow:settings': 'Configurações',
  'forgeflow:profile': 'Perfil',
  'forgeflow:bodyweight': 'Peso corporal',
  'forgeflow:exercises': 'Exercícios',
  'forgeflow:workouts': 'Treinos',
  'forgeflow:folders': 'Pastas',
  'forgeflow:set-models': 'Modelos de séries',
  'forgeflow:history': 'Histórico',
  'forgeflow:active-session': 'Sessão ativa',
  'forgeflow:workout-draft': 'Rascunho de treino',
}

function getStorageSize(key) {
  const value = localStorage.getItem(key)

  if (!value) return 0

  return new Blob([value]).size
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  )

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_22px_var(--ff-accent-shadow)]/20">
        <Icon size={23} />
      </div>

      <div>
        <h2 className="text-xl font-black tracking-tight text-zinc-50">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">
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
        'focus:outline-none focus:ring-2 focus:ring-[var(--ff-accent)]/50 focus:ring-offset-2 focus:ring-offset-zinc-950',
        isActive
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_20px_var(--ff-accent-shadow)]/25'
          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
          isActive
            ? 'translate-x-[72px] bg-[var(--ff-accent)] text-white'
            : 'translate-x-0 bg-zinc-700 text-zinc-300',
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
          ? 'border-[var(--ff-accent-border)]/60 bg-[var(--ff-accent-soft)]/20 shadow-[0_0_26px_var(--ff-accent-shadow)]/15'
          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/70',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={[
                'h-2.5 w-2.5 rounded-full transition',
                isActive ? 'bg-[var(--ff-accent)]' : 'bg-zinc-700',
              ].join(' ')}
            />

            <p className="font-bold text-zinc-100">
              {title}
            </p>
          </div>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
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

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'default',
  badge,
}) {
  const isDanger = variant === 'danger'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5',
        isDanger
          ? 'border-red-500/20 bg-red-500/5 hover:border-red-400/40 hover:bg-red-500/10'
          : 'border-zinc-800 bg-zinc-950 hover:border-[var(--ff-accent-border)]/40 hover:bg-zinc-900/70',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        <div
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition',
            isDanger
              ? 'bg-red-500/10 text-red-400'
              : 'bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] group-hover:shadow-[0_0_20px_var(--ff-accent-shadow)]/25',
          ].join(' ')}
        >
          <Icon size={23} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={[
                'font-black',
                isDanger ? 'text-red-300' : 'text-zinc-100',
              ].join(' ')}
            >
              {title}
            </h3>

            {badge}
          </div>

          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

function Settings() {
  const fileInputRef = useRef(null)

  const [settings, setSettings] = useState(defaultSettings)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [storageRefreshKey, setStorageRefreshKey] = useState(0)

  useEffect(() => {
    setSettings(getAppSettings())
  }, [])

  const savedData = STORAGE_KEYS.map((key) => {
    const value = localStorage.getItem(key)

    return {
      key,
      label: STORAGE_LABELS[key] || key,
      exists: Boolean(value),
      size: getStorageSize(key),
    }
  })

  const totalSize = savedData.reduce((total, item) => total + item.size, 0)
  const usedItems = savedData.filter((item) => item.exists).length

  function refreshStorageInfo() {
    setStorageRefreshKey((current) => current + 1)
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

  function handleUpdateSetting(key, value) {
    const updatedSettings = {
      ...settings,
      [key]: value,
    }

    setSettings(updatedSettings)
    saveAppSettings(updatedSettings)
    refreshStorageInfo()

    showToast('success', 'Configuração salva', 'A preferência foi atualizada.')
  }

  function handleResetSettings() {
    setConfirmModal({
      title: 'Restaurar configurações?',
      description:
        'As preferências do app voltarão para o padrão, mas seus treinos, exercícios e histórico não serão apagados.',
      confirmText: 'Restaurar',
      variant: 'danger',
      onConfirm: () => {
        setSettings(defaultSettings)
        saveAppSettings(defaultSettings)
        refreshStorageInfo()
        setConfirmModal(null)

        showToast(
          'success',
          'Configurações restauradas',
          'As preferências voltaram ao padrão.'
        )
      },
    })
  }

  function handleExportBackup() {
    const backup = {
      app: 'ForgeFlow',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {},
    }

    STORAGE_KEYS.forEach((key) => {
      const value = localStorage.getItem(key)

      if (value) {
        try {
          backup.data[key] = JSON.parse(value)
        } catch {
          backup.data[key] = value
        }
      }
    })

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)

    link.href = url
    link.download = `forgeflow-backup-${date}.json`
    link.click()

    URL.revokeObjectURL(url)

    showToast(
      'success',
      'Backup exportado',
      'O arquivo JSON foi baixado com sucesso.'
    )
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportBackup(event) {
    const file = event.target.files?.[0]

    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result)

        if (!backup?.data) {
          showToast('error', 'Arquivo inválido', 'Não encontrei dados de backup.')
          return
        }

        Object.entries(backup.data).forEach(([key, value]) => {
          if (!STORAGE_KEYS.includes(key)) return

          localStorage.setItem(key, JSON.stringify(value))
        })

        refreshStorageInfo()

        showToast(
          'success',
          'Backup importado',
          'Recarregue a página para ver os dados.'
        )
      } catch {
        showToast(
          'error',
          'Erro ao importar',
          'Verifique se o arquivo é um JSON válido.'
        )
      }
    }

    reader.readAsText(file)
    event.target.value = ''
  }

  function handleClearAllData() {
    setConfirmModal({
      title: 'Apagar todos os dados?',
      description:
        'Isso apaga perfil, treinos, exercícios, histórico, pastas, modelos e sessão ativa. Essa ação não pode ser desfeita.',
      confirmText: 'Apagar tudo',
      variant: 'danger',
      onConfirm: () => {
        STORAGE_KEYS.forEach((key) => {
          localStorage.removeItem(key)
        })

        refreshStorageInfo()
        setConfirmModal(null)

        showToast(
          'success',
          'Dados apagados',
          'Todos os dados locais foram removidos.'
        )

        setTimeout(() => {
          window.location.reload()
        }, 700)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Controle aparência, preferências de treino, dados locais e informações da conta."
        action={
          <div className="flex items-center gap-2">
            <Badge variant="purple">
              {formatBytes(totalSize)}
            </Badge>

            <Badge variant="default">
              {usedItems}/{STORAGE_KEYS.length} ativos
            </Badge>
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <SectionTitle
              icon={Palette}
              title="Aparência"
              description="Ajuste o visual do ForgeFlow para deixar o app mais confortável no dia a dia."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Tema"
                value={settings.themeMode}
                onChange={(event) =>
                  handleUpdateSetting('themeMode', event.target.value)
                }
              >
                <option value="dark">Escuro</option>
                <option value="purple">Roxo</option>
                <option value="auto">Automático</option>
              </Select>

              <Select
                label="Cor principal do app"
                value={settings.accentColor}
                onChange={(event) =>
                  handleUpdateSetting('accentColor', event.target.value)
                }
              >
                {Object.entries(accentColors).map(([key, color]) => (
                  <option key={key} value={key}>
                    {color.name}
                  </option>
                ))}
              </Select>

              <div className="md:col-span-2">
                <SettingToggleCard
                  title="Modo compacto no celular"
                  description="Reduz espaçamentos e deixa os cards mais compactos em telas pequenas."
                  active={settings.compactMobile}
                  onChange={(value) =>
                    handleUpdateSetting('compactMobile', value)
                  }
                />
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={SlidersHorizontal}
              title="Preferências de treino"
              description="Defina como os treinos, séries, comparações e confirmações devem se comportar."
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
                title="Abrir calendário automaticamente"
                description="Campos de data abrem o calendário ao clicar."
                active={settings.autoOpenCalendar}
                onChange={(value) =>
                  handleUpdateSetting('autoOpenCalendar', value)
                }
              />

              <SettingToggleCard
                title="Iniciar descanso automaticamente"
                description="Quando uma série for concluída, o timer de descanso inicia sozinho."
                active={settings.autoStartRestTimer}
                onChange={(value) =>
                  handleUpdateSetting('autoStartRestTimer', value)
                }
              />

              <SettingToggleCard
                title="Mostrar PRs durante o treino"
                description="Exibe tags de PR de peso e volume enquanto o treino está ativo."
                active={settings.showPRDuringWorkout}
                onChange={(value) =>
                  handleUpdateSetting('showPRDuringWorkout', value)
                }
              />

              <SettingToggleCard
                title="Comparar com último treino"
                description="Mostra diferenças de peso, reps e volume em relação ao último treino."
                active={settings.showLastWorkoutComparison}
                onChange={(value) =>
                  handleUpdateSetting('showLastWorkoutComparison', value)
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
              icon={Database}
              title="Dados e backup"
              description="Faça backup, importe dados e gerencie o armazenamento local do navegador."
            />

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <ActionCard
                icon={Download}
                title="Exportar dados"
                description="Baixa um arquivo JSON com configurações, treinos, exercícios e histórico."
                onClick={handleExportBackup}
              />

              <ActionCard
                icon={Upload}
                title="Importar backup"
                description="Restaura dados usando um arquivo JSON exportado anteriormente."
                onClick={handleImportClick}
              />

              <ActionCard
                icon={Trash2}
                title="Limpar dados locais"
                description="Apaga todos os dados salvos neste navegador. Não pode ser desfeito."
                onClick={handleClearAllData}
                variant="danger"
              />

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)]">
                    <Wifi size={23} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-zinc-100">
                        Sincronizar com banco de dados
                      </h3>

                      <Badge variant="purple">
                        Em breve
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                      Espaço preparado para MongoDB/API quando o backend entrar no projeto.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <SectionTitle
              icon={UserRound}
              title="Conta"
              description="Dados básicos usados para personalizar o app."
            />

            <div className="mt-6 space-y-4">
              <Input
                label="Nome do usuário"
                placeholder="Ex: Carlos Eduardo"
                value={settings.accountName}
                onChange={(event) =>
                  handleUpdateSetting('accountName', event.target.value)
                }
              />

              <Input
                label="Peso corporal atual"
                type="number"
                min="0"
                placeholder="Ex: 72.5"
                value={settings.currentWeight}
                onChange={(event) =>
                  handleUpdateSetting('currentWeight', event.target.value)
                }
              />

              <Select
                label="Meta principal"
                value={settings.mainGoal}
                onChange={(event) =>
                  handleUpdateSetting('mainGoal', event.target.value)
                }
              >
                <option value="">Selecione</option>
                <option value="Hipertrofia">Hipertrofia</option>
                <option value="Força">Força</option>
                <option value="Emagrecimento">Emagrecimento</option>
                <option value="Recomposição corporal">Recomposição corporal</option>
                <option value="Condicionamento">Condicionamento</option>
              </Select>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={ShieldCheck}
              title="Armazenamento"
              description="Resumo dos dados salvos neste navegador."
            />

            <div
              key={storageRefreshKey}
              className="mt-6 rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]/10 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-[var(--ff-accent-text)]">
                  <HardDrive size={21} />
                </div>

                <div>
                  <p className="text-sm text-zinc-500">
                    Total usado
                  </p>

                  <p className="text-2xl font-black text-[var(--ff-accent-text)]">
                    {formatBytes(totalSize)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {savedData.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-100">
                        {item.label}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {item.key}
                      </p>
                    </div>

                    <Badge variant={item.exists ? 'purple' : 'default'}>
                      {item.exists ? 'Salvo' : 'Vazio'}
                    </Badge>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-[var(--ff-accent)]"
                      style={{
                        width:
                          totalSize > 0
                            ? `${Math.max((item.size / totalSize) * 100, item.exists ? 4 : 0)}%`
                            : '0%',
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-zinc-500">
                    {formatBytes(item.size)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle size={23} />
              </div>

              <div>
                <h2 className="text-xl font-black text-zinc-50">
                  Área de risco
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  Use apenas quando quiser voltar as preferências para o padrão.
                </p>
              </div>
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