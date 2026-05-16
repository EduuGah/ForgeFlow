# Etapa 59 — Auditoria inicial de backend e produção

Esta etapa não muda regra de negócio. Ela adiciona checagens para reduzir risco antes de deploy.

## O que foi verificado

- Sintaxe do backend com `node --check`.
- Testes/sanity checks já existentes do backend.
- Auditoria automática das rotas Express.
- Presença de `authMiddleware` em rotas privadas.
- Presença de `requireAdmin` em rotas `/admin`.
- Presença de rate limit em rotas sensíveis conhecidas.

## Comandos adicionados

Na raiz do projeto:

```bash
npm run check:server
npm run check:all
```

Dentro de `server/`:

```bash
npm run audit:routes
npm run check:backend
```

## Resultado esperado da auditoria de rotas

A auditoria deve falhar se encontrar:

- rota admin sem `authMiddleware`;
- rota admin sem `requireAdmin`;
- rota privada sem `authMiddleware`.

A auditoria apenas avisa, sem bloquear, quando encontra:

- rotas sensíveis sem rate limit explícito;
- rotas antigas de templates ainda presentes no backend.

## Observações importantes encontradas

### 1. Rotas de templates ainda existem no backend

O frontend deixou de usar templates de treino, mas o backend ainda possui rotas `/workout-templates`.

**Risco:** baixo/médio, porque as rotas estão protegidas por autenticação, mas aumentam superfície de manutenção e podem confundir evolução futura.

**Próxima ação recomendada:** em uma etapa própria, remover ou marcar como legado:

- modelo/schema de templates;
- rotas `/workout-templates`;
- funções auxiliares associadas;
- qualquer dado legado que não será mais usado.

### 2. Auditoria automatizada não substitui revisão humana

O script confere padrões básicos de proteção de rota, mas não garante sozinho que todas as queries filtram corretamente por `userId`.

**Próxima ação recomendada:** revisar rotas por domínio:

1. workouts;
2. workout-history;
3. active-workout;
4. goals;
5. notifications;
6. body-weight;
7. progress-photos;
8. exercises;
9. admin.

## Checklist manual para próxima etapa

- Garantir que toda query de usuário usa `req.user._id` ou equivalente autenticado.
- Não aceitar `userId` vindo do body para operações normais do usuário.
- Garantir que usuário bloqueado não continua usando token antigo.
- Revisar exclusão de conta: soft delete, anonimização ou cascade.
- Confirmar índices MongoDB por `userId`, datas e status.
- Confirmar CORS restrito em produção.
- Confirmar rate limit em login, registro, reset, import/export e upload.
