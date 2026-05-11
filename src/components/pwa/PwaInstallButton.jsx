import { useEffect, useMemo, useState } from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'

import forgeflowIcon from '../../assets/forgeflow-icon.png'

const INSTALLED_KEY = 'forgeflow:pwa-installed'
const PROMPT_SEEN_KEY = 'forgeflow:pwa-install-tip-seen'

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
  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (isStandaloneMode()) {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      setInstalled(true)
      return undefined
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)

      if (!window.localStorage.getItem(PROMPT_SEEN_KEY)) {
        setIsOpen(true)
        window.localStorage.setItem(PROMPT_SEEN_KEY, 'true')
      }
    }

    function handleAppInstalled() {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      setInstalled(true)
      setInstallPrompt(null)
      setIsOpen(false)
    }

    function handleShowInstallApp() {
      setInstalled(false)
      setIsOpen(true)
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
    if (!installPrompt) return

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice?.outcome === 'accepted') {
        window.localStorage.setItem(INSTALLED_KEY, 'true')
        setInstalled(true)
        setIsOpen(false)
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error(error)
    }
  }

  if (installed || !isOpen) return null

  const hasNativePrompt = Boolean(installPrompt)

  return (
    <div className="fixed right-3 top-[calc(4.75rem+env(safe-area-inset-top))] z-[80] w-[calc(100vw-1.5rem)] max-w-sm lg:right-5 lg:top-20">
      <div className="ff-install-app-toast overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)] shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="relative p-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            aria-label="Fechar instalar app"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)]">
              <img src={forgeflowIcon} alt="ForgeFlow" className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--ff-text)]">
                Instalar ForgeFlow
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
                {hasNativePrompt
                  ? 'Instale o app para abrir pela tela inicial.'
                  : isIos
                    ? 'No iPhone, use Safari > Compartilhar > Adicionar à Tela de Início.'
                    : 'Use o menu do Chrome e escolha Instalar app ou Adicionar à tela inicial.'}
              </p>
            </div>
          </div>

          {hasNativePrompt && (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]"
            >
              <Download size={17} />
              Instalar agora
            </button>
          )}

          {!hasNativePrompt && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-xs leading-relaxed text-[var(--ff-muted)]">
              {isIos ? (
                <Share size={16} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
              ) : (
                <Smartphone size={16} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
              )}

              <span>
                O navegador só mostra o instalador quando o PWA está elegível. Esta mensagem não fica presa na tela.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PwaInstallButton
