# ForgeFlow

ForgeFlow é uma aplicação web para organização de treinos de academia, permitindo cadastrar exercícios, montar fichas personalizadas, acompanhar progressão de carga e evolução física com uma interface moderna, responsiva e focada em performance.

O projeto está sendo desenvolvido com foco em aprendizado prático de React + JavaScript + Tailwind CSS, mas com estrutura pensada como um sistema real e escalável.

---

## Objetivo do Projeto

O objetivo do ForgeFlow é centralizar toda a rotina de treinos em um único sistema:

* cadastro de exercícios
* montagem de treinos personalizados
* controle de séries e repetições
* progressão de carga
* histórico de evolução
* organização visual moderna e profissional

A proposta é transformar o projeto em uma aplicação completa de acompanhamento fitness, com futuras integrações com banco de dados e dashboard avançado.

---

## Tecnologias Utilizadas

* React
* JavaScript
* Tailwind CSS
* React Router DOM
* LocalStorage
* Vite

Futuramente:

* MongoDB Atlas
* Node.js
* Express
* API própria
* autenticação de usuário

---

## Funcionalidades Atuais

### Dashboard

* estrutura inicial do sistema
* navegação entre páginas
* layout moderno e responsivo

### Exercícios

* cadastro de exercícios
* edição de exercícios
* exclusão de exercícios
* filtro por nome
* filtro por grupo muscular
* filtro por equipamento
* agrupamento por grupo muscular
* grupos retráteis
* observações por exercício
* salvamento automático no localStorage

### Treinos

* criação de treinos
* edição de treinos salvos
* exclusão de treinos
* duplicação de treino
* adição rápida de exercícios
* modo personalizado de séries
* séries padrão pré-definidas
* resumo visual do treino atual
* rascunho automático
* persistência no localStorage

### Layout

* sidebar retrátil
* menu lateral com navegação
* UI components reutilizveis
* design escuro com identidade roxa premium

---

## Estrutura de Pastas

```bash
src/
│
├── components/
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   └── Sidebar.jsx
│   │
│   └── ui/
│       ├── Badge.jsx
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── EmptyState.jsx
│       ├── Input.jsx
│       ├── PageHeader.jsx
│       ├── Select.jsx
│       └── Textarea.jsx
│
├── data/
│   └── defaultExercises.js
│
├── pages/
│   ├── Dashboard.jsx
│   ├── Exercises.jsx
│   ├── History.jsx
│   └── Workouts.jsx
│
├── App.jsx
└── main.jsx
```

---

## Como Rodar o Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/forgeflow.git
```

### 2. Entrar na pasta

```bash
cd forgeflow
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Rodar o projeto

```bash
npm run dev
```

---

## Roadmap Futuro

* histórico real de treino
* PR (recordes pessoais)
* dashboard com gráficos
* calendário de treino
* streak de consistência
* recuperação muscular visual
* templates de treino
* drag and drop de exercícios
* favoritos e recentes
* exportação PDF / JSON / Excel
* importação de treino
* backup em nuvem
* MongoDB Atlas
* autenticação de usuários
* perfil físico completo
* acompanhamento corporal
* sistema premium completo

---

## Aprendizados

Esse projeto está sendo usado como laboratório real para aprofundar:

* componentização
* estrutura profissional de projetos React
* organização de estado
* persistência de dados
* boas práticas de UI/UX
* escalabilidade de front-end
* preparação para backend real

---

## Autor

Desenvolvido por Carlos Eduardo

Desenvolvedor Fullstack em formação
Focado em React, JavaScript, Python, Java e soluções reais para sistemas internos e produtividade.

---

## Licença

Este projeto está sendo desenvolvido para fins de estudo, portfólio e evolução profissional.
