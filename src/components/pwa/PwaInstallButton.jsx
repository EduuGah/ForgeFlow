import { useEffect, useMemo, useState } from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'

import forgeflowIcon from '../../assets/forgeflow-icon.png'

const DISMISS_KEY = 'forgeflow:pwa-install-card-dismissed-at'
const INSTALLED_KEY = 'forgeflow:pwa-installed'

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

function wasDismissedRecently() {
  if (typeof window === 'undefined') return true

  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0)

  if (!dismissedAt) return false

  const threeDays = 3 * 24 * 60 * 60 * 1000

  return Date.now() - dismissedAt < threeDays
}

function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [hidden, setHidden] = useState(false)
  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (isStandaloneMode()) {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      setHidden(true)
      return undefined
    }

    if (window.localStorage.getItem(INSTALLED_KEY) === 'true') {
      setHidden(true)
      return undefined
    }

    if (wasDismissedRecently()) {
      setHidden(true)
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
      setHidden(false)
    }

    function handleAppInstalled() {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      setHidden(true)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!installPrompt) {
      setShowHelp((current) => !current)
      return
    }

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice?.outcome === 'accepted') {
        window.localStorage.setItem(INSTALLED_KEY, 'true')
        setHidden(true)
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error(error)
      setShowHelp(true)
    }
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setHidden(true)
  }

  if (hidden) return null

  return (
    <div className="fixed bottom-[calc(5.6rem+env(safe-area-inset-bottom))] right-3 z-[70] w-[calc(100vw-1.5rem)] max-w-sm lg:bottom-5 lg:right-5">
      <div className="overflow-hidden rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-card)] shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="relative p-4">
          <button
            type="button"
            onClick={handleDismiss}
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
                Instalar APP
              </p>

              <p className="mt-1 text-xs leading-relaxed text-[var(--ff-muted)]">
                Adicione o ForgeFlow à tela inicial para abrir como aplicativo.
              </p>
            </div>
          </div>

          {showHelp && (
            <div className="mt-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-xs leading-relaxed text-[var(--ff-muted)]">
              {isIos ? (
                <div className="flex gap-2">
                  <Share size={16} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  <p>
                    No iPhone, abra pelo Safari, toque em <strong className="text-[var(--ff-text)]">Compartilhar</strong> e depois em <strong className="text-[var(--ff-text)]">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Smartphone size={16} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  <p>
                    No Chrome, use o menu do navegador e escolha <strong className="text-[var(--ff-text)]">Instalar app</strong> ou <strong className="text-[var(--ff-text)]">Adicionar à tela inicial</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleInstall}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]"
          >
            <Download size={17} />
            {installPrompt ? 'Instalar agora' : 'Instalar APP'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PwaInstallButton
