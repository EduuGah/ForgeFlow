export const TUTORIAL_VERSION = 3

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
  '/progress-photos': 'photosRecovery',
  '/muscle-recovery': 'photosRecovery',
  '/nutrition': 'nutrition',
  '/notifications': 'notifications',
  '/profile': 'profile',
  '/settings': 'settings',
  '/goals': 'goals',
}

export const tutorialSections = {
  welcome: {
    id: 'welcome',
    order: 1,
    title: 'Boas-vindas',
    shortTitle: 'Início',
    description: 'O básico para começar sem se perder.',
  },
  dashboard: {
    id: 'dashboard',
    order: 2,
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    description: 'Seu resumo principal do ForgeFlow.',
  },
  navigation: {
    id: 'navigation',
    order: 3,
    title: 'Navegação',
    shortTitle: 'Navegação',
    description: 'Como circular pelo app sem depender de dicas longas.',
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
    description: 'Registrar kg, reps, observações e finalizar com segurança.',
  },
  exercises: {
    id: 'exercises',
    order: 6,
    title: 'Exercícios',
    shortTitle: 'Exercícios',
    description: 'Biblioteca, busca e detalhes por exercício.',
  },
  history: {
    id: 'history',
    order: 7,
    title: 'Histórico',
    shortTitle: 'Histórico',
    description: 'Treinos finalizados, volume e PRs.',
  },
  schedule: {
    id: 'schedule',
    order: 8,
    title: 'Agenda',
    shortTitle: 'Agenda',
    description: 'Planeje treinos e dias de descanso.',
  },
  progress: {
    id: 'progress',
    order: 9,
    title: 'Evolução',
    shortTitle: 'Evolução',
    description: 'Gráficos e análise depois que houver histórico.',
  },
  photosRecovery: {
    id: 'photosRecovery',
    order: 10,
    title: 'Fotos e recuperação',
    shortTitle: 'Fotos/Recup.',
    description: 'Apoio visual e recuperação muscular.',
  },
  nutrition: {
    id: 'nutrition',
    order: 11,
    title: 'Nutrição',
    shortTitle: 'Nutrição',
    description: 'Água, refeições, metas e insights simples.',
  },
  notifications: {
    id: 'notifications',
    order: 12,
    title: 'Notificações',
    shortTitle: 'Notificações',
    description: 'Central de avisos e lembretes.',
  },
  settings: {
    id: 'settings',
    order: 13,
    title: 'Perfil e Configurações',
    shortTitle: 'Config.',
    description: 'Tema, cor do app, perfil e ajuda.',
  },
  goals: {
    id: 'goals',
    order: 14,
    title: 'Metas',
    shortTitle: 'Metas',
    description: 'Objetivos simples de hábito, treino e consistência.',
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
  placement = 'auto',
  requireElement = false,
  scrollIntoView = true,
  allowInteraction = true,
  optional = false,
  canSkip = true,
  targetLabel = '',
  presentation = '',
  inlinePlacement = 'after',
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
    placement,
    requireElement,
    scrollIntoView,
    allowInteraction,
    optional,
    canSkip,
    targetLabel,
    presentation,
    inlinePlacement,
  }
}

const welcomeSteps = [
  step({
    id: 'welcome-intro',
    section: 'welcome',
    title: 'Bem-vindo ao ForgeFlow',
    description: 'Este guia foi reformulado para não ficar em cima dos cards. As dicas aparecem no fluxo da página ou em um painel curto quando não há um alvo seguro.',
    example: 'Você pode avançar, voltar, pular uma etapa ou rever depois nas Configurações.',
    route: '/',
    placement: 'center',
    presentation: 'panel',
  }),
]

const dashboardSteps = [
  step({
    id: 'dashboard-hero',
    section: 'dashboard',
    title: 'Dashboard',
    description: 'Aqui fica a visão principal do app. No começo, o ForgeFlow evita recomendações sem histórico e mostra estados iniciais honestos.',
    example: 'Depois dos primeiros treinos, este resumo ganha mais contexto.',
    target: '[data-tutorial="dashboard-hero"]',
    route: '/',
    inlinePlacement: 'after',
    targetLabel: 'Dashboard',
  }),
  step({
    id: 'dashboard-navigation',
    section: 'navigation',
    title: 'Como navegar',
    description: 'Use a barra inferior para ir até Treinos, Exercícios, Progresso e Configurações. Ela não será destacada para evitar conflito com a área fixa do celular.',
    example: 'Quando uma área fixa atrapalha, o tutorial explica sem tentar cobrir a tela.',
    route: '/',
    placement: 'center',
    presentation: 'panel',
  }),
]

