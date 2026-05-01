import { useRef, useState } from 'react'
import {
  Download,
  Upload,
  Trash2,
  Database,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import ConfirmModal from '../components/ui/ConfirmModal'
import Toast from '../components/ui/Toast'

const STORAGE_KEYS = [
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

function Settings() {
  const fileInputRef = useRef(null)

  const [importStatus, setImportStatus] = useState('')
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const [confirmModal, setConfirmModal] = useState(null)
  const [toast, setToast] = useState(null)

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
    showToast('success', 'Backup exportado', 'O arquivo JSON foi baixado com sucesso.')
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

        showToast('success', 'Backup importado', 'Recarregue a página para ver os dados.')
      } catch {
        showToast('error', 'Erro ao importar', 'Verifique se o arquivo é um JSON válido.')
      }
    }

    reader.readAsText(file)

    event.target.value = ''
  }

  function handleClearAllData() {
    setConfirmModal({
      title: 'Apagar todos os dados?',
      description: 'Isso apaga perfil, treinos, exercícios, histórico, pastas, modelos e sessão ativa. Essa ação não pode ser desfeita.',
      confirmText: 'Apagar tudo',
      variant: 'danger',
      onConfirm: () => {
        STORAGE_KEYS.forEach((key) => {
          localStorage.removeItem(key)
        })

        setConfirmModal(null)
        showToast('success', 'Dados apagados', 'Todos os dados locais foram removidos.')

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
        description="Gerencie backup, importação e dados locais do ForgeFlow."
        action={
          <Badge variant="purple">
            {formatBytes(totalSize)}
          </Badge>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Backup dos dados
              </h2>

              <p className="text-sm text-zinc-500">
                Exporte seus dados para evitar perder treinos, histórico e perfil.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportBackup}
              className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-left transition hover:border-violet-500/40 hover:bg-[#18181b]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 transition group-hover:shadow-[0_0_20px_rgba(139,92,246,0.24)]">
                  <Download size={24} />
                </div>

                <div>
                  <h3 className="font-bold">
                    Exportar backup
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
              className="group rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-left transition hover:border-violet-500/40 hover:bg-[#18181b]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400 transition group-hover:shadow-[0_0_20px_rgba(139,92,246,0.24)]">
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
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportBackup}
            className="hidden"
          />


        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Zona de perigo
              </h2>

              <p className="text-sm text-zinc-500">
                Ações irreversíveis.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-zinc-400">
              Isso apaga perfil, treinos, exercícios, histórico, pastas, modelos e sessão ativa.
            </p>

            <Button
              type="button"
              variant="danger"
              onClick={handleClearAllData}
              className="mt-4 w-full"
            >
              <Trash2 size={17} />
              Limpar todos os dados
            </Button>
          </div>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
              <Database size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                Dados salvos
              </h2>

              <p className="text-sm text-zinc-500">
                Informações armazenadas no localStorage do navegador.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {savedData.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <p className="text-sm font-bold">
                  {item.key}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <Badge variant={item.exists ? 'purple' : 'default'}>
                    {item.exists ? 'Salvo' : 'Vazio'}
                  </Badge>

                  <p className="text-xs text-zinc-500">
                    {formatBytes(item.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
      /><ConfirmModal
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