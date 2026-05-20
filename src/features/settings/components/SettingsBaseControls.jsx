import { Check, X } from 'lucide-react'

export function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="ff-section-title flex items-start gap-3">
      <div className="ff-section-title-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_22px_var(--ff-accent-shadow)]/20">
        <Icon size={23} />
      </div>

      <div className="min-w-0">
        <h2 className="text-xl font-black tracking-tight text-[var(--ff-text)]">
          {title}
        </h2>

        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--ff-muted)]">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}


export function ToggleSwitch({ active, onChange, label, disabled = false }) {
  const isActive = Boolean(active)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        if (!disabled) onChange(!isActive)
      }}
      className={[
        'ff-toggle-switch group inline-flex min-w-[112px] items-center justify-between gap-2 rounded-full border p-1.5 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--ff-accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--ff-bg)]',
        disabled ? 'cursor-not-allowed opacity-60' : '',
        isActive
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_20px_var(--ff-accent-shadow)]/25'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-[var(--ff-muted)] hover:border-[var(--ff-border-strong)] hover:text-[var(--ff-text)]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200',
          isActive
            ? 'translate-x-[72px] bg-[var(--ff-accent)] text-white'
            : 'translate-x-0 bg-[var(--ff-surface-3)] text-[var(--ff-muted)]',
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


export function SettingToggleCard({ title, description, active, onChange, disabled = false }) {
  const isActive = Boolean(active)

  return (
    <div
      role="group"
      aria-label={title}
      className={[
        'ff-setting-toggle-card group flex min-h-[132px] w-full flex-col justify-between rounded-3xl border p-5 text-left transition-all duration-200',
        disabled ? 'opacity-70' : '',
        isActive
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_26px_var(--ff-accent-shadow)]/15'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(!isActive)}
          className="min-w-0 flex-1 text-left focus:outline-none disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            <span
              className={[
                'h-2.5 w-2.5 rounded-full transition',
                isActive ? 'bg-[var(--ff-accent)]' : 'bg-[var(--ff-muted-2)]',
              ].join(' ')}
            />

            <p className="font-bold text-[var(--ff-text)]">
              {title}
            </p>
          </div>

          {description && (
            <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              {description}
            </p>
          )}
        </button>

        <ToggleSwitch
          active={isActive}
          label={title}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
    </div>
  )
}


export function ThemeOption({ icon: Icon, title, description, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-3xl border p-5 text-left transition hover:-translate-y-0.5',
        active
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_26px_var(--ff-accent-shadow)]/20'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-surface)] text-[var(--ff-accent-text)]">
          <Icon size={22} />
        </div>

        {active && (
          <span className="rounded-full bg-[var(--ff-accent)] px-2 py-1 text-xs font-black text-white">
            Atual
          </span>
        )}
      </div>

      <p className="mt-4 font-black text-[var(--ff-text)]">
        {title}
      </p>

      <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
        {description}
      </p>
    </button>
  )
}


export function ColorOption({ colorKey, color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
        active
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)]',
      ].join(' ')}
    >
      <span
        className="h-8 w-8 shrink-0 rounded-full shadow-lg ring-2 ring-white/10"
        style={{
          background: `linear-gradient(135deg, ${color.primary}, ${color.primaryHover})`,
          boxShadow: `0 0 18px ${color.shadow}`,
        }}
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-[var(--ff-text)]">
          {color.name}
        </span>

        <span className="block truncate text-xs text-[var(--ff-muted)]">
          {colorKey}
        </span>
      </span>

      {active && (
        <Check size={18} className="text-[var(--ff-accent-text)]" />
      )}
    </button>
  )
}
