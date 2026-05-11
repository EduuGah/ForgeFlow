import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Download,
  Globe,
  Info,
  MoreVertical,
  Share,
  X,
} from 'lucide-react'

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

function isAndroidDevice() {
  if (typeof window === 'undefined') return false

  return /android/i.test(window.navigator.userAgent || '')
}

function getPwaStatus() {
  if (typeof window === 'undefined') return 'indisponível'

  return window.__FORGEFLOW_PWA_STATUS__ || 'aguardando navegador'
}

function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [pwaStatus, setPwaStatus] = useState(getPwaStatus())
  const isIos = useMemo(() => isIosDevice(), [])
  const isAndroid = useMemo(() => isAndroidDevice(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    function refreshStatus() {
      setInstalled(isStandaloneMode())
      setPwaStatus(getPwaStatus())
    }

    refreshStatus()

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
      refreshStatus()
      setIsOpen(true)
      setStatusMessage('')
    }

    const intervalId = window.setInterval(refreshStatus, 1500)

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('forgeflow:show-install-app', handleShowInstallApp)
    window.addEventListener('forgeflow:pwa-ready', refreshStatus)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('forgeflow:show-install-app', handleShowInstallApp)
      window.removeEventListener('forgeflow:pwa-ready', refreshStatus)
    }
  }, [])

  async function handleInstall() {
    if (installed || isStandaloneMode()) {
      setStatusMessage('O ForgeFlow já está aberto como aplicativo instalado.')
      return
    }

    if (!installPrompt) {
      setStatusMessage(
        'O navegador ainda não liberou o instalador automático. Siga as instruções exibidas nesta janela.'
      )
      return
    }

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice

      if (choice?.outcome === 'accepted') {
        setInstalled(true)
        setIsOpen(false)
        setStatusMessage('')
      } else {
        setStatusMessage(
          'Instalação cancelada. Você ainda pode adicionar manualmente pelo menu do navegador.'
        )
      }

      setInstallPrompt(null)
    } catch (error) {
      console.error(error)
      setStatusMessage(
        'Não foi possível abrir o instalador automático. Siga as instruções exibidas nesta janela.'
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[11000] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-hidden rounded-t-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-text)] shadow-2xl shadow-black/35 sm:rounded-[2rem]">
        <div className="max-h-[92dvh] overflow-y-auto p-5 sm:p-6">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
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
          </div>

          {installed ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm leading-relaxed text-emerald-200">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <p>O ForgeFlow já está aberto como aplicativo instalado.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {installPrompt && (
                <div className="rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4 text-sm leading-relaxed text-[var(--ff-accent-text)]">
                  <div className="flex items-start gap-3">
                    <Download size={18} className="mt-0.5 shrink-0" />
                    <p>O navegador liberou a instalação automática. Toque em <strong>Instalar agora</strong>.</p>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm leading-relaxed text-[var(--ff-muted)]">
                <div className="flex items-start gap-3">
                  {isIos ? (
                    <Share size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  ) : (
                    <Globe size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  )}

                  <div>
                    <p className="font-black text-[var(--ff-text)]">
                      {isIos ? 'Como instalar no iPhone' : isAndroid ? 'Como instalar no Android' : 'Como instalar no navegador'}
                    </p>

                    {isIos ? (
                      <ol className="mt-2 list-decimal space-y-1 pl-4">
                        <li>Abra o ForgeFlow pelo Safari.</li>
                        <li>Toque no botão Compartilhar.</li>
                        <li>Escolha “Adicionar à Tela de Início”.</li>
                        <li>Confirme em “Adicionar”.</li>
                      </ol>
                    ) : (
                      <ol className="mt-2 list-decimal space-y-1 pl-4">
                        <li>Abra o ForgeFlow no Chrome pelo link HTTPS do deploy.</li>
                        <li>Toque no menu de três pontos.</li>
                        <li>Escolha “Instalar app” ou “Adicionar à tela inicial”.</li>
                        <li>Confirme a instalação.</li>
                      </ol>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm leading-relaxed text-[var(--ff-muted)]">
                <div className="flex items-start gap-3">
                  <MoreVertical size={18} className="mt-0.5 shrink-0 text-[var(--ff-accent-text)]" />
                  <p>
                    Se a opção não aparecer no menu, o Chrome ainda não reconheceu o app como PWA instalável. Verifique Manifest e Service Worker em DevTools &gt; Application.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 text-xs leading-relaxed text-[var(--ff-muted)]">
                <p>Status PWA: <strong className="text-[var(--ff-text)]">{pwaStatus}</strong></p>
                <p className="mt-1">Instalador automático: <strong className="text-[var(--ff-text)]">{installPrompt ? 'liberado pelo navegador' : 'ainda não liberado'}</strong></p>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-3 text-sm leading-relaxed text-[var(--ff-accent-text)]">
              <Info size={17} className="mt-0.5 shrink-0" />
              <p>{statusMessage}</p>
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!installed && (
              <button type="button" onClick={handleInstall} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] active:scale-[0.98]">
                <Download size={17} />
                {installPrompt ? 'Instalar agora' : 'Verificar instalação'}
              </button>
            )}

            <button type="button" onClick={() => setIsOpen(false)} className="flex h-12 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-black text-[var(--ff-text-soft)] active:scale-[0.98]">
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PwaInstallButton