const workoutsSteps = [
  step({
    id: 'workouts-create',
    section: 'workouts',
    title: 'Criar ou iniciar treino',
    description: 'Na aba Treinos você cria rotinas e inicia uma sessão real. O tutorial pode abrir uma sessão teste sem salvar nada no histórico.',
    example: 'Treinos reais continuam intactos; treino de tutorial é descartável.',
    target: '[data-tutorial="create-workout-button"], [data-tutorial="workouts-list"]',
    route: '/workouts',
    inlinePlacement: 'after',
    targetLabel: 'Treinos',
  }),
]

const workoutSteps = [
  step({
    id: 'active-overview',
    section: 'workout',
    title: 'Treino ativo',
    description: 'Esta é a tela onde você registra o treino. A sessão teste não gera notificação e não entra no histórico real.',
    example: 'Se já existir treino real ativo, o ForgeFlow usa o treino real como exemplo sem sobrescrever dados.',
    target: '[data-tutorial="active-workout-header"]',
    route: '/start-workout',
    inlinePlacement: 'after',
    targetLabel: 'Treino ativo',
  }),
  step({
    id: 'active-register-set',
    section: 'workout',
    title: 'Kg, reps e série',
    description: 'Preencha carga e repetições e toque em concluir série. Esses dados alimentam histórico, volume e PRs.',
    example: 'Use valores fictícios no modo tutorial. Nada disso vira treino real.',
    target: '[data-tutorial="active-set-row"], [data-tutorial="active-set-complete-button"]',
    route: '/start-workout',
    inlinePlacement: 'before',
    targetLabel: 'Série',
  }),
  step({
    id: 'active-notes',
    section: 'workout',
    title: 'Observações',
    description: 'Anote técnica, dor, energia ou ajustes. As observações ajudam a entender seu histórico depois.',
    example: 'Exemplo: “ombro incomodou no supino” ou “subir carga na próxima”.',
    target: '[data-tutorial="active-workout-notes"]',
    route: '/start-workout',
    inlinePlacement: 'before',
    targetLabel: 'Observações',
  }),
  step({
    id: 'active-finish-safe',
    section: 'workout',
    title: 'Finalização segura',
    description: 'Para evitar toque acidental, a finalização pede confirmação e mostra um resumo antes de salvar.',
    example: 'No tutorial, finalizar apenas descarta a demonstração. No treino real, salva no histórico.',
    route: '/start-workout',
    placement: 'center',
    presentation: 'panel',
  }),
]

const exercisesSteps = [
  step({
    id: 'exercises-library',
    section: 'exercises',
    title: 'Biblioteca de exercícios',
    description: 'Busque por nome, grupo muscular ou equipamento e acompanhe evolução por exercício.',
    example: 'Se ainda não houver histórico, a tela mostra estado inicial.',
    target: '[data-tutorial="exercise-library"]',
    route: '/exercises',
    inlinePlacement: 'after',
    targetLabel: 'Biblioteca',
  }),
]

const historySteps = [
  step({
    id: 'history-empty-aware',
    section: 'history',
    title: 'Histórico e PRs',
    description: 'O histórico aparece depois de finalizar treinos reais. Em conta nova, é normal não haver gráficos ou PRs ainda.',
    example: 'Finalize alguns treinos para liberar volume, recordes e comparações.',
    route: '/history',
    placement: 'center',
    presentation: 'panel',
  }),
]

const scheduleSteps = [
  step({
    id: 'schedule-week',
    section: 'schedule',
    title: 'Agenda semanal',
    description: 'Planeje treinos e descansos para o Dashboard mostrar o plano do dia sem inventar recomendações.',
    example: 'Sem agenda, o app mostra orientação inicial em vez de sugestão automática.',
    target: '[data-tutorial="schedule-week"]',
    route: '/schedule',
    inlinePlacement: 'after',
    targetLabel: 'Semana',
  }),
]

const progressSteps = [
  step({
    id: 'progress-empty-aware',
    section: 'progress',
    title: 'Evolução',
    description: 'Gráficos precisam de histórico real. No primeiro acesso, o mais correto é mostrar que ainda não há dados suficientes.',
    example: 'Depois dos primeiros treinos, aqui entram volume, frequência e PRs.',
    route: '/progress',
    placement: 'center',
    presentation: 'panel',
  }),
]

