export const TUTORIAL_VERSION = 4

export const tutorialRouteFlows = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/workouts': 'workouts',
  '/exercises': 'exercises',
  '/start-workout': 'workout',
  '/history': 'history',
  '/calendar': 'schedule',
  '/schedule': 'schedule',
  '/progress': 'progress',
  '/exercise-progress': 'progress',
  '/progress-photos': 'progress',
  '/muscle-recovery': 'progress',
  '/nutrition': 'nutrition',
  '/notifications': 'notifications',
  '/profile': 'settings',
  '/settings': 'settings',
  '/goals': 'dashboard',
}

export const tutorialSections = {
  welcome: {
    id: 'welcome',
    order: 1,
    title: 'Boas-vindas',
    shortTitle: 'Início',
    description: 'Um início rápido, sem excesso de etapas.',
  },
  dashboard: {
    id: 'dashboard',
    order: 2,
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    description: 'Visão geral do dia e dos próximos passos.',
  },
  navigation: {
    id: 'navigation',
    order: 3,
    title: 'Navegação',
    shortTitle: 'Navegação',
    description: 'Como circular pelo app sem destacar áreas fixas problemáticas.',
  },
  workouts: {
    id: 'workouts',
    order: 4,
    title: 'Treinos',
    shortTitle: 'Treinos',
    description: 'Criar, editar e iniciar rotinas.',
  },
  workout: {
    id: 'workout',
    order: 5,
    title: 'Treino ativo',
    shortTitle: 'Ativo',
    description: 'Registrar séries sem criar dados falsos.',
  },
  history: {
    id: 'history',
    order: 6,
    title: 'Histórico e evolução',
    shortTitle: 'Histórico',
    description: 'Treinos finalizados, PRs e gráficos quando houver dados.',
  },
  nutrition: {
    id: 'nutrition',
    order: 7,
    title: 'Nutrição',
    shortTitle: 'Nutrição',
    description: 'Água, refeições, metas e insights.',
  },
  settings: {
    id: 'settings',
    order: 8,
    title: 'Configurações',
    shortTitle: 'Config.',
    description: 'Tema, cor do app e ajuda.',
  },
}

function step({
  id,
  section,
  title,
  description,
  example = '',
  target = '',
  route = '/',
  mode = 'panel',
  dock = 'auto',
  scroll = true,
  requireTarget = false,
  allowInteraction = true,
  canSkip = true,
  fallbackTitle = '',
  fallbackDescription = '',
  skipWhenNoData = false,
  onlyWhenHasData = false,
}) {
  return {
    id,
    section,
    title,
    description,
    example,
    target,
    selector: target,
    route,
    mode,
    presentation: mode === 'highlight' ? '' : 'panel',
    placement: dock,
    dock,
    scroll,
    scrollIntoView: scroll,
    requireTarget,
    requireElement: requireTarget,
    allowInteraction,
    canSkip,
    fallbackTitle,
    fallbackDescription,
    skipWhenNoData,
    onlyWhenHasData,
  }
}

