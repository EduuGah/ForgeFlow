import {
  AlertTriangle,
  Check,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Monitor,
  Moon,
  Palette,
  PlayCircle,
  RotateCcw,
  RotateCcw as RotateCcwIcon,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sun,
  X,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Select from '../../../components/ui/Select'
import Input from '../../../components/ui/Input'
import { accentColors } from '../../../utils/settingsUtils'

export function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_22px_var(--ff-accent-shadow)]/20">
        <Icon size={23} />
      </div>

      <div>
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

function ToggleSwitch({ active, onChange, label }) {
  const isActive = Boolean(active)

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      onClick={() => onChange(!isActive)}
      className={[
        'group inline-flex min-w-[112px] items-center justify-between gap-2 rounded-full border p-1.5 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--ff-accent)]/50 focus:ring-offset-2 focus:ring-offset-[var(--ff-bg)]',
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

function SettingToggleCard({ title, description, active, onChange }) {
  const isActive = Boolean(active)

  return (
    <button
      type="button"
      onClick={() => onChange(!isActive)}
      className={[
        'group flex min-h-[132px] w-full flex-col justify-between rounded-3xl border p-5 text-left transition-all duration-200',
        'hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--ff-accent)]/40',
        isActive
          ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] shadow-[0_0_26px_var(--ff-accent-shadow)]/15'
          : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-border-strong)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
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
        </div>

        <ToggleSwitch
          active={isActive}
          label={title}
          onChange={onChange}
        />
      </div>
    </button>
  )
}

function ThemeOption({ icon: Icon, title, description, active, onClick }) {
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

function ColorOption({ colorKey, color, active, onClick }) {
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
    <Card>
      <SectionTitle
        icon={HelpCircle}
        title="Tutorial guiado"
        description="Revise o funcionamento do ForgeFlow sempre que quiser."
      />

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:start-tutorial', { detail: { flowId: 'welcome' } }))}
          className="rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-4 text-left transition hover:bg-[var(--ff-accent-soft)]/80"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ff-accent)] text-white">
            <PlayCircle size={21} />
          </div>

          <p className="mt-3 font-black text-[var(--ff-text)]">
            Tutorial completo
          </p>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Tour inicial pelo Dashboard, Treinos, Exercícios, Evolução e Configurações.
          </p>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:start-tutorial', { detail: { flowId: 'workout' } }))}
          className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-left transition hover:border-[var(--ff-accent-border)]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-accent-text)]">
            <Smartphone size={21} />
          </div>

          <p className="mt-3 font-black text-[var(--ff-text)]">
            Treino ativo
          </p>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Guia rápido para registrar séries, aquecimento, descanso e finalização.
          </p>
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:start-tutorial', { detail: { flowId: 'exercises' } }))}
          className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-left transition hover:border-[var(--ff-accent-border)]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-accent-text)]">
            <HelpCircle size={21} />
          </div>

          <p className="mt-3 font-black text-[var(--ff-text)]">
            Biblioteca
          </p>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            Aprenda a pesquisar, filtrar, favoritar e abrir detalhes de exercícios.
          </p>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ['dashboard', 'Dashboard'],
          ['workouts', 'Treinos'],
          ['progress', 'Evolução'],
          ['settings', 'Configurações'],
        ].map(([flowId, label]) => (
          <button
            key={flowId}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:start-tutorial', { detail: { flowId } }))}
            className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 py-2 text-xs font-black text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]"
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('forgeflow:reset-tutorial'))}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)] sm:w-auto sm:px-4"
      >
        <RotateCcwIcon size={16} />
        Resetar tutorial inicial
      </button>
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
    <Card>
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

      <div className="ff-settings-color-picker mt-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-black text-[var(--ff-text)]">
              Cor principal
            </h3>

            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              As cores agora ficam organizadas por grupos para a lista não virar gigante.
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
            Próximo passo visual
          </p>

          <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
            A estrutura já fica preparada para futuramente a logo acompanhar a cor principal do app.
            Para isso, o ideal é usar uma versão SVG/editável da logo.
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
              Este card usa as mesmas variáveis globais aplicadas no app.
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

      <div className="mt-5">
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

