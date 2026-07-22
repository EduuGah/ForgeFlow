export const TUTORIAL_VERSION = 12

export const FIRST_STEPS_MISSIONS = [
  {
    id: 'create-workout',
    order: 1,
    title: 'Criar seu primeiro treino',
    shortTitle: 'Criar treino',
    description: 'Crie sua primeira rotina.',
    actionLabel: 'Ir para Treinos',
    route: '/workouts',
    section: 'workouts',
    target: '[data-tutorial="create-workout-button"]',
    pendingText: 'Crie uma rotina para continuar.',
  },
  {
    id: 'start-workout',
    order: 2,
    title: 'Iniciar um treino',
    shortTitle: 'Iniciar treino',
    description: 'Escolha uma rotina.',
    actionLabel: 'Iniciar treino',
    route: '/workouts',
    section: 'workouts',
    target: '[data-tutorial="workout-start-button"]',
    pendingText: 'Inicie uma rotina para continuar.',
  },
  {
    id: 'register-set',
    order: 3,
    title: 'Registrar uma série',
    shortTitle: 'Registrar série',
    description: 'Registre sua primeira série.',
    actionLabel: 'Registrar série guiada',
    route: '/start-workout',
    section: 'workout',
    target: '[data-tutorial="active-set-complete-button"], [data-tutorial="guided-register-set-row"]',
    createDemoSession: true,
    pendingText: 'Conclua a série destacada.',
    startStepId: 'set-weight',
  },
  {
    id: 'finish-workout',
    order: 4,
    title: 'Finalizar treino com segurança',
    shortTitle: 'Finalizar treino',
    description: 'Finalize seu treino.',
    actionLabel: 'Finalizar treino',
    route: '/start-workout',
    section: 'workout',
    target: '[data-tutorial="active-finish-workout-confirm"], [data-tutorial="active-finish-workout-bottom"], [data-tutorial="active-finish-workout-hero"], [data-tutorial="active-finish-workout-desktop"]',
    pendingText: 'Finalize o treino para continuar.',
  },
  {
    id: 'view-history',
    order: 5,
    title: 'Ver seu histórico',
    shortTitle: 'Ver histórico',
    description: 'Acompanhe sua evolução.',
    actionLabel: 'Abrir histórico',
    route: '/history',
    section: 'history',
    target: '[data-tutorial="history-overview"]',
    pendingText: 'Abra o histórico.',
    requiresAction: false,
    validation: 'none',
  },
  {
    id: 'create-goal',
    order: 6,
    title: 'Criar uma meta',
    shortTitle: 'Criar meta',
    description: 'Defina uma meta.',
    actionLabel: 'Ir para Metas',
    route: '/goals',
    section: 'goals',
    target: '[data-tutorial="goals-create-button"], [data-tutorial="goals-overview"]',
    pendingText: 'Crie uma meta para continuar.',
  },
]

export const FIRST_STEPS_MISSION_IDS = FIRST_STEPS_MISSIONS.map((mission) => mission.id)

export const tutorialRouteFlows = {
  '/': 'first-steps',
  '/dashboard': 'first-steps',
  '/workouts': 'first-steps',
  '/start-workout': 'first-steps',
  '/history': 'first-steps',
  '/goals': 'first-steps',
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
    description: 'Aprenda o essencial em poucos passos.',
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
    description: 'Registrar séries e finalizar.',
  },
  history: {
    id: 'history',
    order: 4,
    title: 'Histórico',
    shortTitle: 'Histórico',
    description: 'Consultar treinos salvos.',
  },
  goals: {
    id: 'goals',
    order: 5,
    title: 'Metas',
    shortTitle: 'Metas',
    description: 'Criar objetivos com prazo, ritmo e lembretes.',
  },
  nutrition: {
    id: 'nutrition',
    order: 6,
    title: 'Nutrição',
    shortTitle: 'Nutrição',
    description: 'Acompanhar água, refeições e metas.',
  },
  settings: {
    id: 'settings',
    order: 7,
    title: 'Ajuda',
    shortTitle: 'Ajuda',
    description: 'Rever os primeiros passos.',
  },
}

export const tutorialSectionOrder = Object.values(tutorialSections).sort((a, b) => a.order - b.order)

function step({ id, title, shortTitle, description, actionLabel, route = '/', section = 'firstSteps', target = '', requireTarget = false, createDemoSession = false, requiresAction = true, pendingText = '', validation = 'mission', autoAdvanceOn = '' }) {
  return {
    id,
    title,
    shortTitle,
    description,
    actionLabel,
    route,
    section,
    target,
    requireTarget,
    createDemoSession,
    requiresAction,
    pendingText,
    validation,
    autoAdvanceOn,
    mode: 'mission',
    presentation: 'guided',
    canSkip: true,
  }
}

