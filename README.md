````md
# ForgeFlow

ForgeFlow é uma aplicação web para organizar treinos de academia, registrar cargas, acompanhar evolução física e manter um histórico real de cada sessão.

O projeto começou como uma forma de praticar React, JavaScript e Tailwind CSS, mas acabou evoluindo para uma aplicação mais completa, com frontend, backend próprio, autenticação, banco de dados, upload de imagens, estatísticas e deploy em produção.

🔗 **Deploy:** https://forge-flow-five.vercel.app/

---

## Sobre o projeto

A ideia do ForgeFlow é facilitar o controle de treino sem depender de planilhas, anotações soltas ou aplicativos muito genéricos.

Com ele, é possível cadastrar exercícios, montar treinos, iniciar uma sessão, registrar séries, peso e repetições, visualizar histórico, acompanhar PRs, metas, fotos de evolução, recuperação muscular e gráficos de progresso.

Além da parte visual, o projeto também funciona como laboratório para praticar organização de código, componentização, consumo de API, autenticação, persistência em banco de dados, upload de arquivos, deploy e estruturação de um produto real.

---

## Status atual

O projeto já possui uma estrutura funcional com:

- frontend em React com Vite;
- layout responsivo com Tailwind CSS;
- navegação com React Router;
- dashboard com métricas, gráficos e cards inteligentes;
- biblioteca de exercícios;
- criação, edição, exclusão e duplicação de treinos;
- execução de treino com cronômetro;
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
- preparação visual para mobile;
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
- gráficos de volume, peso e grupos musculares.

A ideia é que o usuário consiga abrir o app e entender rapidamente como está sua evolução.

---

### Autenticação

O ForgeFlow possui autenticação com:

- login tradicional com e-mail e senha;
- cadastro de usuário;
- login com Google;
- criação de senha para contas criadas via Google;
- proteção de rotas no backend;
- autenticação por token;
- carregamento do usuário autenticado;
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
- detalhes individuais do exercício;
- criação manual de exercícios;
- edição de exercícios;
- exclusão de exercícios;
- favoritos sincronizados;
- suporte para imagens e GIFs;
- instruções, dicas, variações e erros comuns;
- sincronização entre dispositivos.

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
- preencher templates padrão automaticamente.

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
- comparação com treino anterior;
- identificação de PR de peso;
- identificação de PR de volume;
- resumo antes de finalizar;
- salvamento do treino no histórico;
- persistência do treino ativo.

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
- base para gráficos, calendário, streak e recuperação muscular.

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

O cálculo considera o tempo desde o último treino de cada grupo muscular.

A página de recuperação mostra:

- grupo muscular;
- último treino;
- percentual estimado de recuperação;
- status;
- séries recentes;
- volume recente;
- sugestão de grupos mais recuperados;
- filtros por grupo e status.

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

---

### Notificações internas

O ForgeFlow possui notificações internas inteligentes, salvas no MongoDB.

Elas podem avisar sobre:

- meta quase concluída;
- meta alcançada;
- falta de treino recente;
- falta de registro de peso;
- foto de evolução pendente;
- início do primeiro treino.

Também existe uma central de notificações com:

- notificações lidas e não lidas;
- contador no sino;
- marcar como lida;
- marcar todas como lidas;
- arquivar;
- excluir.

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
- últimos treinos.

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
- informações gerais da conta.

---

### Configurações

A página de configurações foi evoluída para ser funcional.

Ela concentra:

- tema/aparência;
- cor principal do app;
- preferências da conta;
- criação/alteração de senha;
- limpeza de dados locais;
- exportação de backup JSON;
- importação de backup JSON;
- exportação de histórico em CSV/Excel;
- exportação de relatório em PDF.

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
- integração com Cloudinary.

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
CLOUDINARY_API_SECRET=seu_api_secret
````