const quickTourSteps = [
  step({
    id: 'welcome-start',
    section: 'welcome',
    title: 'Bem-vindo ao ForgeFlow',
    description: 'Este tour é curto. Ele mostra o básico sem ficar em cima dos botões ou cards.',
    example: 'Você pode rever depois em Configurações.',
    route: '/',
    mode: 'welcome',
    dock: 'bottom',
  }),
  step({
    id: 'dashboard-overview',
    section: 'dashboard',
    title: 'Seu centro do app',
    description: 'Aqui fica o resumo do seu dia. No começo, o app mostra orientações simples; depois usa seus treinos reais.',
    target: '[data-tutorial="dashboard-hero"], [data-tutorial="dashboard-summary"], main',
    route: '/',
    mode: 'highlight',
    dock: 'auto',
    fallbackTitle: 'Dashboard',
    fallbackDescription: 'Quando ainda não há dados, o Dashboard mostra um ponto de partida em vez de inventar recomendações.',
  }),
  step({
    id: 'navigation-main',
    section: 'navigation',
    title: 'Navegação principal',
    description: 'Use a barra inferior para ir para Treinos, Progresso, Nutrição e Configurações. Essa etapa é explicativa para evitar destaque cortado no rodapé.',
    route: '/',
    mode: 'panel',
    dock: 'bottom',
  }),
  step({
    id: 'workouts-start',
    section: 'workouts',
    title: 'Crie ou inicie um treino',
    description: 'Na aba Treinos você monta suas rotinas e inicia uma sessão real quando for treinar.',
    target: '[data-tutorial="create-workout-button"], [data-tutorial="workouts-list"], [data-tutorial="workout-card"]',
    route: '/workouts',
    mode: 'highlight',
    dock: 'auto',
    fallbackTitle: 'Treinos',
    fallbackDescription: 'Se ainda não houver treino salvo, crie sua primeira rotina para começar.',
  }),
  step({
    id: 'workout-demo-register',
    section: 'workout',
    title: 'Como registrar uma série',
    description: 'Durante o treino, você registra kg e repetições. Esses dados viram histórico, volume e recordes pessoais.',
    example: 'Esta é uma simulação visual: não cria notificação, não salva histórico e não mexe no treino real.',
    route: '/',
    mode: 'demo',
    dock: 'bottom',
  }),
  step({
    id: 'workout-finish-safe',
    section: 'workout',
    title: 'Finalização segura',
    description: 'Ao concluir um treino real, o ForgeFlow pede confirmação. Assim você evita salvar algo incompleto por acidente.',
    route: '/',
    mode: 'panel',
    dock: 'bottom',
  }),
  step({
    id: 'history-progress-empty',
    section: 'history',
    title: 'Histórico e evolução',
    description: 'Histórico, PRs e gráficos aparecem depois que você registra treinos reais. Em conta nova, é normal essa área estar vazia.',
    route: '/history',
    mode: 'panel',
    dock: 'bottom',
  }),
  step({
    id: 'nutrition-overview',
    section: 'nutrition',
    title: 'Nutrição e insights',
    description: 'Em Nutrição você acompanha água, refeições e metas. Os insights principais ficam no topo quando houver dados.',
    target: '[data-tutorial="nutrition-water"], [data-tutorial="nutrition-goals"], [data-tutorial="nutrition-overview"]',
    route: '/nutrition',
    mode: 'highlight',
    dock: 'auto',
    fallbackTitle: 'Nutrição',
    fallbackDescription: 'Se ainda não houver registro, use os botões rápidos para começar com água e refeições.',
  }),
  step({
    id: 'settings-help',
    section: 'settings',
    title: 'Rever quando quiser',
    description: 'Em Configurações você pode reiniciar o tour, rever o treino ativo ou deixar a ajuda automática ligada/desligada.',
    target: '[data-tutorial="settings-tutorial"], [data-tutorial="settings-tutorial-panel"]',
    route: '/settings',
    mode: 'highlight',
    dock: 'auto',
    fallbackTitle: 'Tutorial e ajuda',
    fallbackDescription: 'Você pode rever este guia pelas Configurações sempre que precisar.',
  }),
]

const dashboardSteps = [quickTourSteps[1], quickTourSteps[2]]
const workoutsSteps = [quickTourSteps[3]]
const workoutSteps = [quickTourSteps[4], quickTourSteps[5]]
const historySteps = [quickTourSteps[6]]
const nutritionSteps = [quickTourSteps[7]]
const settingsSteps = [quickTourSteps[8]]