const INTRO_STEP = step({
  id: 'welcome-dashboard',
  title: 'Vamos conhecer o ForgeFlow',
  shortTitle: 'Boas-vindas',
  description: 'Eu vou guiar você pelo essencial.',
  actionLabel: 'Começar',
  route: '/',
  section: 'firstSteps',
  target: '[data-tutorial="dashboard-hero"]',
  requiresAction: false,
  validation: 'none',
})

const WORKOUT_INPUT_STEPS = [
  step({
    id: 'set-weight',
    title: 'Informe o peso',
    shortTitle: 'Peso',
    description: 'Digite a carga usada.',
    actionLabel: 'Informar peso',
    route: '/start-workout',
    section: 'workout',
    target: '[data-tutorial="active-set-weight-input"], [data-set-field="weight"]',
    createDemoSession: true,
    validation: 'input-value',
    pendingText: 'Digite o peso usado.',
  }),
  step({
    id: 'set-reps',
    title: 'Informe as repetições',
    shortTitle: 'Repetições',
    description: 'Digite as reps feitas.',
    actionLabel: 'Informar reps',
    route: '/start-workout',
    section: 'workout',
    target: '[data-tutorial="active-set-reps-input"], [data-set-field="reps"]',
    createDemoSession: true,
    validation: 'input-value',
    pendingText: 'Digite as repetições.',
  }),
]

const FIRST_STEPS_FLOW_STEPS = [
  INTRO_STEP,
  ...FIRST_STEPS_MISSIONS.slice(0, 2).map((mission) => step(mission)),
  ...WORKOUT_INPUT_STEPS,
  ...FIRST_STEPS_MISSIONS.slice(2).map((mission) => step(mission)),
]

export const tutorialFlows = {
  welcome: {
    id: 'welcome',
    title: 'Primeiros passos',
    description: 'Tutorial rápido do fluxo principal.',
    sections: ['firstSteps', 'workouts', 'workout', 'history', 'goals'],
    steps: FIRST_STEPS_FLOW_STEPS,
  },
  'first-steps': {
    id: 'first-steps',
    title: 'Primeiros passos',
    description: 'Tutorial rápido do fluxo principal.',
    sections: ['firstSteps', 'workouts', 'workout', 'history', 'goals'],
    steps: FIRST_STEPS_FLOW_STEPS,
  },
  dashboard: {
    id: 'dashboard',
    title: 'Primeiros passos',
    description: 'Comece pelo Dashboard.',
    sections: ['firstSteps'],
    steps: FIRST_STEPS_FLOW_STEPS,
  },
  workouts: {
    id: 'workouts',
    title: 'Criar e iniciar treino',
    description: 'Criar e iniciar treinos.',
    sections: ['workouts'],
    steps: FIRST_STEPS_MISSIONS.slice(0, 2).map((mission) => step(mission)),
  },
  workout: {
    id: 'workout',
    title: 'Treino ativo',
    description: 'Registrar e finalizar treinos.',
    sections: ['workout'],
    steps: [...WORKOUT_INPUT_STEPS, ...FIRST_STEPS_MISSIONS.slice(2, 4).map((mission) => step(mission))],
  },
  history: {
    id: 'history',
    title: 'Histórico',
    description: 'Abrir treinos salvos.',
    sections: ['history'],
    steps: [step(FIRST_STEPS_MISSIONS[4])],
  },
  goals: {
    id: 'goals',
    title: 'Metas',
    description: 'Criar objetivos.',
    sections: ['goals'],
    steps: [step(FIRST_STEPS_MISSIONS[5])],
  },
  nutrition: {
    id: 'nutrition',
    title: 'Nutrição',
    description: 'Ajuda rápida de nutrição.',
    sections: ['nutrition'],
    steps: [step({ id: 'nutrition-context', title: 'Nutrição', description: tutorialSections.nutrition.description, route: '/nutrition', section: 'nutrition', target: '[data-tutorial="nutrition-overview"]', requiresAction: false, validation: 'none' })],
  },
  settings: {
    id: 'settings',
    title: 'Ajuda',
    description: tutorialSections.settings.description,
    sections: ['settings'],
    steps: [step({ id: 'settings-help', title: 'Ajuda do app', description: tutorialSections.settings.description, route: '/settings', section: 'settings', target: '[data-tutorial="settings-tutorial-panel"]', requiresAction: false, validation: 'none' })],
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
