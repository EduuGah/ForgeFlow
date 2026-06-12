import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  PlayCircle,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react'

import { useTutorial } from '../../context/TutorialContext'

function getFirstMatchingElement(selector = '') {
  if (!selector || typeof document === 'undefined') return null

  const selectors = selector
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  for (const item of selectors) {
    const element = document.querySelector(item)
    if (element) return element
  }

  return null
}

function useTargetRect(step) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!step?.selector) {
      setRect(null)
      return undefined
    }

    let rafId = 0
    let timeoutId = 0

    function updateRect() {
      const element = getFirstMatchingElement(step.selector)

      if (!element) {
        setRect(null)
        return
      }

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      })

      rafId = window.requestAnimationFrame(() => {
        const nextRect = element.getBoundingClientRect()
        setRect({
          top: Math.max(8, nextRect.top),
          left: Math.max(8, nextRect.left),
          width: Math.max(0, nextRect.width),
          height: Math.max(0, nextRect.height),
        })
      })
    }

    timeoutId = window.setTimeout(updateRect, 240)

    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, { passive: true })

    return () => {
      window.clearTimeout(timeoutId)
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [step?.route, step?.selector])

  return rect
}

function TutorialProgress({ current, total }) {
  const percent = total ? Math.round(((current + 1) / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-[var(--ff-muted)]">
        <span>
          Etapa {current + 1} de {total}
        </span>

        <span>{percent}%</span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--ff-surface-3)]">
        <div
          className="h-full rounded-full bg-[var(--ff-accent)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function WelcomePrompt() {
  const {
    canShowTutorial,
    closeWelcomePrompt,
    startTutorial,
    welcomePromptVisible,
  } = useTutorial()

  if (!canShowTutorial || !welcomePromptVisible) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0">
      <div className="ff-tutorial-card w-full max-w-lg rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 text-[var(--ff-text)] shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_22px_var(--ff-accent-shadow)]">
              <Sparkles size={23} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
                Tutorial guiado
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Bem-vindo ao ForgeFlow
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                Quer fazer um tour rápido pelo app? Você pode pular etapas, encerrar o tutorial inteiro e rever depois em Configurações ou no botão de ajuda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => closeWelcomePrompt()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            aria-label="Fechar tutorial"
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => startTutorial('welcome')}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white shadow-[0_0_20px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)] sm:col-span-2"
          >
            Começar tutorial
            <ArrowRight size={17} />
          </button>

          <button
            type="button"
            onClick={() => closeWelcomePrompt()}
            className="flex h-12 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
          >
            Não mostrar agora
          </button>
        </div>

        <button
          type="button"
          onClick={() => closeWelcomePrompt({ dontShowAgain: true })}
          className="mt-3 w-full rounded-2xl px-4 py-2 text-xs font-bold text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
        >
          Não mostrar novamente
        </button>
      </div>
    </div>
  )
}

function TutorialSpotlight({ rect }) {
  if (!rect) return null

  const padding = 8

  return (
    <div
      className="pointer-events-none fixed z-[92] rounded-[1.5rem] border-2 border-[var(--ff-accent-border)] shadow-[0_0_26px_var(--ff-accent-shadow)] transition-all duration-200"
      style={{
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }}
    />
  )
}

function TutorialArrow({ rect }) {
  if (!rect) return null

  return (
    <div
      className="pointer-events-none fixed z-[93] hidden items-center gap-2 rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent)] px-3 py-2 text-xs font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] md:flex"
      style={{
        left: Math.min((typeof window !== 'undefined' ? window.innerWidth : 1200) - 190, Math.max(18, rect.left + rect.width + 14)),
        top: Math.min((typeof window !== 'undefined' ? window.innerHeight : 800) - 64, Math.max(18, rect.top + rect.height / 2 - 20)),
      }}
      aria-hidden="true"
    >
      <ArrowLeft size={15} />
      Veja aqui
    </div>
  )
}

