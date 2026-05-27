import { Link } from 'react-router-dom'

import AppPageIntro from '../components/app/AppPageIntro'

function DeleteAccountInfo() {
  return (
    <div className="ff-hevy-page ff-hevy-page-deleteaccount">

      <AppPageIntro eyebrow="Conta" title="Excluir conta" description="Orientações para remoção de conta e dados." />

    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-8 text-[var(--ff-text)]">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
            ForgeFlow
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Exclusão de Conta
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
            Instruções públicas para remover uma conta e os dados associados ao ForgeFlow.
          </p>
          <p className="mt-3 text-xs font-bold text-[var(--ff-muted-2)]">
            Última atualização: 13/05/2026
          </p>
        </header>

                  <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Como excluir pelo app</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Entre na sua conta, acesse Configurações, procure a área de conta/privacidade/zona de perigo e escolha Excluir conta. Confirme a ação solicitada pelo aplicativo.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Dados que podem ser removidos</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>A exclusão pode remover dados da conta, treinos, exercícios, histórico, metas, notificações, fotos de progresso, sessão ativa e configurações vinculadas.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Observações importantes</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>A exclusão pode ser irreversível. Alguns dados técnicos mínimos podem ser mantidos temporariamente por segurança, auditoria ou exigências legais.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Sem acesso à conta</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Caso não consiga acessar sua conta, entre em contato com o suporte informando o e-mail cadastrado.</p>
            </div>
          </section>

        
        <div className="flex flex-col gap-3 rounded-3xl border border-[var(--ff-accent-border)] bg-[var(--ff-accent-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-[var(--ff-text)]">Precisa voltar ao app?</h2>
            <p className="mt-1 text-sm text-[var(--ff-muted)]">
              Acesse sua conta para gerenciar treinos, configurações e dados.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--ff-accent)] px-5 text-sm font-black text-white transition hover:brightness-110"
          >
            Ir para login
          </Link>
        </div>
      </div>
    </main>
  
    </div>
  )
}

export default DeleteAccountInfo
