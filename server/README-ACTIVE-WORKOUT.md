# ForgeFlow Server — treino ativo sincronizado

Este pacote modifica o servidor para salvar o treino ativo no MongoDB, permitindo que o treino iniciado no celular apareça no PC usando a mesma conta.

## Arquivos

```txt
index.js
package.json
package-lock.json
```

## Novas rotas

```txt
GET    /active-workout
PUT    /active-workout
DELETE /active-workout
```

Também inclui aliases usados por versões anteriores do frontend:

```txt
GET/PUT/DELETE /active-session
GET/PUT/DELETE /workout-session/active
```

## Como aplicar

Substitua seu `index.js` pelo arquivo deste pacote. `package.json` e `package-lock.json` não tiveram dependências novas; estão incluídos apenas para manter o pacote completo.

Depois rode:

```bash
npm install
npm run dev
```

ou em produção:

```bash
npm start
```

## Observação

Quando um treino é finalizado em `/workout-history`, o backend limpa a sessão ativa do usuário automaticamente.
