export const TUTORIAL_VERSION = 2

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
    description: 'Entenda a proposta do ForgeFlow e como controlar o guia.',
  },
  dashboard: {
    id: 'dashboard',
    order: 2,
    title: 'Dashboard',
    shortTitle: 'Dashboard',
    description: 'Seu centro de treino, semana, resumo e próxima ação.',
  },
  navigation: {
    id: 'navigation',
    order: 3,
    title: 'Navegação',
    shortTitle: 'Navegação',
    description: 'Header, menu, notificações, instalação e barra inferior.',
  },
  workouts: {
    id: 'workouts',
    order: 4,
    title: 'Treinos',
    shortTitle: 'Treinos',
    description: 'Criar, organizar, editar e iniciar rotinas.',
  },
  workout: {
    id: 'workout',
    order: 5,
    title: 'Treino ativo',
    shortTitle: 'Ativo',
    description: 'Registrar kg, reps, séries, descanso e finalização segura.',
  },
  exercises: {
    id: 'exercises',
    order: 6,
    title: 'Exercícios',
    shortTitle: 'Exercícios',
    description: 'Biblioteca, busca, filtros, detalhes e progresso por exercício.',
  },
  history: {
    id: 'history',
    order: 7,
    title: 'Histórico',
    shortTitle: 'Histórico',
    description: 'Treinos finalizados, volume, PRs e compartilhamento.',
  },
  schedule: {
    id: 'schedule',
    order: 8,
    title: 'Agenda',
    shortTitle: 'Agenda',
    description: 'Semana de treinos, dias de descanso e treino do dia.',
  },
  progress: {
    id: 'progress',
    order: 9,
    title: 'Evolução',
    shortTitle: 'Evolução',
    description: 'Gráficos, filtros, volume, frequência e PRs.',
  },
  photosRecovery: {
    id: 'photosRecovery',
    order: 10,
    title: 'Fotos e recuperação',
    shortTitle: 'Fotos/Recup.',
    description: 'Fotos de progresso, comparação visual e recuperação muscular.',
  },
  nutrition: {
    id: 'nutrition',
    order: 11,
    title: 'Nutrição',
    shortTitle: 'Nutrição',
    description: 'Água, refeições, metas e histórico nutricional.',
  },
  notifications: {
    id: 'notifications',
    order: 12,
    title: 'Notificações',
    shortTitle: 'Notificações',
    description: 'Sino, central, preferências e arquivadas.',
  },
  settings: {
    id: 'settings',
    order: 13,
    title: 'Perfil e Configurações',
    shortTitle: 'Config.',
    description: 'Perfil, tema, cor do app, privacidade e revisão do tutorial.',
  },
  goals: {
    id: 'goals',
    order: 14,
    title: 'Metas',
    shortTitle: 'Metas',
    description: 'Acompanhe objetivos de treino, hábitos e consistência.',
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
  allowInteraction = false,
  optional = false,
  canSkip = true,
  targetLabel = '',
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
  }
}

const welcomeSteps = [
  step({
    id: 'welcome-intro',
    section: 'welcome',
    title: 'Bem-vindo ao ForgeFlow',
    description: 'O ForgeFlow registra seus treinos, acompanha evolução e transforma consistência em histórico claro.',
    example: 'O guia agora é curto: você pode avançar, voltar, pular uma etapa ou rever depois.',
    route: '/',
    placement: 'center',
  }),
  step({
    id: 'welcome-how-it-works',
    section: 'welcome',
    title: 'Como o app te ajuda',
    description: 'Registre kg, reps e séries. Depois, esses dados viram histórico, gráficos, PRs e insights.',
    example: 'Nada do treino teste entra no histórico real.',
    route: '/',
    placement: 'center',
  }),
]

const dashboardSteps = [
  step({
    id: 'dashboard-hero',
    section: 'dashboard',
    title: 'Seu centro de treino',
    description: 'Aqui ficam seu resumo semanal, último treino e estado geral do app.',
    example: 'Com alguns registros, este topo passa a mostrar sua evolução com mais contexto.',
    target: '[data-tutorial="dashboard-hero"]',
    route: '/',
    placement: 'bottom',
    requireElement: true,
    targetLabel: 'Dashboard',
  }),
  step({
    id: 'dashboard-next-action',
    section: 'dashboard',
    title: 'Próximo passo com contexto',
    description: 'Este card mostra uma ação útil sem inventar recomendação quando ainda não há dados suficientes.',
    example: 'Usuário novo vê orientação para começar, não sugestões aleatórias de músculo.',
    target: '[data-tutorial="dashboard-next-action"]',
    route: '/',
    placement: 'top',
    targetLabel: 'Próxima ação',
  }),
  step({
    id: 'dashboard-summary',
    section: 'dashboard',
    title: 'Visão geral do dia',
    description: 'Resumo de treino, água, metas e recuperação em uma leitura rápida.',
    example: 'Use os cards para ir direto à página que precisa atualizar.',
    target: '[data-tutorial="dashboard-summary"]',
    route: '/',
    placement: 'top',
    targetLabel: 'Resumo',
  }),
]

