# ForgeFlow

ForgeFlow é um app web para organizar treinos de academia, registrar cargas, acompanhar evolução e manter um histórico real do que foi feito em cada sessão.

Comecei o projeto como uma forma de praticar React, JavaScript e Tailwind CSS, mas ele acabou evoluindo para uma aplicação mais completa, com estrutura de frontend, backend, autenticação, banco de dados e deploy separados.

🔗 **Deploy:** https://forge-flow-five.vercel.app/

---

## Sobre o projeto

A ideia do ForgeFlow é simples: facilitar o controle de treino sem depender de planilha ou anotação solta.

Com ele, é possível cadastrar exercícios, montar treinos, iniciar uma sessão, registrar séries, peso e repetições, visualizar histórico e acompanhar PRs de peso e volume.

Além da parte visual, o projeto também está sendo usado como laboratório para praticar organização de código, componentização, persistência de dados, API própria e integração com banco de dados.

---

## Status atual

O projeto já possui uma boa parte da estrutura principal funcionando:

- frontend em React com Vite;
- layout responsivo com Tailwind CSS;
- navegação com React Router;
- dashboard com métricas e gráficos;
- biblioteca de exercícios;
- criação e edição de treinos;
- execução de treino com cronômetro;
- histórico de treinos finalizados;
- controle de PRs;
- página de perfil;
- página de configurações;
- backend separado em Node.js/Express;
- conexão preparada com MongoDB Atlas;
- estrutura de autenticação com Google OAuth;
- variáveis de ambiente separadas para desenvolvimento e produção;
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

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- Dotenv
- CORS
- Google OAuth

### Deploy

- Vercel para o frontend
- Render para a API
- MongoDB Atlas para o banco

---

## Funcionalidades

### Dashboard

O dashboard mostra um resumo geral do uso do app, com informações como:

- total de treinos concluídos;
- volume total levantado;
- quantidade de PRs;
- exercícios cadastrados;
- treinos salvos;
- evolução de volume;
- distribuição por grupos musculares;
- PRs por exercício;
- gráfico de evolução de peso corporal.

A ideia é que o dashboard funcione como uma visão rápida da evolução do usuário.

---

### Biblioteca de exercícios

A página de exercícios permite consultar, criar e gerenciar exercícios usados nos treinos.

Atualmente ela conta com:

- lista de exercícios padrão;
- exercícios organizados por grupos musculares;
- busca por nome;
- filtros por músculo e equipamento;
- detalhes individuais do exercício;
- criação manual de exercícios;
- edição de exercícios;
- exclusão de exercícios;
- suporte para imagens e GIFs;
- dicas, instruções e observações por exercício;
- salvamento local dos dados.

A base de exercícios ainda está sendo refinada, principalmente na parte de mídia, tradução, dicas e padronização das informações.

---

### Treinos

A área de treinos permite montar rotinas personalizadas de acordo com os exercícios cadastrados.

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
- manter estrutura pronta para favoritos e recentes.

---

### Execução de treino

Durante uma sessão de treino, o usuário consegue registrar o treino de forma mais próxima do uso real.

O sistema possui:

- cronômetro de treino;
- registro de peso e repetições;
- marcação de série concluída;
- adição de novas séries;
- remoção de exercícios;
- substituição de exercícios;
- comparação com treino anterior;
- identificação de PR de peso;
- identificação de PR de volume;
- resumo antes de finalizar;
- salvamento do treino no histórico.

Essa parte é uma das principais do projeto, porque concentra a lógica real de treino e progressão.

---

### Histórico

O histórico salva os treinos finalizados e permite revisar o que foi feito em cada dia.

Inclui:

- lista de treinos concluídos;
- data e duração do treino;
- exercícios feitos;
- séries, cargas e repetições;
- destaques de PR;
- detalhes por treino;
- exclusão individual;
- opção para limpar o histórico.

---

### Perfil

A página de perfil concentra informações do usuário e algumas métricas pessoais.

Atualmente possui campos como:

- nome;
- altura;
- objetivo principal;
- nível de experiência;
- meta semanal;
- divisão de treino preferida;
- notas pessoais;
- peso corporal;
- evolução física;
- resumo de PRs.

A ideia é transformar essa área em uma visão mais completa da evolução do atleta dentro do app.

---

### Configurações

A página de configurações começou a ser estruturada para funcionar de verdade no app, e não apenas como tela visual.

Ela deve concentrar opções como:

- preferências de aparência;
- cor principal do app;
- dados locais;
- limpeza de LocalStorage;
- configurações da conta;
- integração futura com backend.

---

## Backend

O backend foi separado em uma pasta própria e está sendo preparado para substituir aos poucos a dependência do LocalStorage.

A API usa Node.js com Express e variáveis de ambiente para separar os dados sensíveis do código.

Exemplo de variáveis usadas no servidor:

```env
PORT=5000
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
MONGO_URI=sua_string_do_mongodb
GOOGLE_CLIENT_ID=sua_client_id
GOOGLE_CLIENT_SECRET=sua_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

Em produção, essas URLs são trocadas pelas URLs reais da Vercel e Render.

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
MONGO_URI=sua_string_do_mongodb
GOOGLE_CLIENT_ID=sua_client_id
GOOGLE_CLIENT_SECRET=sua_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
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
│   ├── layouts/
│   ├── ui/
│   └── workout/
│
├── context/
│   └── WorkoutSessionContext.jsx
│
├── data/
│   └── defaultExercises.js
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Exercises.jsx
│   ├── ExerciseDetails.jsx
│   ├── History.jsx
│   ├── Profile.jsx
│   ├── Settings.jsx
│   ├── StartWorkout.jsx
│   └── Workouts.jsx
│
├── utils/
│   ├── analyticsUtils.js
│   ├── prUtils.js
│   └── settingsUtils.js
│
├── App.jsx
└── main.jsx
```

```bash
server/
├── index.js
├── package.json
└── .env
```

---

## LocalStorage e banco de dados

No momento, boa parte dos dados ainda pode ser salva no LocalStorage, principalmente para facilitar testes e desenvolvimento rápido.

A ideia é migrar gradualmente para o banco de dados, mantendo os exercícios padrão no projeto e salvando no banco apenas os dados do usuário, como:

- exercícios criados manualmente;
- treinos personalizados;
- histórico;
- perfil;
- peso corporal;
- configurações;
- preferências da conta.

Com isso, o app deixa de depender do navegador e passa a funcionar com login e sincronização em nuvem.

---

## Roadmap

Algumas melhorias planejadas:

- finalizar integração completa com MongoDB;
- salvar treinos, perfil e histórico no backend;
- autenticação completa com Google;
- login tradicional com e-mail e senha;
- favoritos reais;
- exercícios recentes inteligentes;
- calendário de treinos;
- streak de consistência;
- recuperação muscular;
- templates de treino;
- drag and drop de exercícios;
- importação e exportação de dados;
- exportação em PDF/JSON/Excel;
- fotos de evolução;
- gráficos mais avançados;
- versão mobile mais refinada;
- página pública ou social futuramente.

---

## O que estou praticando com esse projeto

Esse projeto está servindo para treinar várias partes importantes do desenvolvimento web:

- React na prática;
- organização de componentes;
- criação de layout responsivo;
- gerenciamento de estado;
- persistência local;
- consumo de API;
- criação de backend;
- autenticação;
- uso de variáveis de ambiente;
- deploy de frontend e backend;
- integração com banco de dados;
- estruturação de um produto real.

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
