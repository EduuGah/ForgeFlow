import { Link } from 'react-router-dom'

import AppPageIntro from '../components/app/AppPageIntro'

function PrivacyPolicy() {
  return (
    <div className="ff-hevy-page ff-hevy-page-privacypolicy">

      <AppPageIntro eyebrow="Legal" title="Privacidade" description="Como o ForgeFlow trata seus dados." />

    <main className="ff-legal-main ff-page-mobile-main-grid min-h-screen bg-[var(--ff-bg)] px-4 py-8 text-[var(--ff-text)]">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-[2rem] border border-[var(--ff-border)] bg-[var(--ff-card)] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ff-accent-text)]">
            ForgeFlow
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ff-muted)]">
            Entenda quais dados podem ser tratados pelo ForgeFlow e como eles são usados.
          </p>
          <p className="mt-3 text-xs font-bold text-[var(--ff-muted-2)]">
            Última atualização: 13/05/2026
          </p>
        </header>

                  <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Dados que podem ser tratados</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O ForgeFlow pode armazenar dados informados pelo usuário, como nome, e-mail, perfil, treinos, exercícios, séries, cargas, repetições, metas, notificações e fotos de progresso quando enviadas pelo próprio usuário.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Finalidade</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Os dados são usados para autenticação, funcionamento da conta, acompanhamento de treino, histórico, progresso, estatísticas, segurança, suporte e recuperação de conta.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Fotos de progresso</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O envio de fotos é opcional. As fotos são usadas dentro do app para acompanhamento visual da evolução do usuário.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Compartilhamento</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O ForgeFlow não vende dados pessoais. Dados podem ser processados por serviços necessários ao funcionamento do app, como hospedagem, banco de dados, autenticação, armazenamento de imagens e envio de e-mails.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Segurança</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O projeto usa medidas como senha criptografada, autenticação, validações no backend e controles administrativos. Nenhum sistema é totalmente imune a falhas, mas o app busca reduzir riscos.</p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Exclusão de conta</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>O usuário pode excluir a conta pelo app ou seguir as instruções públicas da página de exclusão.</p>
              <p>
                <Link className="font-black text-[var(--ff-accent-text)] hover:underline" to="/delete-account">
                  Ver instruções de exclusão de conta
                </Link>
              </p>
            </div>
          </section>
          <section className="rounded-3xl border border-[var(--ff-border)] bg-[var(--ff-surface-2)] p-5">
            <h2 className="text-lg font-black text-[var(--ff-text)]">Contato</h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--ff-muted)]">
              <p>Para dúvidas sobre privacidade, dados ou exclusão, use o canal de suporte oficial definido pelo responsável do ForgeFlow.</p>
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

export default PrivacyPolicy