const photosRecoverySteps = [
  step({
    id: 'photos-recovery-overview',
    section: 'photosRecovery',
    title: 'Fotos e recuperação',
    description: 'Use fotos e recuperação como apoio visual. Recuperação muscular só deve orientar quando houver histórico suficiente.',
    example: 'Em conta nova, evite interpretar porcentagens como recomendação automática.',
    route: '/muscle-recovery',
    placement: 'center',
    presentation: 'panel',
  }),
]

const nutritionSteps = [
  step({
    id: 'nutrition-overview',
    section: 'nutrition',
    title: 'Nutrição',
    description: 'Registre água e refeições rapidamente. Os insights principais ficam no topo para não precisar descer a tela inteira.',
    example: 'Se ainda não houver registros, o app mostra um resumo inicial simples.',
    route: '/nutrition',
    placement: 'center',
    presentation: 'panel',
  }),
]

const notificationsSteps = [
  step({
    id: 'notifications-overview',
    section: 'notifications',
    title: 'Notificações',
    description: 'O sino mostra alertas, lembretes e avisos importantes. A central permite marcar, arquivar e revisar depois.',
    example: 'Notificação de treino ativo real continua no Android; treino teste do tutorial não cria notificação.',
    route: '/',
    placement: 'center',
    presentation: 'panel',
  }),
]

const settingsSteps = [
  step({
    id: 'settings-tutorial',
    section: 'settings',
    title: 'Rever depois',
    description: 'Em Configurações você pode reiniciar o tutorial, rever uma seção ou deixar para outro momento.',
    example: 'O guia foi feito para ajudar, não para prender você em várias etapas.',
    route: '/settings',
    placement: 'center',
    presentation: 'panel',
  }),
]

const goalsSteps = [
  step({
    id: 'goals-overview',
    section: 'goals',
    title: 'Metas',
    description: 'Use metas simples de treino, hábito ou consistência. Poucas metas bem claras funcionam melhor.',
    example: 'Evite cadastrar muitas metas de uma vez no início.',
    target: '[data-tutorial="goals-overview"]',
    route: '/goals',
    inlinePlacement: 'after',
    targetLabel: 'Metas',
  }),
]

export const tutorialFlows = {
  welcome: {
    id: 'welcome',
    title: 'Tour essencial do ForgeFlow',
    description: 'Um guia curto, sem cards cobrindo o que você precisa ver.',
    sections: ['welcome', 'dashboard', 'navigation', 'workouts', 'workout', 'history', 'nutrition', 'settings'],
    steps: [
      welcomeSteps[0],
      dashboardSteps[0],
      dashboardSteps[1],
      workoutsSteps[0],
      workoutSteps[0],
      workoutSteps[1],
      workoutSteps[2],
      workoutSteps[3],
      historySteps[0],
      nutritionSteps[0],
      settingsSteps[0],
    ],
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
    steps: [dashboardSteps[1]],
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
    description: tutorialSections.exercises.description,
    sections: ['exercises'],
    steps: exercisesSteps,
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
    description: tutorialSections.schedule.description,
    sections: ['schedule'],
    steps: scheduleSteps,
  },
  progress: {
    id: 'progress',
    title: 'Tutorial da evolução',
    description: tutorialSections.progress.description,
    sections: ['progress'],
    steps: progressSteps,
  },
  photosRecovery: {
    id: 'photosRecovery',
    title: 'Tutorial de fotos e recuperação',
    description: tutorialSections.photosRecovery.description,
    sections: ['photosRecovery'],
    steps: photosRecoverySteps,
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
    description: tutorialSections.notifications.description,
    sections: ['notifications'],
    steps: notificationsSteps,
  },
  profile: {
    id: 'profile',
    title: 'Tutorial do perfil',
    description: 'Veja seus dados, preferências e atalhos da conta.',
    sections: ['settings'],
    steps: [
      step({
        id: 'profile-overview',
        section: 'settings',
        title: 'Perfil',
        description: 'A página de Perfil concentra dados pessoais, experiência do app e preferências do usuário.',
        example: 'Use Configurações para aparência, tutorial e privacidade avançada.',
        target: '[data-tutorial="profile-overview"]',
        route: '/profile',
        inlinePlacement: 'after',
        targetLabel: 'Perfil',
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
    description: tutorialSections.goals.description,
    sections: ['goals'],
    steps: goalsSteps,
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
