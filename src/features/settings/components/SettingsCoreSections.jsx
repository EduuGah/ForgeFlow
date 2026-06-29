import {
  AlertTriangle,
  Monitor,
  Moon,
  Palette,
  Search,
  Smartphone,
  Sun,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import TutorialLauncher from '../../../components/tutorial/TutorialLauncher'
import Badge from '../../../components/ui/Badge'
import { accentColors } from '../../../utils/settingsUtils'
import {
  ColorOption,
  SectionTitle,
  SettingToggleCard,
  ThemeOption,
} from './SettingsBaseControls'

export function GooglePasswordNotice({ user }) {
  if (user?.provider !== 'google' || user?.hasPassword) return null

  return (
    <div className="mb-6 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5 text-amber-100 shadow-lg shadow-amber-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
          <AlertTriangle size={22} />
        </div>

        <div className="flex-1">
          <h2 className="text-base font-black text-amber-100">
            Crie uma senha para acessar sua conta também pelo login tradicional
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-amber-100/75">
            Sua conta foi criada usando o Google. Para entrar com e-mail e senha no futuro,
            defina uma senha de acesso abaixo.
          </p>
        </div>
      </div>
    </div>
  )
}


export function SettingsTutorialSection() {
  return (
    <Card data-tutorial="settings-tutorial-card">
      <TutorialLauncher />
    </Card>
  )
}


export function SettingsMaintenanceSection({ onClearPwaCache }) {
  return (
    <Card>
      <SectionTitle
        icon={Smartphone}
        title="Manutenção do app"
        description="Ferramentas úteis para quando o ForgeFlow estiver instalado como aplicativo."
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:show-install-app'))}
          className="flex h-12 items-center justify-center rounded-2xl bg-[var(--ff-accent)] px-4 text-sm font-black text-white shadow-[0_0_18px_var(--ff-accent-shadow)]"
        >
          Ver instalação
        </button>

        <button
          type="button"
          onClick={onClearPwaCache}
          className="flex h-12 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-black text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
        >
          Limpar cache do app
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--ff-muted)]">
        Use a limpeza de cache quando o celular continuar mostrando uma versão antiga após uma atualização.
      </p>
    </Card>
  )
}


export function SettingsAppearanceSection({
  settings,
  currentAccent,
  colorSearch,
  onColorSearchChange,
  visibleAccentColors,
  pendingSettingKey,
  onUpdateSetting,
}) {
  return (
    <Card data-tutorial="settings-theme">
      <SectionTitle
        icon={Palette}
        title="Aparência"
        description="Escolha o tema e personalize a cor principal do ForgeFlow."
      />

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <ThemeOption
          icon={Moon}
          title="Escuro"
          description="Visual padrão, com fundo preto e contraste alto."
          active={settings.themeMode === 'dark'}
          onClick={() => onUpdateSetting('themeMode', 'dark')}
        />

        <ThemeOption
          icon={Sun}
          title="Claro"
          description="Fundo claro para usar melhor durante o dia."
          active={settings.themeMode === 'light'}
          onClick={() => onUpdateSetting('themeMode', 'light')}
        />

        <ThemeOption
          icon={Monitor}
          title="Sistema"
          description="Segue automaticamente o tema do seu dispositivo."
          active={settings.themeMode === 'system'}
          onClick={() => onUpdateSetting('themeMode', 'system')}
        />
      </div>

      <div className="ff-settings-color-picker mt-8" data-tutorial="settings-accent">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-black text-[var(--ff-text)]">
              Cor principal
            </h3>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Escolha uma cor de destaque para botões, cards e detalhes importantes.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Badge>
              {currentAccent?.name || 'Roxo'}
            </Badge>

            <div className="flex h-11 min-w-[230px] items-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3">
              <Search size={16} className="text-[var(--ff-muted)]" />
              <input
                type="search"
                value={colorSearch}
                onChange={(event) => onColorSearchChange(event.target.value)}
                placeholder="Buscar cor..."
                className="w-full bg-transparent text-sm font-bold text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-5">
          {visibleAccentColors.map((group) => (
            <div
              key={group.title}
              className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-muted)]">
                  {group.title}
                </p>

                <span className="text-xs font-bold text-[var(--ff-muted)]">
                  {group.keys.length} cor(es)
                </span>
              </div>

              {group.keys.length === 0 ? (
                <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] p-3 text-sm text-[var(--ff-muted)]">
                  Nenhuma cor encontrada.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {group.keys.map((key) => {
                    const color = accentColors[key]

                    if (!color) return null

                    return (
                      <ColorOption
                        key={`${group.title}-${key}`}
                        colorKey={key}
                        color={color}
                        active={settings.accentColor === key}
                        onClick={() => onUpdateSetting('accentColor', key)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-[var(--ff-accent-border)]/30 bg-[var(--ff-accent-soft)] p-4">
          <p className="text-sm font-black text-[var(--ff-text)]">
            Visual do ForgeFlow
          </p>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            A cor escolhida é aplicada nos destaques para manter o app com sua identidade.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-black text-[var(--ff-text)]">
              Prévia
            </p>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Veja como botões e detalhes ficam com sua cor atual.
            </p>
          </div>

          {pendingSettingKey === 'accentColor' && (
            <Badge>Aplicando cor...</Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--ff-accent)] px-3 py-1 text-xs font-black text-white">
            Botão principal
          </span>

          <span className="rounded-full border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] px-3 py-1 text-xs font-black text-[var(--ff-accent-text)]">
            Destaque
          </span>

          <span className="rounded-full border border-[var(--ff-border)] bg-[var(--ff-surface)] px-3 py-1 text-xs font-black text-[var(--ff-muted)]">
            Superfície
          </span>
        </div>
      </div>

      <div className="mt-5" data-tutorial="settings-simple-mode">
        <SettingToggleCard
          title="Modo compacto no celular"
          description="Reduz espaçamentos e deixa os cards mais compactos em telas pequenas."
          active={settings.compactMobile}
          onChange={(value) => onUpdateSetting('compactMobile', value)}
        />
      </div>
    </Card>
  )
}
