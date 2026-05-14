import { Link } from 'react-router-dom'

function DataSafety() {
  return (
    <main className="min-h-screen bg-[var(--ff-bg)] px-4 py-8 text-[var(--ff-text)]">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
            ForgeFlow
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Data Safety
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
            Base pública para revisão das informações de segurança de dados antes da publicação na Play Store.
          </p>
          <p className="mt-3 text-xs font-bold text-[var(--ff-muted-2)]">
            Última atualização: 13/05/2026
          </p>
        </header>

                  <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Dados coletados</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O app pode tratar informações pessoais, dados de saúde e fitness inseridos pelo usuário, atividade no app, fotos e arquivos enviados voluntariamente.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Finalidades</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Funcionalidade do aplicativo, gerenciamento de conta, acompanhamento de treino, analytics internos, segurança, suporte e recuperação de conta.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Venda de dados</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O ForgeFlow não vende dados pessoais.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Compartilhamento com provedores</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Dados podem ser processados por provedores necessários ao funcionamento do app, como hospedagem, banco de dados, autenticação, armazenamento de imagens e e-mail.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Exclusão de dados</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O usuário pode solicitar ou realizar a exclusão da conta.</p>
              <p>
                <Link className="font-black text-[var(--ff-accent-text)] hover:underline" to="/delete-account">
                  Ver instruções de exclusão
                </Link>
              </p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Aviso</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Este conteúdo é uma base inicial para a Play Store e deve ser revisado conforme os provedores e configurações reais usados em produção.</p>
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
  )
}

export default DataSafety
