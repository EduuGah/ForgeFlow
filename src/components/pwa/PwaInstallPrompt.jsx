import { useEffect, useMemo, useState } from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'

import ForgeFlowIcon from '../brand/ForgeFlowIcon'
import Button from '../ui/Button'
import Card from '../ui/Card'

const DISMISS_KEY = 'forgeflow:pwa-install-dismissed-at'
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

  const sevenDays = 7 * 24 * 60 * 60 * 1000

  return Date.now() - dismissedAt < sevenDays
}

function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)

  const isIos = useMemo(() => isIosDevice(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    if (isStandaloneMode()) {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      return undefined
    }

    if (window.localStorage.getItem(INSTALLED_KEY) === 'true') {
      return undefined
    }

    if (wasDismissedRecently()) {
      return undefined
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setInstallPrompt(event)
      setIsVisible(true)
    }

    function handleAppInstalled() {
      window.localStorage.setItem(INSTALLED_KEY, 'true')
      setIsVisible(false)
      setInstallPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    if (isIos) {
      const timeoutId = window.setTimeout(() => {
        if (!isStandaloneMode() && !wasDismissedRecently()) {
          setShowIosHelp(true)
          setIsVisible(true)
        }
      }, 1500)

      return () => {
        window.clearTimeout(timeoutId)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isIos])

  async function handleInstall() {
    if (!installPrompt) {
      setShowIosHelp(true)
      return
    }

    try {
      await installPrompt.prompt()

      const choice = await installPrompt.userChoice

      if (choice?.outcome === 'accepted') {
        window.localStorage.setItem(INSTALLED_KEY, 'true')
        setIsVisible(false)
      } else {
        handleDismiss()
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error(error)
      setShowIosHelp(true)
    }
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[90] lg:bottom-5 lg:left-auto lg:right-5 lg:w-[390px]">
      <Card className="pointer-events-auto overflow-hidden border border-[var(--ff-accent-border)] bg-[var(--ff-card)] p-0 shadow-2xl shadow-[var(--ff-shadow-card)]">
        <div className="relative p-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            aria-label="Fechar instalação"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
              <ForgeFlowIcon size="100%" className="ff-brand-app-icon--soft" />
            </div>

            <div className="min-w-0">
              <p className="text-base font-black leading-tight text-[var(--ff-text)]">
                Instalar ForgeFlow
              </p>

              <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                Abra como app, com ícone na tela inicial e experiência mais rápida no treino.
              </p>
            </div>
          </div>

          {showIosHelp ? (
            <div className="mt-4 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-sm leading-relaxed text-[var(--ff-muted)]">
              <div className="flex items-start gap-2">
                <Share size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />

                <p>
                  No iPhone, toque em <strong className="text-[var(--ff-text)]">Compartilhar</strong> e depois em{' '}
                  <strong className="text-[var(--ff-text)]">Adicionar à Tela de Início</strong>.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={handleInstall}
              className="w-full"
            >
              {installPrompt ? <Download size={17} /> : <Smartphone size={17} />}
              {installPrompt ? 'Instalar agora' : 'Como instalar'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleDismiss}
              className="w-full"
            >
              Depois
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PwaInstallPrompt
