import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Info, Share, Smartphone, X } from 'lucide-react'

import forgeflowIcon from '../../assets/forgeflow-icon.png'

function isStandaloneMode() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIosDevice() {
  if (typeof window === 'undefined') return false

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '')
}

function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (isStandaloneMode()) {
      setInstalled(true)
      return undefined
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
    }

    function handleAppInstalled() {
      setInstalled(true)
      setInstallPrompt(null)
      setIsOpen(false)
      setStatusMessage('')
    }

    function handleShowInstallApp() {
      setIsOpen(true)
      setStatusMessage('')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('forgeflow:show-install-app', handleShowInstallApp)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('forgeflow:show-install-app', handleShowInstallApp)
    }
  }, [])

  async function handleInstall() {
    if (installed) {
      setStatusMessage('O ForgeFlow já está aberto como aplicativo instalado.')
      return
    }

    if (!installPrompt) {
      setStatusMessage(
        'O navegador ainda não liberou o instalador automático. Use as instruções abaixo para adicionar à tela inicial.'
      )
      return
    }

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice?.outcome === 'accepted') {
        setInstalled(true)
        setIsOpen(false)
      } else {
        setStatusMessage(
          'Instalação cancelada. Você pode tentar novamente pelo botão Instalar APP.'
        )
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error(error)
      setStatusMessage(
        'Não foi possível abrir o instalador automático. Use as instruções abaixo.'
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[11000] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-text)] shadow-2xl shadow-black/35 sm:rounded-[2rem]">
        <div className="relative p-5 sm:p-6">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            aria-label="Fechar instalação"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
              <img src={forgeflowIcon} alt="ForgeFlow" className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0">
              <p className="text-xl font-black leading-tight text-[var(--ff-text)]">
                Instalar ForgeFlow
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                Adicione à tela inicial para abrir o ForgeFlow como aplicativo.
              </p>
            </div>
          </div>

          {installed ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-200">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>O ForgeFlow já parece estar instalado ou aberto em modo aplicativo.</p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm leading-relaxed text-[var(--ff-muted)]">
              {isIos ? (
                <div className="flex items-start gap-3">
                  <Share size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  <p>
                    No iPhone, abra pelo <strong className="text-[var(--ff-text)]">Safari</strong>, toque em <strong className="text-[var(--ff-text)]">Compartilhar</strong> e depois em <strong className="text-[var(--ff-text)]">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Smartphone size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  <p>
                    No Chrome, o botão abaixo tenta abrir o instalador. Se não abrir, use o menu do navegador e escolha <strong className="text-[var(--ff-text)]">Instalar app</strong> ou <strong className="text-[var(--ff-text)]">Adicionar à tela inicial</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-3 text-sm leading-relaxed text-[var(--ff-accent-text)]">
              <Info size={17} className="mt-0.5 shrink-0" />
              <p>{statusMessage}</p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleInstall}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]"
            >
              <Download size={17} />
              {installPrompt ? 'Instalar agora' : 'Verificar instalação'}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-12 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-black text-[var(--ff-text-soft)] active:scale-[0.98]"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwaInstallButton
