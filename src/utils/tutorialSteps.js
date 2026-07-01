export const TUTORIAL_VERSION = 6

export const FIRST_STEPS_MISSIONS = [
  {
    id: 'create-workout',
    order: 1,
    title: 'Criar seu primeiro treino',
    shortTitle: 'Criar treino',
    description: 'Monte uma rotina simples para começar a usar o ForgeFlow com dados reais.',
    actionLabel: 'Ir para Treinos',
    route: '/workouts',
    section: 'workouts',
    target: '[data-tutorial="create-workout-button"]',
  },
  {
    id: 'start-workout',
    order: 2,
    title: 'Iniciar um treino',
    shortTitle: 'Iniciar treino',
    description: 'Abra uma sessão ativa para registrar séries, cargas e repetições.',
    actionLabel: 'Iniciar treino',
    route: '/workouts',
    section: 'workouts',
    target: '[data-tutorial="workout-start-button"]',
  },
  {
    id: 'register-set',
    order: 3,
    title: 'Registrar uma série',
    shortTitle: 'Registrar série',
    description: 'Preencha kg e reps e conclua a série. Isso vira histórico e progresso.',
    actionLabel: 'Abrir treino ativo',
    route: '/start-workout',
    section: 'workout',
    target: '[data-tutorial="active-set-row"]',
  },
  {
    id: 'finish-workout',
    order: 4,
    title: 'Finalizar treino com segurança',
    shortTitle: 'Finalizar treino',
    description: 'Revise o resumo e confirme para salvar o treino no histórico.',
    actionLabel: 'Finalizar treino',
    route: '/start-workout',
    section: 'workout',
    target: '[data-tutorial="active-finish-workout-bottom"], [data-tutorial="active-finish-workout"]',
  },
  {
    id: 'view-history',
    order: 5,
    title: 'Ver seu histórico',
    shortTitle: 'Ver histórico',
    description: 'Depois de finalizar, veja volume, exercícios feitos e evolução.',
    actionLabel: 'Abrir histórico',
    route: '/history',
    section: 'history',
    target: '[data-tutorial="history-list"], [data-tutorial="dashboard-recent-history"]',
  },
]

export const FIRST_STEPS_MISSION_IDS = FIRST_STEPS_MISSIONS.map((mission) => mission.id)

export const tutorialRouteFlows = {
  '/': 'first-steps',
  '/dashboard': 'first-steps',
  '/workouts': 'first-steps',
  '/start-workout': 'first-steps',
  '/history': 'first-steps',
  '/progress': 'first-steps',
  '/nutrition': 'first-steps',
  '/settings': 'first-steps',
}

export const tutorialSections = {
  firstSteps: {
    id: 'firstSteps',
    order: 1,
    title: 'Primeiros passos',
    shortTitle: 'Primeiros passos',
    description: 'Aprenda o fluxo principal fazendo ações reais no app.',
  },
  workouts: {
    id: 'workouts',
    order: 2,
    title: 'Treinos',
    shortTitle: 'Treinos',
    description: 'Criar e iniciar rotinas.',
  },
  workout: {
    id: 'workout',
    order: 3,
    title: 'Treino ativo',
    shortTitle: 'Treino ativo',
    description: 'Registrar séries e finalizar com confirmação.',
  },
  history: {
    id: 'history',
    order: 4,
    title: 'Histórico',
    shortTitle: 'Histórico',
    description: 'Ver o que foi salvo e acompanhar evolução.',
  },
  nutrition: {
    id: 'nutrition',
    order: 5,
    title: 'Nutrição',
    shortTitle: 'Nutrição',
    description: 'Água, refeições e metas aparecem como ajuda contextual, não como tour longo.',
  },
  settings: {
    id: 'settings',
    order: 6,
    title: 'Ajuda',
    shortTitle: 'Ajuda',
    description: 'Reiniciar ou rever os primeiros passos.',
  },
}