export function SettingsTrainingPreferencesSection({ settings, onUpdateSetting }) {
  return (
    <Card>
      <SectionTitle
        icon={SlidersHorizontal}
        title="Preferências de treino"
        description="Somente opções que já têm efeito real nas telas do ForgeFlow."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select
          label="Modelo padrão de séries"
          value={settings.defaultSetModel}
          onChange={(event) => onUpdateSetting('defaultSetModel', event.target.value)}
        >
          <option value="hypertrophy">Hipertrofia padrão</option>
          <option value="beginner">Iniciante</option>
          <option value="strength">Força</option>
          <option value="pyramid">Pirâmide</option>
          <option value="custom">Simples</option>
        </Select>

        <Select
          label="Descanso padrão"
          value={settings.defaultRestTimer}
          onChange={(event) => onUpdateSetting('defaultRestTimer', event.target.value)}
        >
          <option value="Desligado">Desligado</option>
          <option value="30s">30 segundos</option>
          <option value="45s">45 segundos</option>
          <option value="60s">60 segundos</option>
          <option value="90s">90 segundos</option>
          <option value="120s">120 segundos</option>
        </Select>

        <Input
          label="Treinos visíveis"
          type="number"
          min="1"
          max="20"
          inputMode="numeric"
          value={settings.workoutsVisibleLimit}
          onChange={(event) => onUpdateSetting('workoutsVisibleLimit', Number(event.target.value))}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SettingToggleCard
          title="Esconder detalhes das séries"
          description="Ao iniciar treino, os exercícios podem começar com as séries recolhidas."
          active={settings.collapseSeriesByDefault}
          onChange={(value) => onUpdateSetting('collapseSeriesByDefault', value)}
        />

        <SettingToggleCard
          title="Minimizar “Meus Treinos”"
          description="A página Treinos abre com a lista de treinos recolhida."
          active={settings.collapseWorkoutsByDefault}
          onChange={(value) => onUpdateSetting('collapseWorkoutsByDefault', value)}
        />

        <SettingToggleCard
          title="Salvar treino automaticamente"
          description="Mantém um rascunho enquanto você monta ou edita uma rotina."
          active={settings.autoSaveWorkout}
          onChange={(value) => onUpdateSetting('autoSaveWorkout', value)}
        />

        <SettingToggleCard
          title="Confirmar antes de finalizar"
          description="Abre uma confirmação antes de salvar o treino no histórico."
          active={settings.confirmBeforeFinishWorkout}
          onChange={(value) => onUpdateSetting('confirmBeforeFinishWorkout', value)}
        />

        <SettingToggleCard
          title="Confirmar antes de cancelar"
          description="Pede confirmação antes de descartar uma sessão ativa."
          active={settings.confirmBeforeCancelWorkout}
          onChange={(value) => onUpdateSetting('confirmBeforeCancelWorkout', value)}
        />
      </div>
    </Card>
  )
}

export function SettingsBackupSection({
  exportPassword,
  exportingType,
  onExportPasswordChange,
  onExportJson,
  onExportCsv,
  onExportPdf,
  onImportJson,
}) {
  return (
    <Card>
      <SectionTitle
        icon={FileJson}
        title="Backup e exportação"
        description="Exporte seus dados do ForgeFlow, importe um backup JSON e baixe seu histórico em formatos úteis."
      />

      <div className="mt-5">
        <Input
          type="password"
          label="Senha para exportar"
          value={exportPassword}
          onChange={(event) => onExportPasswordChange(event.target.value)}
          placeholder="Confirme sua senha antes de exportar"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Button type="button" onClick={onExportJson} disabled={Boolean(exportingType)}>
          <Download size={17} />
          {exportingType === 'json' ? 'Exportando...' : 'Exportar backup JSON'}
        </Button>

        <Button type="button" variant="secondary" onClick={onExportCsv} disabled={Boolean(exportingType)}>
          <FileSpreadsheet size={17} />
          {exportingType === 'csv' ? 'Exportando...' : 'Exportar histórico CSV/Excel'}
        </Button>

        <Button type="button" variant="secondary" onClick={onExportPdf} disabled={Boolean(exportingType)}>
          <FileText size={17} />
          {exportingType === 'pdf' ? 'Exportando...' : 'Exportar relatório PDF'}
        </Button>

        <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-5 text-sm font-bold text-[var(--ff-text-soft)] transition hover:border-[var(--ff-accent-border)] hover:text-[var(--ff-text)]">
          <FileJson size={17} />
          Importar backup JSON
          <input
            type="file"
            accept="application/json,.json"
            onChange={onImportJson}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
        <p className="text-sm font-bold text-yellow-300">
          Importação em modo adicionar
        </p>

        <p className="mt-1 text-xs leading-relaxed text-yellow-100/75">
          Por segurança, o backup importado adiciona dados à sua conta sem apagar os dados atuais.
          Depois podemos criar uma opção separada para substituir tudo.
        </p>
      </div>
    </Card>
  )
}