const navigationSteps = [
  step({
    id: 'navigation-header',
    section: 'navigation',
    title: 'Topo do app',
    description: 'O header mostra a marca, atalhos do app e notificações importantes.',
    example: 'O ícone do ForgeFlow acompanha a identidade visual do app.',
    target: '[data-tutorial="app-header"]',
    route: '/',
    placement: 'bottom',
    requireElement: true,
    targetLabel: 'Header',
  }),
  step({
    id: 'navigation-bottom',
    section: 'navigation',
    title: 'Barra inferior',
    description: 'Use a barra inferior para trocar rapidamente entre Dashboard, Treinos, Exercícios, Progresso e Configurações.',
    example: 'No APK ela é o caminho principal entre as áreas.',
    target: '[data-tutorial="bottom-nav"]',
    route: '/',
    placement: 'top',
    requireElement: true,
    targetLabel: 'Navegação',
  }),
]

const workoutsSteps = [
  step({
    id: 'workouts-list',
    section: 'workouts',
    title: 'Onde ficam seus treinos',
    description: 'Suas rotinas aparecem aqui para editar, organizar ou iniciar.',
    example: 'Crie poucas rotinas primeiro e evolua conforme usar o app.',
    target: '[data-tutorial="workouts-list"]',
    route: '/workouts',
    placement: 'bottom',
    targetLabel: 'Treinos',
  }),
  step({
    id: 'workouts-create-start',
    section: 'workouts',
    title: 'Criar ou iniciar treino',
    description: 'Use este botão/card para montar uma rotina nova ou começar uma existente.',
    example: 'Ao iniciar, o ForgeFlow abre a tela de treino ativo.',
    target: '[data-tutorial="create-workout-button"], [data-tutorial="workout-start-button"]',
    route: '/workouts',
    placement: 'bottom',
    targetLabel: 'Criar/iniciar',
  }),
]

const workoutSteps = [
  step({
    id: 'active-workout-header',
    section: 'workout',
    title: 'Treino ativo',
    description: 'Esta tela guarda o treino em andamento, tempo, progresso e exercício atual.',
    example: 'No modo tutorial, a sessão é local e descartável.',
    target: '[data-tutorial="active-workout-header"]',
    route: '/start-workout',
    placement: 'bottom',
    requireElement: true,
    targetLabel: 'Treino ativo',
  }),
  step({
    id: 'active-exercise-card',
    section: 'workout',
    title: 'Exercício atual',
    description: 'Cada card concentra séries, troca de exercício, histórico do movimento e ações rápidas.',
    example: 'Comece pelo primeiro exercício pendente.',
    target: '[data-tutorial="active-exercise-card"]',
    route: '/start-workout',
    placement: 'top',
    requireElement: true,
    targetLabel: 'Exercício',
  }),
  step({
    id: 'active-set-inputs',
    section: 'workout',
    title: 'Kg, reps e concluir',
    description: 'Preencha carga e repetições. Depois toque em concluir para registrar a série.',
    example: 'Esses dados alimentam histórico, gráficos e recordes pessoais.',
    target: '[data-tutorial="active-set-complete-button"], [data-tutorial="active-set-row"]',
    route: '/start-workout',
    placement: 'top',
    allowInteraction: true,
    requireElement: true,
    targetLabel: 'Registrar série',
  }),
  step({
    id: 'active-workout-notes',
    section: 'workout',
    title: 'Observações do treino',
    description: 'Use este campo para anotar dor, energia, técnica, ajustes de carga ou qualquer detalhe importante.',
    example: 'As observações aparecem na confirmação e ajudam a revisar o histórico depois.',
    target: '[data-tutorial="active-workout-notes"]',
    route: '/start-workout',
    placement: 'bottom',
    allowInteraction: true,
    targetLabel: 'Observações',
  }),
  step({
    id: 'active-finish-workout',
    section: 'workout',
    title: 'Finalizar com segurança',
    description: 'Ao concluir o treino, o ForgeFlow mostra uma confirmação antes de salvar no histórico.',
    example: 'Treino de tutorial é descartado e não vira treino real.',
    target: '[data-tutorial="active-finish-workout-bottom"], [data-tutorial="active-finish-workout-hero"], [data-tutorial="active-finish-workout-desktop"]',
    route: '/start-workout',
    placement: 'top',
    targetLabel: 'Concluir treino',
  }),
]

const exercisesSteps = [
  step({
    id: 'exercises-library',
    section: 'exercises',
    title: 'Biblioteca de exercícios',
    description: 'Busque exercícios por nome, grupo muscular ou equipamento.',
    example: 'Use os detalhes para acompanhar evolução por exercício.',
    target: '[data-tutorial="exercise-library"]',
    route: '/exercises',
    placement: 'bottom',
    targetLabel: 'Biblioteca',
  }),
]

