import {
  AlertTriangle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'

import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Select from '../../../components/ui/Select'
import Input from '../../../components/ui/Input'
import { SectionTitle, SettingToggleCard } from './SettingsBaseControls'

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