export function SettingsPasswordSection({ user, passwordForm, savingPassword, onPasswordFormChange, onSubmit }) {
  return (
    <Card>
      <SectionTitle
        icon={SlidersHorizontal}
        title={user?.hasPassword ? 'Alterar senha' : 'Criar senha de acesso'}
        description={
          user?.hasPassword
            ? 'Atualize sua senha usada no login tradicional.'
            : 'Sua conta foi criada com Google. Crie uma senha para também entrar usando e-mail e senha.'
        }
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {user?.hasPassword && (
          <Input
            label="Senha atual"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) => onPasswordFormChange((prev) => ({ ...prev, currentPassword: event.target.value }))}
            placeholder="Digite sua senha atual"
          />
        )}

        <Input
          label="Nova senha"
          type="password"
          value={passwordForm.password}
          onChange={(event) => onPasswordFormChange((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Mínimo 6 caracteres"
        />

        <Input
          label="Confirmar nova senha"
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(event) => onPasswordFormChange((prev) => ({ ...prev, confirmPassword: event.target.value }))}
          placeholder="Repita a nova senha"
        />

        <Button type="submit" disabled={savingPassword} className="w-full sm:w-auto">
          {savingPassword
            ? 'Salvando...'
            : user?.hasPassword
              ? 'Alterar senha'
              : 'Criar senha'}
        </Button>
      </form>
    </Card>
  )
}

export function SettingsRiskSidebar({
  user,
  syncBadgeText,
  deleteAccountForm,
  deletingAccount,
  onDeleteAccountFormChange,
  onResetSettings,
  onDeleteAccount,
}) {
  return (
    <aside className="space-y-6">
      <Card>
        <SectionTitle
          icon={AlertTriangle}
          title="Área de risco"
          description="Use apenas quando quiser voltar as preferências para o padrão."
        />

        <div className="mt-5 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ff-muted)]">
            Status
          </p>

          <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
            {syncBadgeText}
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[var(--ff-muted)]">
            Alterações visuais são aplicadas imediatamente e sincronizadas com a conta em seguida.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onResetSettings}
          className="mt-5 w-full"
        >
          <RotateCcw size={17} />
          Restaurar configurações padrão
        </Button>
      </Card>

      <Card className="border-red-500/20">
        <SectionTitle
          icon={AlertTriangle}
          title="Excluir minha conta"
          description="Remova sua conta e os dados associados ao ForgeFlow. Esta ação é permanente."
        />

        <div className="mt-5 space-y-3">
          {user?.hasPassword && (
            <Input
              type="password"
              label="Senha atual"
              value={deleteAccountForm.password}
              onChange={(event) => onDeleteAccountFormChange((current) => ({ ...current, password: event.target.value }))}
              placeholder="Digite sua senha"
            />
          )}

          <Input
            label="Confirmação"
            value={deleteAccountForm.confirmText}
            onChange={(event) => onDeleteAccountFormChange((current) => ({ ...current, confirmText: event.target.value }))}
            placeholder="Digite EXCLUIR"
          />

          <button
            type="button"
            onClick={onDeleteAccount}
            disabled={deletingAccount}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 px-4 text-sm font-black text-red-200 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deletingAccount ? 'Excluindo...' : 'Excluir conta permanentemente'}
          </button>
        </div>
      </Card>
    </aside>
  )
}
