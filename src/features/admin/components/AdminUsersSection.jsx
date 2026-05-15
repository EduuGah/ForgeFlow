import {
  Ban,
  Clipboard,
  ClipboardCheck,
  History,
  KeyRound,
  Loader2,
  LockOpen,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  UsersRound,
} from 'lucide-react'

import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { formatDate, formatDuration, formatLastLogin, getUserId } from '../adminUtils'

function AdminUsersSection({
  filteredUsers,
  query,
  setQuery,
  roleFilter,
  statusFilter,
  providerFilter,
  userLimit,
  userPage,
  userPagination,
  selectedUser,
  selectedUserId,
  details,
  activeWorkout,
  historySummary,
  logs,
  loading,
  loadingDetails,
  actionLoading,
  resetPassword,
  copied,
  onUserFilterChange,
  onUserPageChange,
  onUserLimitChange,
  onSelectUser,
  onLoadUsers,
  onLoadUserDetails,
  onCopyText,
  onSetConfirmModal,
  onAdminResetPassword,
  onToggleRole,
  onToggleBlock,
  onClearActiveWorkout,
}) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(390px,0.85fr)_minmax(0,1.55fr)]">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--ff-text)]">Usuários</h2>
            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              {loading
                ? 'Carregando...'
                : `${userPagination.total || filteredUsers.length} conta(s) · página ${userPagination.page || userPage}/${userPagination.totalPages || 1}`}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] text-[var(--ff-accent-text)] shadow-[0_0_18px_var(--ff-accent-shadow)]">
            <UsersRound size={20} />
          </div>
        </div>

        <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4">
          <Search size={18} className="text-[var(--ff-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              onUserFilterChange(null, null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onLoadUsers(1, userLimit)
            }}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-transparent text-sm text-[var(--ff-text)] outline-none placeholder:text-[var(--ff-muted)]"
          />
        </div>

        <div className="admin-filter-grid mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          <select
            value={roleFilter}
            onChange={(event) => onUserFilterChange('role', event.target.value)}
            className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
          >
            <option value="all">Todos roles</option>
            <option value="admin">Admins</option>
            <option value="user">Usuários</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => onUserFilterChange('status', event.target.value)}
            className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
          >
            <option value="all">Todos status</option>
            <option value="active">Ativos</option>
            <option value="blocked">Bloqueados</option>
          </select>

          <select
            value={providerFilter}
            onChange={(event) => onUserFilterChange('provider', event.target.value)}
            className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
          >
            <option value="all">Todos logins</option>
            <option value="credentials">E-mail</option>
            <option value="google">Google</option>
            <option value="both">Ambos</option>
          </select>

          <select
            value={userLimit}
            onChange={(event) => onUserLimitChange(event.target.value)}
            className="h-10 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-3 text-xs font-bold text-[var(--ff-text)] outline-none"
          >
            <option value="10">10 por página</option>
            <option value="25">25 por página</option>
            <option value="50">50 por página</option>
          </select>
        </div>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => onLoadUsers(1, userLimit)} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            Buscar
          </Button>
        </div>

        <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-6 text-sm text-[var(--ff-muted)]">
              <Loader2 className="animate-spin" size={18} />
              Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5 text-sm text-[var(--ff-muted)]">
              Nenhum usuário encontrado.
            </div>
          ) : (
            filteredUsers.map((item) => {
              const itemId = getUserId(item)
              const isSelected = selectedUserId === itemId

              return (
                <button
                  key={itemId}
                  type="button"
                  onClick={() => onSelectUser(item)}
                  className={[
                    'admin-user-row flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                    isSelected
                      ? 'border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)]'
                      : 'border-[var(--ff-border)] bg-[var(--ff-surface-2)] hover:border-[var(--ff-accent-border)]',
                  ].join(' ')}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-card)] text-[var(--ff-accent-text)]">
                    <UserRound size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[var(--ff-text)]">{item.name || 'Sem nome'}</p>
                    <p className="truncate text-xs text-[var(--ff-muted)]">{item.email}</p>
                    <p className="mt-1 text-[11px] text-[var(--ff-muted)]">
                      Último login: {formatLastLogin(item.lastLoginAt, item.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {item.role === 'admin' && <Badge variant="purple">Admin</Badge>}
                    {item.isBlocked && <Badge variant="red">Bloqueado</Badge>}
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold text-[var(--ff-muted)]">
            Página {userPagination.page || userPage} de {userPagination.totalPages || 1} · {userPagination.total || 0} usuário(s)
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !(userPagination.hasPreviousPage || userPage > 1)}
              onClick={() => onUserPageChange((userPagination.page || userPage) - 1)}
            >
              Página anterior
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={loading || !userPagination.hasNextPage}
              onClick={() => onUserPageChange((userPagination.page || userPage) + 1)}
            >
              Próxima página
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-5">
        {!selectedUser ? (
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 text-[var(--ff-accent-text)]" size={26} />
              <div>
                <h2 className="text-xl font-black text-[var(--ff-text)]">Selecione um usuário</h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ff-muted)]">
                  Escolha uma conta para visualizar dados, histórico, treino ativo e ações administrativas.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
                    Conta selecionada
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black text-[var(--ff-text)]">
                    {selectedUser.name || 'Sem nome'}
                  </h2>
                  <p className="mt-1 truncate text-sm text-[var(--ff-muted)]">{selectedUser.email}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedUser.role === 'admin' ? 'purple' : 'default'}>{selectedUser.role || 'user'}</Badge>
                  {selectedUser.isBlocked ? <Badge variant="red">Bloqueado</Badge> : <Badge variant="green">Ativo</Badge>}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                  <p className="text-xs text-[var(--ff-muted)]">Criado em</p>
                  <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{formatDate(selectedUser.createdAt)}</p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                  <p className="text-xs text-[var(--ff-muted)]">Último login</p>
                  <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                    {formatLastLogin(selectedUser.lastLoginAt, selectedUser.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                  <p className="text-xs text-[var(--ff-muted)]">Perfil</p>
                  <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                    {selectedUser.profileCompleted ? 'Completo' : 'Incompleto'}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-3">
                  <p className="text-xs text-[var(--ff-muted)]">Login</p>
                  <p className="mt-1 text-sm font-black text-[var(--ff-text)]">{selectedUser.provider || 'email'}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <Button variant="secondary" className="w-full justify-center" onClick={() => onCopyText(selectedUserId, 'ID')}>
                  {copied === 'ID' ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                  Copiar ID
                </Button>

                <Button variant="secondary" className="w-full justify-center" onClick={() => onCopyText(selectedUser.email, 'E-mail')}>
                  {copied === 'E-mail' ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                  Copiar e-mail
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={() =>
                    onSetConfirmModal({
                      title: selectedUser.role === 'admin' ? 'Rebaixar admin?' : 'Promover para admin?',
                      description:
                        selectedUser.role === 'admin'
                          ? 'Este usuário perderá acesso ao painel administrativo.'
                          : 'Este usuário ganhará acesso ao painel administrativo.',
                      confirmText: selectedUser.role === 'admin' ? 'Rebaixar' : 'Promover',
                      variant: selectedUser.role === 'admin' ? 'danger' : 'default',
                      onConfirm: () => {
                        onSetConfirmModal(null)
                        onToggleRole()
                      },
                    })
                  }
                  disabled={actionLoading}
                >
                  <UserCog size={16} />
                  {selectedUser.role === 'admin' ? 'Rebaixar admin' : 'Promover admin'}
                </Button>

                <Button
                  variant={selectedUser.isBlocked ? 'secondary' : 'danger'}
                  className="w-full justify-center"
                  onClick={() =>
                    onSetConfirmModal({
                      title: selectedUser.isBlocked ? 'Desbloquear usuário?' : 'Bloquear usuário?',
                      description: selectedUser.isBlocked
                        ? 'O usuário poderá acessar a conta novamente.'
                        : 'O usuário será impedido de acessar a conta.',
                      confirmText: selectedUser.isBlocked ? 'Desbloquear' : 'Bloquear',
                      variant: selectedUser.isBlocked ? 'default' : 'danger',
                      onConfirm: () => {
                        onSetConfirmModal(null)
                        onToggleBlock()
                      },
                    })
                  }
                  disabled={actionLoading}
                >
                  {selectedUser.isBlocked ? <LockOpen size={16} /> : <Ban size={16} />}
                  {selectedUser.isBlocked ? 'Desbloquear' : 'Bloquear'}
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-500/10 text-yellow-200">
                  <KeyRound size={20} />
                </div>

                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">Gerar link de reset</h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--ff-muted)]">
                    Gera um link temporário. O admin não define nem visualiza a senha do usuário.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <input
                  type="text"
                  value={resetPassword}
                  readOnly
                  placeholder="O link temporário aparecerá aqui após gerar"
                  className="h-12 rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] px-4 text-sm font-bold text-[var(--ff-text)] outline-none transition focus:border-[var(--ff-accent-border)]"
                />

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() =>
                      onSetConfirmModal({
                        title: 'Gerar link de reset?',
                        description: `Será gerado um link temporário de redefinição para ${selectedUser.email}. O admin não verá nem definirá a senha final.`,
                        confirmText: 'Gerar link de reset',
                        variant: 'danger',
                        onConfirm: () => {
                          onSetConfirmModal(null)
                          onAdminResetPassword()
                        },
                      })
                    }
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Gerando...' : 'Gerar link'}
                  </Button>

                  <Button type="button" variant="secondary" onClick={() => onCopyText(resetPassword, 'Link de reset')} disabled={!resetPassword}>
                    Copiar
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">Diagnóstico da conta</h2>
                  <p className="mt-1 text-sm text-[var(--ff-muted)]">Histórico, treinos e sessão ativa.</p>
                </div>

                {loadingDetails && <Loader2 className="animate-spin text-[var(--ff-muted)]" size={20} />}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs text-[var(--ff-muted)]">Treinos</p>
                  <p className="mt-1 text-2xl font-black text-[var(--ff-text)]">{details?.counts?.workouts ?? '—'}</p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs text-[var(--ff-muted)]">Histórico</p>
                  <p className="mt-1 text-2xl font-black text-[var(--ff-text)]">{details?.counts?.history ?? '—'}</p>
                </div>

                <div className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <p className="text-xs text-[var(--ff-muted)]">Treino ativo</p>
                  <p className="mt-1 text-sm font-black text-[var(--ff-text)]">
                    {activeWorkout ? activeWorkout.workoutName || activeWorkout.name || 'Em andamento' : 'Não'}
                  </p>
                </div>
              </div>

              {activeWorkout && (
                <div className="mt-4 rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--ff-accent-text)]">
                        Treino ativo completo
                      </p>
                      <h3 className="mt-1 text-lg font-black text-[var(--ff-text)]">
                        {activeWorkout.workoutName || activeWorkout.name || 'Treino em andamento'}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--ff-muted)]">
                        Atualizado em {formatDate(details?.activeWorkoutUpdatedAt, true)}
                      </p>
                    </div>

                    <Button
                      variant="danger"
                      onClick={() =>
                        onSetConfirmModal({
                          title: 'Limpar treino ativo?',
                          description: 'Use isso apenas se a sessão ativa do usuário estiver travada.',
                          confirmText: 'Limpar treino ativo',
                          variant: 'danger',
                          onConfirm: () => {
                            onSetConfirmModal(null)
                            onClearActiveWorkout()
                          },
                        })
                      }
                      disabled={actionLoading}
                    >
                      <Trash2 size={16} />
                      Limpar
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button variant="secondary" onClick={() => onLoadUserDetails(selectedUserId)} disabled={loadingDetails}>
                  Atualizar dados
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <History size={20} className="text-[var(--ff-accent-text)]" />
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">Histórico resumido</h2>
                  <p className="text-sm text-[var(--ff-muted)]">Últimos treinos finalizados.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {historySummary.length === 0 ? (
                  <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                    Nenhum treino finalizado encontrado.
                  </p>
                ) : (
                  historySummary.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-[var(--ff-text)]">{item.workoutName}</p>
                          <p className="mt-1 text-xs text-[var(--ff-muted)]">
                            {formatDate(item.finishedAt || item.createdAt, true)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge>{item.exercisesCount} exercícios</Badge>
                          <Badge>{item.totalSets} séries</Badge>
                          <Badge>{formatDuration(item.durationSeconds)}</Badge>
                          {item.prsCount > 0 && <Badge variant="yellow">{item.prsCount} PRs</Badge>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-[var(--ff-accent-text)]" />
                <div>
                  <h2 className="text-xl font-black text-[var(--ff-text)]">Logs administrativos</h2>
                  <p className="text-sm text-[var(--ff-muted)]">Últimas ações feitas nesta conta.</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {logs.length === 0 ? (
                  <p className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4 text-sm text-[var(--ff-muted)]">
                    Nenhum log administrativo encontrado.
                  </p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-[var(--ff-text)]">{log.message || log.action}</p>
                          <p className="mt-1 text-xs text-[var(--ff-muted)]">{log.action}</p>
                        </div>

                        <p className="text-xs font-bold text-[var(--ff-muted)]">{formatDate(log.createdAt, true)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </section>
  )
}

export default AdminUsersSection
