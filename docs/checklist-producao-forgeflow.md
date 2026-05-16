# Checklist de produção ForgeFlow

Use esta lista antes de qualquer deploy/staging/publicação.

## Frontend

- [ ] `npm run check:frontend` passa.
- [ ] Build abre localmente com `npm run preview`.
- [ ] Testado em mobile pequeno: 360px/390px.
- [ ] PWA instala corretamente.
- [ ] Service worker atualiza sem prender versão antiga.
- [ ] Política de privacidade e exclusão de conta acessíveis.

## Backend

- [ ] `npm run check:server` passa na raiz.
- [ ] `npm --prefix server run check:backend` passa.
- [ ] `.env` de produção sem placeholders.
- [ ] `JWT_SECRET` e `SESSION_SECRET` fortes.
- [ ] CORS restrito ao domínio real.
- [ ] Rate limit ativo em rotas sensíveis.
- [ ] Healthcheck disponível.

## Segurança

- [ ] Rotas admin usam `authMiddleware` + `requireAdmin`.
- [ ] Rotas privadas usam `authMiddleware`.
- [ ] Queries de usuário filtram por `req.user._id`.
- [ ] Usuário bloqueado não acessa rotas privadas.
- [ ] Usuário excluído/anônimo não deixa dados expostos.
- [ ] Reset de senha tem expiração e token único.
- [ ] Upload valida tipo e tamanho.

## Banco de dados

- [ ] Índices por `userId` nas collections do usuário.
- [ ] Índices por data em histórico/logs/admin.
- [ ] Índices por status/role em usuários.
- [ ] Rotina de limpeza de órfãos validada.
- [ ] Política de exclusão/anonimização definida.

## Testes manuais mínimos

- [ ] Criar conta nova.
- [ ] Login com e-mail/senha.
- [ ] Login Google.
- [ ] Criar treino.
- [ ] Iniciar treino.
- [ ] Finalizar treino.
- [ ] Ver histórico.
- [ ] Ver Dashboard.
- [ ] Editar perfil.
- [ ] Registrar peso.
- [ ] Criar meta.
- [ ] Upload de foto.
- [ ] Admin vê rankings.
- [ ] Admin bloqueia usuário teste.
- [ ] Usuário bloqueado perde acesso.
- [ ] Exportação de dados funciona.
- [ ] Exclusão de conta funciona.