export const tutorialSectionOrder = Object.values(tutorialSections).sort((a, b) => a.order - b.order)

function step({ id, title, description, route = '/', section = 'firstSteps' }) {
  return {
    id,
    title,
    description,
    route,
    section,
    mode: 'mission',
    presentation: 'checklist',
    canSkip: true,
  }
}

export const tutorialFlows = {
  welcome: {
    id: 'welcome',
    title: 'Primeiros passos',
    description: 'Checklist curto para aprender o essencial usando o app.',
    sections: ['firstSteps', 'workouts', 'workout', 'history'],
    steps: FIRST_STEPS_MISSIONS.map((mission) => step(mission)),
  },
  'first-steps': {
    id: 'first-steps',
    title: 'Primeiros passos',
    description: 'Checklist curto para aprender o essencial usando o app.',
    sections: ['firstSteps', 'workouts', 'workout', 'history'],
    steps: FIRST_STEPS_MISSIONS.map((mission) => step(mission)),
  },
  dashboard: {
    id: 'dashboard',
    title: 'Primeiros passos',
    description: 'Aprenda o fluxo principal pelo Dashboard.',
    sections: ['firstSteps'],
    steps: FIRST_STEPS_MISSIONS.map((mission) => step(mission)),
  },
  workouts: {
    id: 'workouts',
    title: 'Criar e iniciar treino',
    description: 'Missões ligadas aos treinos.',
    sections: ['workouts'],
    steps: FIRST_STEPS_MISSIONS.slice(0, 2).map((mission) => step(mission)),
  },
  workout: {
    id: 'workout',
    title: 'Treino ativo',
    description: 'Missões ligadas ao registro de série e finalização.',
    sections: ['workout'],
    steps: FIRST_STEPS_MISSIONS.slice(2, 4).map((mission) => step(mission)),
  },
  history: {
    id: 'history',
    title: 'Histórico',
    description: 'Missão para entender o histórico.',
    sections: ['history'],
    steps: [step(FIRST_STEPS_MISSIONS[4])],
  },
  nutrition: {
    id: 'nutrition',
    title: 'Nutrição',
    description: 'Ajuda contextual de nutrição.',
    sections: ['nutrition'],
    steps: [step({ id: 'nutrition-context', title: 'Nutrição e insights', description: tutorialSections.nutrition.description, route: '/nutrition', section: 'nutrition' })],
  },
  settings: {
    id: 'settings',
    title: 'Ajuda',
    description: tutorialSections.settings.description,
    sections: ['settings'],
    steps: [step({ id: 'settings-help', title: 'Tutorial e ajuda', description: tutorialSections.settings.description, route: '/settings', section: 'settings' })],
  },
}

export function getTutorialSteps(flowId = 'welcome') {
  return tutorialFlows[flowId]?.steps || tutorialFlows.welcome.steps
}

export function getTutorialFlow(flowId = 'welcome') {
  return tutorialFlows[flowId] || tutorialFlows.welcome
}

export function getTutorialSection(sectionId = 'firstSteps') {
  return tutorialSections[sectionId] || tutorialSections.firstSteps
}

export function getTutorialSections() {
  return tutorialSectionOrder
}

export function getFlowForPath(pathname = '/') {
  const normalizedPath = pathname === '/dashboard' ? '/' : pathname
  if (tutorialRouteFlows[normalizedPath]) return tutorialRouteFlows[normalizedPath]

  const match = Object.entries(tutorialRouteFlows)
    .filter(([path]) => path !== '/')
    .find(([path]) => normalizedPath.startsWith(`${path}/`))

  return match?.[1] || 'first-steps'
}

export function getFlowStepCount(flowId = 'welcome') {
  return getTutorialSteps(flowId).length
}

export function getSectionStepCount(sectionId = 'firstSteps') {
  return getTutorialSteps('welcome').filter((item) => item.section === sectionId).length
}

export default tutorialFlows
