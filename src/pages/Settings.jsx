import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Database,
  Download,
  Palette,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserRound,
  Wifi,
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

function getStorageSize(key) {
  const value = localStorage.getItem(key)

  if (!value) return 0

  return new Blob([value]).size
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`
}

function ToggleSetting({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'h-8 w-14 rounded-full bg-[var(--ff-accent)] p-1 transition'
          : 'h-8 w-14 rounded-full bg-zinc-800 p-1 transition'
      }
    >
      <span
        className={
          active
            ? 'block h-6 w-6 translate-x-6 rounded-full bg-white transition'
            : 'block h-6 w-6 rounded-full bg-white transition'
        }
      />
    </button>
  )
}

function SettingBox({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-bold">
            {title}
          </p>

          {description && (
            <p className="mt-1 text-sm text-zinc-500">
              {description}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}

function Settings() {
  const fileInputRef = useRef(null)

  const [settings, setSettings] = useState(defaultSettings)
  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setSettings(getAppSettings())
  }, [])

  const savedData = STORAGE_KEYS.map((key) => {
    const value = localStorage.getItem(key)

    return {
      key,
      exists: Boolean(value),
      size: getStorageSize(key),
    }
  })

  const totalSize = savedData.reduce((total, item) => total + item.size, 0)

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
        description="Controle aparência, treino, dados e informações da conta."
        action={
          <Badge variant="purple">
            {formatBytes(totalSize)}
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <Palette size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Aparência
                </h2>

                <p className="text-sm text-zinc-500">
                  Personalize o visual e comportamento da interface.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <SettingBox
                title="Modo compacto no celular"
                description="Reduz espaçamentos e deixa os cards mais compactos em telas pequenas."
              >
                <ToggleSetting
                  active={settings.compactMobile}
                  onClick={() =>
                    handleUpdateSetting('compactMobile', !settings.compactMobile)
                  }
                />
              </SettingBox>

              <SettingBox
                title="Mini treino flutuante"
                description="Mostra um card flutuante quando há treino ativo."
              >
                <ToggleSetting
                  active={settings.showActiveWorkoutMini}
                  onClick={() =>
                    handleUpdateSetting(
                      'showActiveWorkoutMini',
                      !settings.showActiveWorkoutMini
                    )
                  }
                />
              </SettingBox>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <SlidersHorizontal size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Treino
                </h2>

                <p className="text-sm text-zinc-500">
                  Configure padrões usados na criação e execução dos treinos.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Descanso padrão entre séries"
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

              <Select
                label="Unidade de peso"
                value={settings.weightUnit}
                onChange={(event) =>
                  handleUpdateSetting('weightUnit', event.target.value)
                }
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </Select>

              <Input
                label="Treinos visíveis inicialmente"
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

              <SettingBox
                title="Esconder detalhes das séries por padrão"
                description="Ao iniciar treino, os exercícios podem começar com as séries recolhidas."
              >
                <ToggleSetting
                  active={settings.collapseSeriesByDefault}
                  onClick={() =>
                    handleUpdateSetting(
                      'collapseSeriesByDefault',
                      !settings.collapseSeriesByDefault
                    )
                  }
                />
              </SettingBox>

              <SettingBox
                title="Minimizar “Meus Treinos” por padrão"
                description="A página Treinos abre com a lista de treinos recolhida."
              >
                <ToggleSetting
                  active={settings.collapseWorkoutsByDefault}
                  onClick={() =>
                    handleUpdateSetting(
                      'collapseWorkoutsByDefault',
                      !settings.collapseWorkoutsByDefault
                    )
                  }
                />
              </SettingBox>

              <SettingBox
                title="Salvar treino automaticamente"
                description="Mantém um rascunho enquanto você monta ou edita uma rotina."
              >
                <ToggleSetting
                  active={settings.autoSaveWorkout}
                  onClick={() =>
                    handleUpdateSetting('autoSaveWorkout', !settings.autoSaveWorkout)
                  }
                />
              </SettingBox>

              <SettingBox
                title="Abrir calendário automaticamente"
                description="Campos de data abrem o calendário ao clicar."
              >
                <ToggleSetting
                  active={settings.autoOpenCalendar}
                  onClick={() =>
                    handleUpdateSetting(
                      'autoOpenCalendar',
                      !settings.autoOpenCalendar
                    )
                  }
                />
              </SettingBox>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <Database size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Dados
                </h2>

                <p className="text-sm text-zinc-500">
                  Backup, importação e futura sincronização com banco de dados.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleExportBackup}
                className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-left transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[#18181b]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] transition group-hover:shadow-[0_0_20px_var(--ff-accent-shadow)]">
                    <Download size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold">
                      Exportar dados do app
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Baixa um arquivo JSON com seus dados.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleImportClick}
                className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-left transition hover:border-[var(--ff-accent-border)]/40 hover:bg-[#18181b]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)] transition group-hover:shadow-[0_0_20px_var(--ff-accent-shadow)]">
                    <Upload size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold">
                      Importar backup
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Restaura dados de um arquivo JSON.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleClearAllData}
                className="group rounded-3xl border border-red-500/20 bg-red-500/5 p-5 text-left transition hover:border-red-400/40 hover:bg-red-500/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                    <Trash2 size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold text-red-300">
                      Limpar dados locais
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Apaga todos os dados salvos neste navegador.
                    </p>
                  </div>
                </div>
              </button>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                    <Wifi size={24} />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">
                        Sincronizar com banco de dados
                      </h3>

                      <Badge variant="purple">
                        Em breve
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-zinc-500">
                      Preparado para MongoDB/API quando iniciarmos o backend.
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

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <UserRound size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Conta
                </h2>

                <p className="text-sm text-zinc-500">
                  Informações básicas do usuário.
                </p>
              </div>
            </div>

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
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ff-accent-soft)]/10 text-[var(--ff-accent-text)]">
                <ShieldCheck size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Armazenamento
                </h2>

                <p className="text-sm text-zinc-500">
                  Dados locais do navegador.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">
                Total usado
              </p>

              <p className="mt-1 text-2xl font-black text-[var(--ff-accent-text)]">
                {formatBytes(totalSize)}
              </p>
            </div>

            <div className="mt-5 space-y-2">
              {savedData.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">
                      {item.key}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {formatBytes(item.size)}
                    </p>
                  </div>

                  <Badge variant={item.exists ? 'purple' : 'default'}>
                    {item.exists ? 'Salvo' : 'Vazio'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Atenção
                </h2>

                <p className="text-sm text-zinc-500">
                  Algumas configurações já salvam, mas serão aplicadas no app aos poucos.
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
    </>
  )
}

export default Settings