const historySteps = [
  step({
    id: 'history-list',
    section: 'history',
    title: 'Histórico e PRs',
    description: 'Treinos finalizados aparecem aqui com volume, séries, detalhes e recordes.',
    example: 'Depois do primeiro treino salvo, esta página vira sua memória de evolução.',
    target: '[data-tutorial="history-list"]',
    route: '/history',
    placement: 'bottom',
    targetLabel: 'Histórico',
  }),
]

const scheduleSteps = [
  step({
    id: 'schedule-week',
    section: 'schedule',
    title: 'Agenda semanal',
    description: 'Planeje treinos e descansos para o ForgeFlow mostrar o plano do dia.',
    example: 'Sem agenda, o app evita recomendações automáticas sem base.',
    target: '[data-tutorial="schedule-week"]',
    route: '/schedule',
    placement: 'bottom',
    targetLabel: 'Semana',
  }),
]

const progressSteps = [
  step({
    id: 'progress-overview',
    section: 'progress',
    title: 'Gráficos e evolução',
    description: 'Veja volume, frequência, peso e PRs conforme registra treinos.',
    example: 'Os gráficos ficam mais úteis depois de alguns registros reais.',
    target: '[data-tutorial="progress-overview"]',
    route: '/progress',
    placement: 'bottom',
    targetLabel: 'Evolução',
  }),
]

const photosRecoverySteps = [
  step({
    id: 'photos-recovery-overview',
    section: 'photosRecovery',
    title: 'Fotos e recuperação',
    description: 'Use fotos e recuperação muscular como apoio visual, não como regra absoluta.',
    example: 'A recuperação só deve orientar quando houver histórico suficiente.',
    target: '[data-tutorial="recovery-overview"], [data-tutorial="progress-photos-gallery"]',
    route: '/muscle-recovery',
    placement: 'bottom',
    optional: true,
    targetLabel: 'Fotos/recuperação',
  }),
]

const nutritionSteps = [
  step({
    id: 'nutrition-overview',
    section: 'nutrition',
    title: 'Nutrição e insights',
    description: 'Registre água e refeições de forma rápida. Os insights principais ficam no topo.',
    example: 'Use o lápis nos cards para editar sem descer a página inteira.',
    target: '[data-tutorial="nutrition-overview"]',
    route: '/nutrition',
    placement: 'bottom',
    targetLabel: 'Nutrição',
  }),
]

const notificationsSteps = [
  step({
    id: 'notifications-bell',
    section: 'notifications',
    title: 'Notificações',
    description: 'O sino mostra alertas, lembretes e avisos do app.',
    example: 'Você pode arquivar, marcar como lida e revisar depois.',
    target: '[data-tutorial="notification-bell"]',
    route: '/',
    placement: 'bottom',
    targetLabel: 'Sino',
  }),
]

const settingsSteps = [
  step({
    id: 'settings-tutorial',
    section: 'settings',
    title: 'Rever tutorial',
    description: 'Em Configurações você pode continuar, reiniciar ou rever partes específicas do tutorial.',
    example: 'Use quando quiser lembrar como alguma área funciona.',
    target: '[data-tutorial="settings-tutorial"]',
    route: '/settings',
    placement: 'top',
    targetLabel: 'Tutorial e ajuda',
  }),
]

const goalsSteps = [
  step({
    id: 'goals-overview',
    section: 'goals',
    title: 'Metas',
    description: 'Crie metas simples para acompanhar hábitos, volume, frequência ou progresso.',
    example: 'Escolha poucas metas por vez para não se perder.',
    target: '[data-tutorial="goals-overview"]',
    route: '/goals',
    placement: 'bottom',
    targetLabel: 'Metas',
  }),
]

export const tutorialFlows = {
  welcome: {
    id: 'welcome',
    title: 'Tour inicial do ForgeFlow',
    description: 'Um guia curto pelas áreas mais importantes do app.',
    sections: ['welcome', 'dashboard', 'navigation', 'workout', 'settings'],
    steps: [
      ...welcomeSteps,
      ...dashboardSteps,
      ...navigationSteps,
      workoutsSteps[0],
      workoutsSteps[1],
      workoutSteps[0],
      workoutSteps[1],
      workoutSteps[2],
      workoutSteps[3],
      workoutSteps[4],
      historySteps[0],
      progressSteps[0],
      nutritionSteps[0],
      settingsSteps[0],
    ],
  },
  dashboard: {
    id: 'dashboard',
    title: 'Tutorial do Dashboard',
    description: tutorialSections.dashboard.description,
    sections: ['dashboard'],
    steps: dashboardSteps,
  },
  navigation: {
    id: 'navigation',
    title: 'Tutorial da navegação',
    description: tutorialSections.navigation.description,
    sections: ['navigation'],
    steps: navigationSteps,
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
        placement: 'bottom',
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
