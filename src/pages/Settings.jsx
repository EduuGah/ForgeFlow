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

  const savedData = STORAGE_KEYS.map((key) => {
    const value = localStorage.getItem(key)

    return {
      key,
      exists: Boolean(value),
      size: getStorageSize(key),
    }
  })

  const totalSize = savedData.reduce((total, item) => total + item.size, 0)

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
          setImportStatus('Arquivo inválido. Não encontrei dados de backup.')
          return
        }

        Object.entries(backup.data).forEach(([key, value]) => {
          if (!STORAGE_KEYS.includes(key)) return

          localStorage.setItem(key, JSON.stringify(value))
        })

        setImportStatus('Backup importado com sucesso. Recarregue a página para ver os dados.')
      } catch {
        setImportStatus('Erro ao importar backup. Verifique se o arquivo é um JSON válido.')
      }
    }

    reader.readAsText(file)

    event.target.value = ''
  }

  function handleClearAllData() {
    STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key)
    })

    setClearConfirmOpen(false)
    window.location.reload()
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

          {importStatus && (
            <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <p className="text-sm font-bold text-violet-300">
                {importStatus}
              </p>
            </div>
          )}
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
              onClick={() => setClearConfirmOpen(true)}
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

      {clearConfirmOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121212] p-6 shadow-2xl shadow-red-950/30">
            <p className="text-sm font-bold text-red-400">
              Limpar dados
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Tem certeza?
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Todos os dados do ForgeFlow serão apagados deste navegador. Essa ação não pode ser desfeita.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setClearConfirmOpen(false)}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                onClick={handleClearAllData}
              >
                Apagar tudo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Settings