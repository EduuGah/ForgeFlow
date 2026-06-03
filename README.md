# ForgeFlow

ForgeFlow é uma aplicação fullstack para organizar treinos de academia, registrar cargas, acompanhar evolução física e manter um histórico real de cada sessão.

O projeto começou como uma forma de praticar React, JavaScript e Tailwind CSS, mas evoluiu para uma aplicação mais completa, com frontend, backend próprio, autenticação, banco de dados, upload de imagens, estatísticas, metas, notificações, exportações e preparação para experiência mobile.

🔗 **Deploy:** https://forge-flow-five.vercel.app/

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Status atual](#status-atual)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Backend](#backend)
- [Administração](#administração)
- [Como rodar localmente](#como-rodar-localmente)
- [Rodando a API](#rodando-a-api)
- [Estrutura geral](#estrutura-geral)
- [LocalStorage e banco de dados](#localstorage-e-banco-de-dados)
- [Segurança e boas práticas](#segurança-e-boas-práticas)
- [Etapas concluídas](#etapas-concluídas)
- [Roadmap](#roadmap)
- [Possível versão mobile](#possível-versão-mobile)
- [O que estou praticando com este projeto](#o-que-estou-praticando-com-este-projeto)
- [Autor](#autor)
- [Licença](#licença)

---

## Sobre o projeto

A ideia do ForgeFlow é facilitar o controle de treino sem depender de planilhas, anotações soltas ou aplicativos muito genéricos.

Com ele, é possível cadastrar exercícios, montar treinos, iniciar uma sessão, registrar séries, peso e repetições, visualizar histórico, acompanhar PRs, criar metas, registrar fotos de evolução, analisar recuperação muscular e acompanhar gráficos de progresso.

Além da parte visual, o projeto também funciona como laboratório prático para estudar organização de código, componentização, consumo de API, autenticação, persistência em banco de dados, upload de arquivos, deploy, performance, UX mobile e estruturação de um produto real.

---

## Status atual

O projeto já possui uma estrutura funcional com:

- frontend em React com Vite;
- layout responsivo com Tailwind CSS;
- navegação com React Router;
- dashboard com métricas, gráficos e cards inteligentes;
- biblioteca de exercícios com busca, filtros, favoritos e mídia;
- criação, edição, exclusão e duplicação de treinos;
- execução de treino com cronômetro, séries, cargas e repetições;
- histórico de treinos finalizados;
- controle de PRs por peso e volume;
- página de perfil;
- página de configurações funcional;
- backend separado em Node.js/Express;
- banco de dados com MongoDB Atlas;
- autenticação com Google OAuth;
- login tradicional com e-mail e senha;
- criação de senha para contas criadas via Google;
- favoritos sincronizados pelo backend;
- exercícios recentes inteligentes;
- calendário de treinos;
- streak de consistência;
- recuperação muscular;
- templates de treino;
- importação da biblioteca padrão para o backend;
- importação e exportação de dados;
- exportação em JSON, CSV/Excel e PDF;
- fotos de evolução com upload via Cloudinary;
- comparação de fotos antes/depois;
- gráficos avançados de evolução;
- metas e objetivos reais;
- notificações internas inteligentes;
- cache separado por conta;
- ajustes de performance e carregamento inicial;
- melhorias mobile-first em telas principais;
- PWA com instalação pelo navegador;
- preparação e testes para APK com Capacitor;
- detecção de app nativo para ajustar service worker, layout e notificações;
- notificações internas com modal em portal, contador corrigido e abertura direta da notificação clicada;
- fluxo de autenticação mais estável, com tratamento para sessão lenta, token inválido e login Google no mobile;
- treino ativo com ações mobile-first, busca de exercícios, substituição, filtros rápidos e mini card persistente;
- redesign visual inspirado em apps fitness modernos;
- painel administrativo para suporte;
- reset manual de senha pelo admin;
- deploy do frontend na Vercel;
- deploy da API no Render.

---

## Tecnologias utilizadas

### Frontend

- React
- JavaScript
- Vite
- Tailwind CSS
- React Router DOM
- Recharts
- Lucide React
- LocalStorage
- Context API
- PWA
- Capacitor

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT
- Bcrypt
- Passport
- Google OAuth
- Express Session
- Cookie Parser
- Multer
- Cloudinary
- PDFKit
- Dotenv
- CORS

### Deploy e infraestrutura

- Vercel para o frontend
- Render para a API
- MongoDB Atlas para o banco
- Cloudinary para armazenamento de imagens
- Android Studio para testes e empacotamento do APK

---

## Funcionalidades

### Dashboard

O dashboard funciona como uma visão geral da evolução do usuário.

Ele mostra informações como:

- treinos finalizados;
- volume total levantado;
- quantidade de PRs;
- exercícios cadastrados;
- treinos salvos;
- peso corporal;
- streak atual;
- melhor sequência;
- treinos nos últimos 7 e 30 dias;
- metas ativas;
- notificações recentes;
- recuperação muscular;
- últimas fotos de evolução;
- gráficos de volume, peso e grupos musculares;
- PRs recentes com tipo, data, treino, série e volume;
- mapa rápido para navegação entre seções.

A ideia é que o usuário consiga abrir o app e entender rapidamente como está sua evolução.

---

### Autenticação

O ForgeFlow possui autenticação com:

- login tradicional com e-mail e senha;
- cadastro de usuário;
- login com Google;
- criação de senha para contas criadas via Google;
- redefinição manual de senha pelo painel admin;
- proteção de rotas no frontend;
- proteção de rotas no backend;
- autenticação por token;
- carregamento do usuário autenticado;
- validação de sessão com fallback para token inválido;
- tratamento de carregamento lento da API;
- logout;
- mensagens para orientar o usuário quando ele ainda precisa criar uma senha.

Essa parte foi importante para permitir sincronização real entre dispositivos.

---

### Biblioteca de exercícios

A página de exercícios permite consultar, criar e gerenciar exercícios usados nos treinos.

Atualmente conta com:

- exercícios padrão;
- importação da biblioteca padrão para o backend;
- exercícios organizados por grupos musculares;
- busca por nome;
- filtros por músculo e equipamento;
- chips rápidos de filtro no mobile;
- listas de seleção reutilizadas no treino ativo para adicionar ou substituir exercícios;
- detalhes individuais do exercício;
- criação manual de exercícios;
- edição de exercícios;
- exclusão de exercícios;
- favoritos sincronizados;
- suporte para imagens e GIFs;
- instruções, dicas, variações e erros comuns;
- sincronização entre dispositivos;
- renderização progressiva para melhorar performance;
- layout mobile em blocos compactos.

A biblioteca ainda pode ser refinada com mais imagens, GIFs e padronização dos grupos musculares.

---

### Treinos

A área de treinos permite montar rotinas personalizadas com os exercícios cadastrados.

Funcionalidades atuais:

- criar treino;
- editar treino;
- excluir treino;
- duplicar treino;
- adicionar exercícios ao treino;
- organizar séries;
- definir peso e repetições;
- salvar rascunhos;
- iniciar treino salvo;
- favoritos reais;
- exercícios recentes inteligentes;
- templates de treino;
- criação de treino a partir de template;
- salvar treino atual como template;
- editar templates;
- preencher templates padrão automaticamente;
- experiência mobile com barra inferior e ações fixas.

---

### Execução de treino

Durante uma sessão de treino, o usuário consegue registrar o treino de forma próxima ao uso real.

O sistema possui:

- cronômetro de treino;
- registro de peso e repetições;
- marcação de série concluída;
- adição de novas séries;
- remoção de exercícios;
- substituição de exercícios;
- busca para adicionar e substituir exercícios com recomendados, filtros e mídia;
- comparação com treino anterior por série;
- atalho para copiar peso e repetições anteriores para a série atual;
- identificação de PR de peso;
- identificação de PR de volume;
- resumo antes de finalizar;
- salvamento do treino no histórico;
- persistência do treino ativo;
- card de treino ativo em outras páginas;
- ações inferiores e contextuais no celular;
- campos otimizados para toque, teclado mobile e preenchimento rápido;
- timer de descanso opcional;
- pausa, retomada e reinício do descanso;
- opção de finalizar com ou sem local do treino;
- toast de confirmação ao concluir ações.

Essa é uma das partes centrais do projeto, porque concentra a lógica real de progressão.

---

### Histórico

O histórico salva os treinos finalizados e permite revisar o que foi feito em cada dia.

Inclui:

- lista de treinos concluídos;
- data e duração do treino;
- exercícios realizados;
- séries, cargas e repetições;
- volume total;
- destaques de PR;
- detalhes por treino;
- exclusão individual;
- base para gráficos, calendário, streak e recuperação muscular;
- busca por treino ou exercício;
- filtro por data;
- renderização progressiva;
- detalhes expansíveis;
- scroll interno em listas longas.

---

### Calendário de treinos

O calendário usa o histórico salvo para mostrar a frequência de treinos.

Ele permite:

- visualizar os dias treinados;
- navegar entre meses;
- ver quantidade de treinos no mês;
- ver tempo total mensal;
- ver volume mensal;
- selecionar um dia e ver os treinos daquele dia;
- acompanhar consistência.

---

### Consistência e streak

O ForgeFlow calcula estatísticas de consistência com base no histórico.

Atualmente o app acompanha:

- streak atual;
- melhor streak;
- treinos nos últimos 7 dias;
- treinos nos últimos 30 dias;
- total de dias treinados;
- último treino registrado.

Esses dados são usados no Dashboard e no Calendário.

---

### Recuperação muscular

A recuperação muscular estima quais grupos foram treinados recentemente e quais já estão mais recuperados.

O cálculo considera o tempo desde o último treino de cada grupo muscular, com uma lógica mais natural para uso real: a virada do dia já conta como avanço de recuperação.

A página de recuperação mostra:

- grupo muscular;
- último treino;
- data e horário do último treino;
- percentual estimado de recuperação;
- status;
- séries recentes;
- volume recente;
- sugestão de grupos mais recuperados;
- filtros por grupo e status;
- chips rápidos no mobile.

Também foram tratados aliases para evitar duplicidade como “Peito” e “Peitoral”.

---

### Templates de treino

O sistema de templates permite criar modelos reutilizáveis.

Atualmente é possível:

- criar templates;
- editar templates;
- excluir templates;
- favoritar templates;
- criar treino a partir de template;
- salvar um treino atual como template;
- gerar templates padrão do ForgeFlow;
- preencher templates automaticamente com exercícios sugeridos.

Exemplos de templates padrão:

- Push;
- Pull;
- Legs;
- Upper;
- Lower;
- Full Body.

---

### Fotos de evolução

O ForgeFlow possui uma área para registrar fotos de evolução corporal.

As fotos são enviadas para o Cloudinary, e o MongoDB salva apenas os dados necessários.

Funcionalidades:

- upload de foto;
- data;
- ângulo da foto;
- peso do dia;
- observação;
- galeria;
- filtros;
- exclusão de foto;
- comparação antes/depois;
- integração com exportação de dados.

O projeto evita salvar imagens em Base64 no banco, usando uma estrutura mais segura e leve.

---

### Metas e objetivos

A área de metas permite criar objetivos acompanháveis pelo app.

Tipos de metas planejados/implementados:

- treinos por semana;
- treinos por mês;
- peso corporal;
- PR de carga em exercício;
- volume mensal;
- fotos de evolução;
- metas personalizadas.

O progresso é calculado automaticamente quando possível, usando histórico, peso, fotos e registros de treino.

Também foi adicionada uma lógica de baseline para evitar que metas criadas hoje contem progresso antigo. Por exemplo: se o usuário já tinha fotos antes de criar uma meta de fotos, a meta passa a contar apenas o progresso novo a partir da criação.

---

### Notificações internas

O ForgeFlow possui notificações internas inteligentes, salvas no MongoDB.

Elas podem avisar sobre:

- meta quase concluída;
- meta alcançada;
- falta de treino recente;
- falta de registro de peso;
- foto de evolução pendente;
- início do primeiro treino;
- primeiros passos da conta.

Também existe uma central de notificações com:

- notificações lidas e não lidas;
- contador no sino;
- preview rápido pelo botão de notificações;
- abertura direta da notificação clicada;
- modal de detalhe renderizado acima do app inteiro por portal;
- rolagem interna no detalhe para evitar travamento no mobile;
- botão de personalização indo direto para a seção de notificações nas configurações;
- marcar como lida;
- marcar todas como lidas;
- arquivar;
- excluir;
- cards compactos;
- cache separado por conta;
- popup menor em formato de toast.

---

### Evolução e gráficos

A página de evolução concentra gráficos e insights do usuário.

Ela mostra:

- evolução do peso corporal;
- volume semanal;
- treinos por semana;
- duração média;
- grupos musculares mais treinados;
- PRs por exercício;
- evolução de um exercício específico;
- melhores semanas;
- maiores cargas;
- maiores volumes;
- últimas fotos;
- últimos treinos;
- séries recentes agrupadas por data;
- histórico por data com scroll interno;
- duração semanal com intervalo real de datas.

A intenção é transformar a página em uma central real de progresso.

---

### Perfil

A página de perfil concentra informações pessoais e dados de treino.

Atualmente possui campos como:

- nome;
- foto de perfil;
- altura;
- peso atual;
- objetivo principal;
- nível de experiência;
- frequência semanal;
- divisão de treino preferida;
- notas pessoais;
- histórico de peso corporal;
- informações gerais da conta;
- destaques pessoais;
- gráfico de peso corporal;
- versão mais compacta para desktop e mobile.

---

### Configurações

A página de configurações foi evoluída para ser funcional.

Ela concentra:

- tema/aparência;
- cor principal do app;
- preferências da conta;
- preferências de treino;
- criação/alteração de senha;
- exportação de backup JSON;
- importação de backup JSON;
- exportação de histórico em CSV/Excel;
- exportação de relatório em PDF;
- restauração de configurações padrão;
- abertura direta de painéis específicos por URL/state, como notificações;
- layout mais compacto no desktop.

---

## Backend

O backend fica separado em uma pasta própria e é responsável por autenticação, banco de dados, upload de imagens, estatísticas e exportações.

Principais responsabilidades:

- autenticação;
- gerenciamento de usuários;
- perfil;
- exercícios;
- treinos;
- histórico;
- peso corporal;
- templates;
- fotos de evolução;
- metas;
- notificações;
- estatísticas;
- exportação/importação de dados;
- integração com Cloudinary;
- painel administrativo;
- ações de suporte, como reset manual de senha e limpeza de treino ativo travado.

Exemplo de variáveis usadas no servidor:

```env
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=sua_string_do_mongodb
JWT_SECRET=seu_jwt_secret
SESSION_SECRET=seu_session_secret
GOOGLE_CLIENT_ID=sua_client_id
GOOGLE_CLIENT_SECRET=sua_client_secret
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

Em produção, essas URLs são substituídas pelas URLs reais da Vercel e Render.

---

## Administração

O ForgeFlow possui uma área administrativa simples para suporte e manutenção.

A rota principal é:

```txt
/admin
```

Ela fica disponível apenas para usuários com:

```js
role: "admin"
```

Atualmente o painel admin permite:

- listar usuários cadastrados;
- buscar por nome ou e-mail;
- visualizar dados básicos da conta;
- verificar quantidade de treinos e histórico;
- verificar se existe treino ativo;
- limpar treino ativo travado;
- redefinir manualmente a senha temporária de um usuário.

A redefinição feita pelo admin não mostra a senha antiga e não recupera senha existente. Ela apenas substitui o hash salvo no banco por uma nova senha definida pelo administrador.

Para tornar uma conta admin no MongoDB Atlas:

```js
db.users.updateOne(
  { email: "edugah3@gmail.com" },
  { $set: { role: "admin" } }
)
```

Depois disso, é necessário sair e entrar novamente no app para gerar um novo token com a permissão atualizada.

No momento, as opções de recuperação por e-mail e verificação por código estão desativadas. O projeto chegou a testar envio por SMTP e por Resend API, mas a versão atual mantém apenas o reset manual pelo admin para evitar dependência de domínio verificado ou serviço externo de e-mail.


---

## Como rodar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/forgeflow.git
```

### 2. Entrar na pasta do projeto

```bash
cd forgeflow
```

### 3. Instalar dependências do frontend

```bash
npm install
```

### 4. Criar o arquivo `.env` do frontend

Exemplo:

```env
VITE_API_URL=http://localhost:5000
```

### 5. Rodar o frontend

```bash
npm run dev
```

---

## Rodando a API

### 1. Entrar na pasta do servidor

```bash
cd server
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar o `.env` do servidor

Exemplo:

```env
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=sua_string_do_mongodb
JWT_SECRET=seu_jwt_secret
SESSION_SECRET=seu_session_secret
GOOGLE_CLIENT_ID=sua_client_id
GOOGLE_CLIENT_SECRET=sua_client_secret
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret


```
### 4. Rodar em desenvolvimento

```bash
npm run dev
```

---

## Estrutura geral

```bash
src/
├── components/
│   ├── auth/
│   ├── goals/
│   ├── layouts/
│   ├── notifications/
│   ├── profile/
│   ├── progress/
│   ├── ui/
│   └── workout/
│
├── features/
│   ├── notifications/
│   └── startWorkout/
│
├── context/
│   ├── AuthContext.jsx
│   └── WorkoutSessionContext.jsx
│
├── data/
│   ├── defaultExercises.js
│   └── exercises/
│
├── pages/
│   ├── AuthCallback.jsx
│   ├── CompleteProfile.jsx
│   ├── Dashboard.jsx
│   ├── ExerciseDetails.jsx
│   ├── ExerciseProgress.jsx
│   ├── Exercises.jsx
│   ├── Goals.jsx
│   ├── History.jsx
│   ├── Login.jsx
│   ├── MuscleRecovery.jsx
│   ├── Notifications.jsx
│   ├── Profile.jsx
│   ├── Progress.jsx
│   ├── ProgressPhotos.jsx
│   ├── Register.jsx
│   ├── Settings.jsx
│   ├── StartWorkout.jsx
│   ├── WorkoutCalendar.jsx
│   └── Workouts.jsx
│
├── services/
│   ├── api.js
│   └── nativeNotificationService.js
│
├── utils/
│   ├── analyticsUtils.js
│   ├── chartUtils.js
│   ├── exerciseStorage.js
│   ├── notificationUtils.js
│   ├── prUtils.js
│   ├── settingsUtils.js
│   └── userStorage.js
│
├── App.jsx
├── index.css
└── main.jsx
```

```bash
server/
├── index.js
├── package.json
├── package-lock.json
└── .env
```

---

## LocalStorage e banco de dados

O projeto usa MongoDB como base principal e LocalStorage como cache/fallback.

Hoje a aplicação já salva no backend dados como:

- usuário;
- perfil;
- exercícios;
- favoritos;
- treinos;
- histórico;
- peso corporal;
- templates;
- fotos de evolução;
- metas;
- notificações;
- configurações;
- permissões administrativas básicas no usuário.

O LocalStorage continua sendo útil para:

- cache;
- fallback quando a API falha;
- rascunhos;
- melhoria de carregamento;
- suporte durante desenvolvimento.

Também foi adicionada separação de cache por conta para evitar que dados de um usuário apareçam em outro login.

A ideia é reduzir cada vez mais a dependência local e manter os dados principais sincronizados por conta.

---

## Segurança e boas práticas

Alguns cuidados já foram considerados no projeto:

- variáveis sensíveis fora do GitHub;
- uso de `.env`;
- autenticação por token;
- suporte a sessão/cookie e CSRF em rotas sensíveis;
- senhas armazenadas com hash;
- permissões por `role`;
- rotas protegidas por usuário;
- validação de usuário nas operações;
- upload de imagem via Cloudinary;
- imagens não são salvas em Base64 no banco;
- limite de tamanho para upload;
- separação entre frontend e backend;
- CORS configurado por ambiente;
- backup e exportação de dados do usuário;
- cache separado por conta;
- fallback local controlado.

Ainda há espaço para melhorias antes de transformar o projeto em app mobile publicado.

---

## Etapas concluídas

### Etapa 20 — Performance e carregamento inicial

A Etapa 20 focou em melhorar performance, carregamento inicial, cache e estabilidade geral.

Principais melhorias:

- lazy loading de rotas;
- carregamento inicial mais leve;
- uso de `Suspense`;
- otimização de páginas grandes;
- cache local antes da API;
- sincronização posterior com backend;
- renderização progressiva de listas;
- redução de cálculos repetidos;
- uso de `useMemo` e `useDeferredValue`;
- imagens com `loading="lazy"` e `decoding="async"`;
- correção de metas para não contar progresso antigo;
- baseline para metas automáticas;
- correção de popup de meta concluída;
- toast menor no canto superior;
- cache separado por conta;
- ajustes mobile iniciais.

### Etapa 21 — Mobile App Experience

A Etapa 21 focou em deixar o projeto com mais cara de aplicativo mobile, não apenas um site responsivo.

Principais melhorias:

- navegação inferior mobile;
- telas com ações mais acessíveis no celular;
- biblioteca de exercícios com busca rápida e chips;
- cards de exercícios em blocos compactos;
- recuperação muscular com filtros rápidos;
- exibição de hora do último treino;
- modal de validação em metas acima do formulário;
- dashboard com mapa rápido e seções mais claras;
- progresso com listas agrupadas por data;
- histórico com áreas expansíveis;
- notificações mais compactas;
- perfil mais compacto;
- configurações com melhor aproveitamento de espaço.


### Etapa 22 — PWA e instalação

A Etapa 22 adicionou suporte progressivo para experiência de aplicativo instalável.

Principais melhorias:

- manifesto PWA;
- service worker;
- botão de instalação;
- ajustes para instalação no Chrome/Android;
- instruções visuais de instalação;
- tratamento para quando o navegador não libera automaticamente o prompt.

### Etapa 23 — Polimento do treino ativo

A Etapa 23 focou em estabilidade e usabilidade durante o treino.

Principais melhorias:

- correções no treino ativo;
- sincronização entre dispositivos;
- ajustes nos inputs de peso e repetições;
- badges de PR mais visíveis;
- melhorias mobile no registro de séries;
- correção de finalização de treino ativo entre PC e celular.

### Etapa 24 — Polimento mobile

A Etapa 24 focou em ajustes visuais e responsivos em várias páginas.

Principais melhorias:

- refinamento do dashboard mobile;
- filtros de exercícios com melhor scroll;
- histórico mais compacto;
- progresso com proteção contra overflow;
- perfil e configurações mais consistentes;
- ajustes globais de padding, toque e cards.

### Etapa 25 — Redesign visual inspirado no Hevy

A Etapa 25 reformulou a aparência geral do app.

Principais melhorias:

- visual mais limpo e compacto;
- cards com melhor hierarquia;
- desktop mais bem aproveitado;
- mobile com aparência mais próxima de app;
- rotinas e exercícios mais visuais;
- treino ativo mais organizado;
- histórico, progresso, perfil, notificações e configurações mais consistentes;
- sidebar mantida como menu/drawer, sem ficar fixa permanentemente.

### Etapa 27 — Melhorias funcionais

A Etapa 27 adicionou melhorias úteis ao uso diário.

Principais melhorias:

- timer de descanso opcional;
- pausa, retomada e reinício do descanso;
- templates avançados de treino;
- ranking de carga por exercício;
- ranking de volume por exercício;
- atalhos de PR no dashboard;
- tela inicial mais personalizada.

### Etapa 28 — Painel Admin

A Etapa 28 adicionou uma área administrativa para suporte.

Principais melhorias:

- rota `/admin`;
- listagem de usuários;
- busca de usuários;
- visualização de detalhes básicos;
- reset manual de senha pelo admin;
- limpeza de treino ativo travado;
- proteção por `role: "admin"`.

### Etapa 29 — Ajustes de e-mail e simplificação

A Etapa 29 testou fluxos de recuperação por e-mail e verificação por código, mas a versão atual optou por manter essas opções desativadas temporariamente.

Situação atual:

- recuperação por e-mail removida da interface;
- verificação por código removida do cadastro;
- envio SMTP/Resend removido da versão atual;
- cadastro comum voltou a entrar direto;
- reset de senha mantido apenas pelo admin;
- backend sem dependência de `nodemailer` ou `RESEND_API_KEY`.

### Etapa 30 — Estabilidade de login e notificações

A Etapa 30 focou em corrigir o fluxo de autenticação e a central de notificações, principalmente no mobile/APK.

Principais melhorias:

- tratamento mais seguro para sessão carregando;
- limpeza de token inválido;
- proteção de rotas baseada em usuário validado;
- timeout/fallback para chamadas lentas da API;
- ajuste no login Google para fluxo mobile;
- sino de notificações com contador mais confiável;
- abertura direta da notificação clicada;
- botão de personalização abrindo diretamente a seção de notificações;
- modal de detalhe de notificação via portal;
- correção de scroll travado na central de notificações;
- título e conteúdo da notificação sem cortes no detalhe.

### Etapa 31 — Refino do treino ativo mobile

A Etapa 31 refinou a experiência de treino ativo, com foco em uso real no celular.

Principais melhorias:

- ajustes no card principal do treino ativo;
- campos de peso e repetições mais visíveis;
- comparação com a série correspondente do treino anterior;
- atalho para copiar valores anteriores para a série atual;
- ações de exercício em modal próprio;
- substituição de exercícios com busca, filtros, recomendados e imagens;
- adição de exercícios com a mesma experiência visual da substituição;
- controle de scroll em modais para evitar rolagem da página de trás;
- mini card de treino ativo fora da página principal;
- ajustes na finalização com ou sem localização;
- correções sucessivas de layout para uso em APK.


---

## Roadmap

Próximas melhorias planejadas:

- concluir o polimento do treino ativo após testes reais no APK;
- compactar Dashboard, Treinos, Exercícios, Perfil, Notificações e Configurações;
- corrigir e redesenhar o Calendário para mobile;
- criar página individual de progresso por exercício;
- adicionar pré-visualização de fotos antes do upload;
- melhorar a página de nutrição/água com total mais visível;
- estabilizar a área admin;
- melhorar o painel de suporte;
- adicionar logs/auditoria para ações administrativas;
- retomar recuperação de senha por e-mail quando houver domínio verificado;
- configurar envio transacional com domínio próprio;
- revisar PWA e instalação em dispositivos reais;
- preparar Capacitor para empacotar o app;
- testar APK/app Android;
- criar testes automatizados para rotas críticas;
- refatorar gradualmente o backend em módulos separados.

Melhorias futuras:

- push notifications reais;
- metas recorrentes;
- conquistas/badges;
- página pública/social;
- compartilhamento de evolução;
- melhorias no treino ativo mobile;
- drag and drop de exercícios;
- comparações avançadas de períodos;
- integração mais profunda com recursos nativos do celular;
- testes automatizados;
- publicação futura na Play Store.

---

## Possível versão mobile

O projeto está sendo preparado e testado como aplicativo mobile usando Capacitor.

A ideia é manter o frontend React atual e empacotar a aplicação como app Android/iOS, aproveitando a API existente. Os testes atuais focam principalmente no APK Android, com ajustes específicos para WebView, scroll, navegação, login Google, notificações e experiência de treino ativo.

Antes disso, o foco é:

- revisar responsividade;
- melhorar performance;
- ajustar autenticação;
- validar upload de fotos;
- revisar segurança;
- criar versão PWA;
- testar em dispositivos reais.

---

## O que estou praticando com este projeto

Esse projeto está servindo para praticar várias áreas importantes do desenvolvimento:

- React na prática;
- organização de componentes;
- criação de layout responsivo;
- experiência mobile-first;
- gerenciamento de estado;
- autenticação;
- consumo de API;
- criação de backend;
- integração com MongoDB;
- upload de arquivos;
- geração de PDF/CSV/JSON;
- gráficos e estatísticas;
- persistência local e em nuvem;
- deploy de frontend e backend;
- estruturação de um produto real;
- preparação para app mobile.

---

## Autor

**Carlos Eduardo**

Desenvolvedor Fullstack em formação, estudando e construindo projetos práticos com foco em:

- React
- JavaScript
- Tailwind CSS
- Node.js
- Python
- Java
- SQL
- automação de processos
- sistemas internos

---

## Licença

Projeto desenvolvido para estudo, portfólio e evolução profissional.