function TutorialOverlay() {
  const {
    activeFlow,
    activeStep,
    activeStepIndex,
    canShowTutorial,
    completeTutorial,
    isRunning,
    nextStep,
    previousStep,
    skipStep,
    skipTutorial,
  } = useTutorial()

  const targetRect = useTargetRect(activeStep)

  if (!canShowTutorial || !isRunning || !activeFlow || !activeStep) return null

  const isLast = activeStepIndex >= activeFlow.steps.length - 1

  return (
    <div className="pointer-events-none fixed inset-0 z-[91]">
      <TutorialSpotlight rect={targetRect} />
      <TutorialArrow rect={targetRect} />

      <aside className="ff-tutorial-side-panel pointer-events-auto fixed bottom-0 left-0 right-0 z-[94] max-h-[78dvh] overflow-y-auto rounded-t-[1.6rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-[var(--ff-text)] shadow-2xl md:bottom-auto md:left-auto md:right-4 md:top-[calc(5rem+env(safe-area-inset-top))] md:max-h-[calc(100dvh-6rem)] md:w-[390px] md:rounded-[1.6rem] md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
              <HelpCircle size={21} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
                {activeStep.eyebrow || activeFlow.title}
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight">
                {activeStep.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                {activeStep.description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={skipTutorial}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            aria-label="Pular tutorial"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4">
          <TutorialProgress current={activeStepIndex} total={activeFlow.steps.length} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={previousStep}
            disabled={activeStepIndex === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={15} />
            Voltar
          </button>

          <button
            type="button"
            onClick={isLast ? completeTutorial : nextStep}
            className="flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-3 text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)] transition hover:bg-[var(--ff-accent-hover)]"
          >
            {isLast ? (
              <>
                Concluir
                <CheckCircle2 size={15} />
              </>
            ) : (
              <>
                Próximo
                <ArrowRight size={15} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={skipStep}
            className="flex h-10 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-transparent px-3 text-sm font-bold text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
          >
            Pular etapa
          </button>

          <button
            type="button"
            onClick={skipTutorial}
            className="flex h-10 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 px-3 text-sm font-bold text-red-200 transition hover:bg-red-500/15"
          >
            Pular tudo
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:reset-tutorial'))}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
        >
          <RotateCcw size={14} />
          Reiniciar estado do tutorial
        </button>
      </aside>
    </div>
  )
}

function FloatingTutorialHelp() {
  const {
    currentPageFlow,
    currentPageFlowId,
    canShowTutorial,
    isRunning,
    startTutorial,
    state,
    toggleContextualTips,
  } = useTutorial()

  const [isOpen, setIsOpen] = useState(false)

  if (!canShowTutorial || isRunning || state.contextualTipsEnabled === false) {
    return null
  }

  return (
    <div className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom))] right-4 z-[70] flex flex-col items-end gap-2 lg:bottom-5">
      {isOpen && (
        <div className="ff-tutorial-card w-[min(92vw,340px)] rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-4 text-[var(--ff-text)] shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
            Ajuda desta tela
          </p>

          <h3 className="mt-1 text-lg font-black">
            {currentPageFlow?.title || 'Tutorial'}
          </h3>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            {currentPageFlow?.description || 'Abra um guia rápido para esta área.'}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                startTutorial(currentPageFlowId || 'welcome')
              }}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)]"
            >
              <PlayCircle size={16} />
              Ver tutorial desta tela
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                startTutorial('welcome')
              }}
              className="flex h-11 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text-soft)]"
            >
              Tutorial completo
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                toggleContextualTips()
              }}
              className="rounded-2xl px-4 py-2 text-xs font-bold text-[var(--ff-muted)] transition hover:bg-[var(--ff-surface-2)] hover:text-[var(--ff-text)]"
            >
              Ocultar botão de ajuda
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent)] text-white shadow-[0_0_24px_var(--ff-accent-shadow)] transition hover:scale-105 active:scale-95"
        aria-label="Abrir ajuda"
      >
        {isOpen ? <X size={20} /> : <HelpCircle size={21} />}
      </button>
    </div>
  )
}

function GuidedTutorial() {
  return (
    <>
      <WelcomePrompt />
      <TutorialOverlay />
      <FloatingTutorialHelp />
    </>
  )
}

export default GuidedTutorial
