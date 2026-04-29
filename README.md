# ForgeFlow

ForgeFlow é uma aplicação web completa para organização de treinos de academia, acompanhamento de progressão de carga, controle de PRs (Personal Records), histórico de treino e evolução física, com uma interface moderna, responsiva e inspirada em plataformas como Hevy e Strong.

O projeto nasceu como estudo prático de React + JavaScript + Tailwind CSS, mas evoluiu para um sistema real, escalável e com estrutura pensada para produção futura.

---

## Deploy Online

Acesse a versão online:

🔗 **[https://SEU-LINK-VERCEL-AQUI.vercel.app](https://SEU-LINK-VERCEL-AQUI.vercel.app)**

---

## Objetivo do Projeto

O objetivo do ForgeFlow é centralizar toda a rotina de treinos em um único sistema:

* cadastro inteligente de exercícios
* criação de treinos personalizados
* execução real de treinos com timer ativo
* controle de séries, repetições e carga
* acompanhamento de progressão
* PR de peso e volume
* histórico completo de treinos
* evolução física e peso corporal
* dashboard analítico com gráficos
* perfil do atleta com métrtricas pessoais

A proposta é transformar o ForgeFlow em uma plataforma fitness premium, com backend próprio, autenticação e sincronização em nuvem.

---

## Tecnologias Utilizadas

### Frontend

* React
* JavaScript
* Tailwind CSS
* React Router DOM
* Recharts
* Vite

### Persistência Atual

* LocalStorage

### Futuramente

* Node.js
* Express
* MongoDB Atlas
* API própria
* autenticação JWT
* backup em nuvem
* sincronização multi-dispositivo

---

## Funcionalidades Atuais

---

## Dashboard PRO

* resumo geral dos treinos
* treinos concluídos
* volume total levantado
* total de PRs batidos
* exercícios cadastrados
* treinos salvos com início rápido
* gráfico de volume por treino
* radar chart de grupos musculares
* ranking de grupos mais treinados
* exercício com maior carga
* exercício mais treinado
* PRs por exercício
* gráfico de peso corporal

---

## Biblioteca de Exercícios

* importação massiva baseada na API do Hevy
* biblioteca com centenas de exercícios
* tradução automática para PT-BR
* filtros por:

  * nome
  * grupo muscular
  * equipamento
* agrupamento por grupo muscular
* expansão retrátil dos cards
* observações por exercício
* edição de exercícios
* exclusão de exercícios
* criação manual de novos exercícios
* página individual de detalhes
* suporte futuro para GIFs e mídia

---

## Sistema de Treinos

* criação de treinos personalizados
* edição avançada de treinos
* duplicação de treino
* exclusão de treino
* adição rápida de exercícios
* exercícios recentes
* favoritos (estrutura preparada)
* sistema de séries padrão
* sistema de séries customizadas
* rascunho automático
* persistência automática

---

## Execução Real de Treino

* iniciar treino salvo
* cronômetro persistente
* manter treino aberto entre páginas
* popup de treino ativo (estrutura preparada)
* registro de:

  * peso
  * repetições
  * conclusão de série
* botão de:

  * substituir exercício
  * excluir exercício
  * pular exercício
  * adicionar série
* exibição do treino anterior
* comparação com treino passado
* PR de peso
* PR de volume
* modal de confirmação ao finalizar
* resumo do treino antes de salvar

---

## Histórico Completo

* salvar treino finalizado
* visualização detalhada por treino
* data destacada
* PRs destacados
* exclusão individual
* limpar histórico com confirmação
* base pronta para evolução de carga

---

## Perfil do Atleta

* nome
* altura
* objetivo principal
* nível de experiência
* meta semanal
* divisão preferida
* notas pessoais
* acompanhamento de peso corporal
* gráfico de evolução física
* resumo pessoal
* PRs individuais
* destaques físicos

---

## Layout Premium

* sidebar retrátil
* menu lateral profissional
* design escuro premium
* identidade visual roxa sofisticada
* componentes reutilizáveis
* UX inspirada em SaaS profissional
* foco em mobile future-ready

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
│       ├── Modal.jsx
│       ├── PageHeader.jsx
│       ├── Select.jsx
│       └── Textarea.jsx
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
│   ├── StartWorkout.jsx
│   └── Workouts.jsx
│
├── utils/
│   ├── analyticsUtils.js
│   └── prUtils.js
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

---

### 2. Entrar na pasta

```bash
cd forgeflow
```

---

### 3. Instalar dependências

```bash
npm install
```

---

### 4. Rodar o projeto

```bash
npm run dev
```

---

## Roadmap Futuro

### Próximas grandes features

* sistema de streak de consistência
* recuperação muscular visual
* calendário de treinos
* templates completos:

  * PPL
  * Upper Lower
  * Hipertrofia
  * Força
  * Powerbuilding
* drag and drop de exercícios
* favoritos reais
* exercícios recentes inteligentes
* exportação:

  * PDF
  * JSON
  * Excel
* importação de treino
* backup em nuvem
* sincronização com MongoDB
* autenticação de usuários
* sistema de progresso corporal completo
* fotos de evolução
* métricas avançadas
* ranking pessoal
* social/share futuramente

---

## Diferencial do Projeto

ForgeFlow não é apenas um CRUD de academia.

Ele está sendo construído com mentalidade de produto real:

* UX de aplicação premium
* estrutura escalável
* backend-ready
* foco real em progressão de treino
* preparado para SaaS futuro

A meta é transformar isso em algo superior ao Hevy para uso próprio e portfólio profissional.

---

## Aprendizados

Esse projeto está sendo usado como laboratório real para aprofundar:

* arquitetura React
* componentização profissional
* persistência de dados
* UX/UI moderna
* organização escalável
* gerenciamento de estado
* performance de frontend
* preparação para backend real
* modelagem de produto SaaS

---

## Autor

## Carlos Eduardo

Desenvolvedor Fullstack em formação

Focado em:

* React
* JavaScript
* Python
* Java
* SQL
* automação de processos
* sistemas internos
* produtividade empresarial

Projeto desenvolvido com foco em portfólio profissional, evolução técnica e construção de produto real.

---

## Licença

Este projeto está sendo desenvolvido para fins de:

* estudo
* portfólio
* evolução profissional
* laboratório real de desenvolvimento

Uso livre para fins educacionais.