Em produção, essas URLs são substituídas pelas URLs reais da Vercel e Render.

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
│   ├── layout/
│   ├── notifications/
│   ├── ui/
│   └── workout/
│
├── context/
│   ├── AuthContext.jsx
│   └── WorkoutSessionContext.jsx
│
├── data/
│   └── defaultExercises.js
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Exercises.jsx
│   ├── ExerciseDetails.jsx
│   ├── Goals.jsx
│   ├── History.jsx
│   ├── MuscleRecovery.jsx
│   ├── Notifications.jsx
│   ├── Profile.jsx
│   ├── Progress.jsx
│   ├── ProgressPhotos.jsx
│   ├── Settings.jsx
│   ├── StartWorkout.jsx
│   ├── WorkoutCalendar.jsx
│   └── Workouts.jsx
│
├── services/
│   └── api.js
│
├── utils/
│   ├── analyticsUtils.js
│   ├── exerciseStorage.js
│   ├── prUtils.js
│   ├── settingsUtils.js
│   └── userStorage.js
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

O projeto ainda usa LocalStorage como fallback e cache local em algumas partes, mas a base principal vem sendo migrada para o MongoDB.

Hoje a aplicação já salva no backend dados como:

* usuário;
* perfil;
* exercícios;
* favoritos;
* treinos;
* histórico;
* peso corporal;
* templates;
* fotos de evolução;
* metas;
* notificações;
* configurações.

O LocalStorage continua sendo útil para:

* cache;
* fallback quando a API falha;
* rascunhos;
* melhoria de carregamento;
* suporte durante desenvolvimento.

A ideia é reduzir cada vez mais a dependência local e manter os dados principais sincronizados por conta.

---

## Segurança e boas práticas

Alguns cuidados já foram considerados no projeto:

* variáveis sensíveis fora do GitHub;
* uso de `.env`;
* autenticação por token;
* rotas protegidas por usuário;
* validação de usuário nas operações;
* upload de imagem via Cloudinary;
* imagens não são salvas em Base64 no banco;
* limite de tamanho para upload;
* separação entre frontend e backend;
* CORS configurado por ambiente;
* backup e exportação de dados do usuário.

Ainda há espaço para melhorias, principalmente antes de transformar o projeto em app mobile.

---

## Roadmap

Próximas etapas planejadas:

* Etapa 20 — melhorar performance e carregamento inicial;
* Etapa 21 — checklist de segurança e produção;
* Etapa 22 — transformar em PWA;
* Etapa 23 — portar para mobile com Capacitor;
* Etapa 24 — testes em APK/app Android;
* Etapa 25 — preparação para publicação na Play Store.

Melhorias futuras:

* push notifications reais;
* metas recorrentes;
* conquistas/badges;
* página pública/social;
* compartilhamento de evolução;
* melhorias no treino ativo mobile;
* drag and drop de exercícios;
* comparações avançadas de períodos;
* integração mais profunda com recursos nativos do celular.

---

## Possível versão mobile

O projeto está sendo preparado para futuramente virar aplicativo mobile usando Capacitor.

A ideia é manter o frontend React atual e empacotar a aplicação como app Android/iOS, aproveitando a API existente.

Antes disso, o foco é:

* revisar responsividade;
* melhorar performance;
* ajustar autenticação;
* validar upload de fotos;
* revisar segurança;
* criar versão PWA;
* testar em dispositivos reais.

---

## O que estou praticando com esse projeto

Esse projeto está servindo para praticar várias áreas importantes do desenvolvimento:

* React na prática;
* organização de componentes;
* criação de layout responsivo;
* gerenciamento de estado;
* autenticação;
* consumo de API;
* criação de backend;
* integração com MongoDB;
* upload de arquivos;
* geração de PDF/CSV/JSON;
* gráficos e estatísticas;
* persistência local e em nuvem;
* deploy de frontend e backend;
* estruturação de um produto real;
* preparação para app mobile.

---

## Autor

**Carlos Eduardo**

Desenvolvedor Fullstack em formação, estudando e construindo projetos práticos com foco em:

* React
* JavaScript
* Tailwind CSS
* Node.js
* Python
* Java
* SQL
* automação de processos
* sistemas internos

---

## Licença

Projeto desenvolvido para estudo, portfólio e evolução profissional.