export const tutorialFlows = {
  welcome: {
    id: 'welcome',
    title: 'Tour rápido do ForgeFlow',
    description: 'Um guia curto, mobile-first e sem tooltip cobrindo o conteúdo.',
    sections: ['welcome', 'dashboard', 'navigation', 'workouts', 'workout', 'history', 'nutrition', 'settings'],
    steps: quickTourSteps,
  },
  dashboard: {
    id: 'dashboard',
    title: 'Tutorial do Dashboard',
    description: tutorialSections.dashboard.description,
    sections: ['dashboard', 'navigation'],
    steps: dashboardSteps,
  },
  navigation: {
    id: 'navigation',
    title: 'Tutorial da navegação',
    description: tutorialSections.navigation.description,
    sections: ['navigation'],
    steps: [quickTourSteps[2]],
  },
  workouts: {
    id: 'workouts',
    title: 'Tutorial de Treinos',
    description: tutorialSections.workouts.description,
    sections: ['workouts'],
    steps: workoutsSteps,
  },
  workout: {
    id: 'workout',
    title: 'Tutorial do treino ativo',
    description: tutorialSections.workout.description,
    sections: ['workout'],
    steps: workoutSteps,
  },
  exercises: {
    id: 'exercises',
    title: 'Tutorial da biblioteca',
    description: 'Como usar exercícios depois de criar seu primeiro treino.',
    sections: ['workouts'],
    steps: [
      step({
        id: 'exercises-panel',
        section: 'workouts',
        title: 'Biblioteca de exercícios',
        description: 'Use a biblioteca para buscar exercícios por nome, grupo muscular ou equipamento.',
        route: '/exercises',
        mode: 'panel',
      }),
    ],
  },
  history: {
    id: 'history',
    title: 'Tutorial do histórico',
    description: tutorialSections.history.description,
    sections: ['history'],
    steps: historySteps,
  },
  schedule: {
    id: 'schedule',
    title: 'Tutorial da agenda',
    description: 'Planeje sua semana sem depender de recomendações automáticas.',
    sections: ['dashboard'],
    steps: [
      step({
        id: 'schedule-panel',
        section: 'dashboard',
        title: 'Agenda semanal',
        description: 'A agenda ajuda o Dashboard a mostrar o plano do dia. Se ainda não houver agenda, o app mostra orientação inicial.',
        route: '/schedule',
        mode: 'panel',
      }),
    ],
  },
  progress: {
    id: 'progress',
    title: 'Tutorial da evolução',
    description: tutorialSections.history.description,
    sections: ['history'],
    steps: [
      step({
        id: 'progress-panel',
        section: 'history',
        title: 'Gráficos e PRs',
        description: 'Os gráficos precisam de treinos reais. No primeiro acesso, o correto é mostrar que ainda não há dados suficientes.',
        route: '/progress',
        mode: 'panel',
      }),
    ],
  },
  photosRecovery: {
    id: 'photosRecovery',
    title: 'Tutorial de evolução visual',
    description: 'Fotos e recuperação aparecem melhor depois de alguns registros.',
    sections: ['history'],
    steps: [
      step({
        id: 'photos-recovery-panel',
        section: 'history',
        title: 'Fotos e recuperação',
        description: 'Use fotos e recuperação como apoio. Evite interpretar recuperação como sugestão automática sem histórico suficiente.',
        route: '/muscle-recovery',
        mode: 'panel',
      }),
    ],
  },
  nutrition: {
    id: 'nutrition',
    title: 'Tutorial de nutrição',
    description: tutorialSections.nutrition.description,
    sections: ['nutrition'],
    steps: nutritionSteps,
  },
  notifications: {
    id: 'notifications',
    title: 'Tutorial de notificações',
    description: 'Central de lembretes e alertas importantes.',
    sections: ['settings'],
    steps: [
      step({
        id: 'notifications-panel',
        section: 'settings',
        title: 'Notificações',
        description: 'O sino mostra lembretes e avisos. Notificação de treino real aparece no Android; a simulação do tutorial não cria notificação.',
        route: '/',
        mode: 'panel',
      }),
    ],
  },
  profile: {
    id: 'profile',
    title: 'Tutorial do perfil',
    description: 'Dados da conta e preferências simples.',
    sections: ['settings'],
    steps: [
      step({
        id: 'profile-panel',
        section: 'settings',
        title: 'Perfil',
        description: 'No Perfil ficam dados pessoais e preferências rápidas. Configurações concentra tema, tutorial e privacidade.',
        route: '/profile',
        mode: 'panel',
      }),
    ],
  },
  settings: {
    id: 'settings',
    title: 'Tutorial de configurações',
    description: tutorialSections.settings.description,
    sections: ['settings'],
    steps: settingsSteps,
  },
  goals: {
    id: 'goals',
    title: 'Tutorial de metas',
    description: 'Metas funcionam melhor depois de definir uma rotina simples.',
    sections: ['dashboard'],
    steps: [
      step({
        id: 'goals-panel',
        section: 'dashboard',
        title: 'Metas',
        description: 'Comece com poucas metas claras. Depois, use seu histórico para ajustar frequência, água ou consistência.',
        route: '/goals',
        mode: 'panel',
      }),
    ],
  },
}

export const tutorialSectionOrder = Object.values(tutorialSections)
  .sort((a, b) => a.order - b.order)
  .map((section) => section.id)

export function getFlowForPath(pathname = '/') {
  if (tutorialRouteFlows[pathname]) return tutorialRouteFlows[pathname]

  const match = Object.entries(tutorialRouteFlows).find(([path]) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  })

  return match?.[1] || 'welcome'
}

export function getTutorialFlow(flowId = 'welcome') {
  return tutorialFlows[flowId] || tutorialFlows.welcome
}

export function getTutorialSection(sectionId = '') {
  return tutorialSections[sectionId] || null
}

export function getTutorialSections() {
  return tutorialSectionOrder.map((sectionId) => tutorialSections[sectionId]).filter(Boolean)
}

export function getFlowStepCount(flowId = 'welcome') {
  return getTutorialFlow(flowId).steps.length
}

export function getSectionStepCount(sectionId = '') {
  const flow = tutorialFlows[sectionId]
  if (flow) return flow.steps.length

  return Object.values(tutorialFlows).reduce((total, flowItem) => {
    return total + flowItem.steps.filter((item) => item.section === sectionId).length
  }, 0)
}
