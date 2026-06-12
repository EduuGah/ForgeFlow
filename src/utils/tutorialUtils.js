const BASE_STORAGE_KEY = 'forgeflow:tutorial-state'
const GLOBAL_DISMISSED_KEY = 'forgeflow:tutorial-welcome-dismissed'
const WELCOME_PENDING_KEY = 'forgeflow:tutorial-welcome-pending'

export const tutorialRouteFlows = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/workouts': 'workouts',
  '/exercises': 'exercises',
  '/start-workout': 'workout',
  '/progress': 'progress',
  '/exercise-progress': 'progress',
  '/settings': 'settings',
}

export const tutorialFlows = {
  welcome: {
    id: 'welcome',
    title: 'Tour inicial do ForgeFlow',
    description: 'Um guia rápido para entender as partes principais do app.',
    steps: [
      {
        title: 'Bem-vindo ao ForgeFlow',
        eyebrow: 'Passo 1 de 8',
        description:
          'Este tour mostra o básico para você criar treinos, iniciar sessões e acompanhar sua evolução sem se perder no app.',
        route: '/',
        selector: '',
        placement: 'center',
      },
      {
        title: 'Dashboard',
        eyebrow: 'Passo 2 de 8',
        description:
          'Aqui ficam seus atalhos, últimos treinos, PRs recentes e um resumo da sua semana. É o ponto de partida do app.',
        route: '/',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Treinos',
        eyebrow: 'Passo 3 de 8',
        description:
          'Na aba Treinos você cria rotinas, adiciona exercícios e deixa tudo pronto para começar o treino rapidamente.',
        route: '/workouts',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Biblioteca de exercícios',
        eyebrow: 'Passo 4 de 8',
        description:
          'Use a biblioteca para pesquisar exercícios, favoritar, filtrar por músculo/equipamento e abrir detalhes.',
        route: '/exercises',
        selector: '.ff-page-exercises main, main',
        placement: 'center',
      },
      {
        title: 'Treino ativo',
        eyebrow: 'Passo 5 de 8',
        description:
          'Durante o treino, você registra carga e repetições, marca séries concluídas, usa descanso e acompanha a progressão.',
        route: '/start-workout',
        selector: '.ff-exercise-jump-nav, main',
        placement: 'center',
      },
      {
        title: 'Evolução',
        eyebrow: 'Passo 6 de 8',
        description:
          'Em Evolução você acompanha gráficos, volume, histórico e progresso por exercício ao longo do tempo.',
        route: '/progress',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Configurações',
        eyebrow: 'Passo 7 de 8',
        description:
          'Em Configurações você personaliza tema, cor principal, preferências de treino e pode abrir este tutorial novamente.',
        route: '/settings',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Pronto para treinar',
        eyebrow: 'Passo 8 de 8',
        description:
          'Você pode rever este tutorial quando quiser em Configurações ou no botão de ajuda flutuante. Agora é só criar um treino e começar.',
        route: '/',
        selector: '',
        placement: 'center',
      },
    ],
  },
  dashboard: {
    id: 'dashboard',
    title: 'Tutorial do Dashboard',
    description: 'Entenda a tela inicial e os principais atalhos.',
    steps: [
      {
        title: 'Dashboard',
        eyebrow: 'Dashboard',
        description:
          'A tela inicial resume sua semana, últimos treinos, atalhos e informações importantes para continuar treinando.',
        route: '/',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Atalhos rápidos',
        eyebrow: 'Dashboard',
        description:
          'Use os atalhos para entrar rapidamente em treinos, exercícios, evolução e histórico.',
        route: '/',
        selector: 'main',
        placement: 'center',
      },
    ],
  },
  workouts: {
    id: 'workouts',
    title: 'Tutorial de Treinos',
    description: 'Aprenda a criar e editar rotinas.',
    steps: [
      {
        title: 'Treinos',
        eyebrow: 'Treinos',
        description:
          'Aqui você cria treinos, organiza por pasta e monta os exercícios que serão usados no treino ativo.',
        route: '/workouts',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Adicionando exercícios',
        eyebrow: 'Treinos',
        description:
          'Ao adicionar um exercício, ele entra com uma série inicial. Depois você adiciona séries, aquecimento e notas dentro do card.',
        route: '/workouts',
        selector: 'main',
        placement: 'center',
      },
    ],
  },
  workout: {
    id: 'workout',
    title: 'Tutorial do treino ativo',
    description: 'Aprenda como registrar séries, descanso e progressão.',
    steps: [
      {
        title: 'Treino ativo',
        eyebrow: 'Treino ativo',
        description:
          'Cada exercício tem seu próprio card. Clique em um exercício na barra “Ir para exercício” para rolar direto até ele.',
        route: '/start-workout',
        selector: '.ff-exercise-jump-nav, main',
        placement: 'bottom',
      },
      {
        title: 'Séries',
        eyebrow: 'Treino ativo',
        description:
          'Dentro do card você adiciona série normal, aquecimento, remove séries e marca carga/reps.',
        route: '/start-workout',
        selector: '.ff-active-exercise-card, main',
        placement: 'center',
      },
      {
        title: 'Progressão',
        eyebrow: 'Treino ativo',
        description:
          'Quando houver histórico, os campos mostram referência do último treino e a progressão ajuda a decidir se aumenta ou mantém a carga.',
        route: '/start-workout',
        selector: '.ff-progression-glow, main',
        placement: 'center',
      },
    ],
  },
  exercises: {
    id: 'exercises',
    title: 'Tutorial da biblioteca',
    description: 'Veja como pesquisar, filtrar e usar exercícios.',
    steps: [
      {
        title: 'Biblioteca',
        eyebrow: 'Exercícios',
        description:
          'A biblioteca reúne exercícios padrão e criados por você. Use busca, filtros rápidos e favoritos.',
        route: '/exercises',
        selector: '.ff-exercise-quick-filter, main',
        placement: 'bottom',
      },
      {
        title: 'Detalhes',
        eyebrow: 'Exercícios',
        description:
          'Abra Detalhes para ver mídia, músculos, equipamento, instruções e dicas do exercício.',
        route: '/exercises',
        selector: 'main',
        placement: 'center',
      },
    ],
  },
  progress: {
    id: 'progress',
    title: 'Tutorial da evolução',
    description: 'Entenda gráficos, volume e progresso por exercício.',
    steps: [
      {
        title: 'Evolução',
        eyebrow: 'Evolução',
        description:
          'Use esta área para acompanhar volume, frequência, PRs e progresso por exercício.',
        route: '/progress',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Progresso por exercício',
        eyebrow: 'Evolução',
        description:
          'Quando quiser analisar um exercício específico, entre na tela de progresso por exercício para ver carga e volume ao longo do tempo.',
        route: '/exercise-progress',
        selector: 'main',
        placement: 'center',
      },
    ],
  },
  settings: {
    id: 'settings',
    title: 'Tutorial de configurações',
    description: 'Personalize o app e reabra tutoriais.',
    steps: [
      {
        title: 'Configurações',
        eyebrow: 'Configurações',
        description:
          'Aqui você muda tema, cor principal, preferências de treino, exportações e tutoriais.',
        route: '/settings',
        selector: 'main',
        placement: 'center',
      },
      {
        title: 'Tutorial guiado',
        eyebrow: 'Configurações',
        description:
          'Sempre que quiser rever o guia, use os botões da seção Tutorial guiado.',
        route: '/settings',
        selector: 'main',
        placement: 'center',
      },
    ],
  },
}

export function getFlowForPath(pathname = '/') {
  if (tutorialRouteFlows[pathname]) return tutorialRouteFlows[pathname]

  const match = Object.entries(tutorialRouteFlows).find(([path]) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  })

  return match?.[1] || 'welcome'
}

export function getTutorialStorageKey(user) {
  const id = user?.id || user?._id || user?.email || 'anonymous'
  return `${BASE_STORAGE_KEY}:${id}`
}

export function getTutorialUserId(user) {
  return String(user?.id || user?._id || user?.email || '').trim()
}

export function getWelcomePendingKey(user) {
  const id = getTutorialUserId(user)
  return id ? `${WELCOME_PENDING_KEY}:${id}` : ''
}

export function getTutorialState(user) {
  try {
    const rawValue = window.localStorage.getItem(getTutorialStorageKey(user))
    const parsed = JSON.parse(rawValue || '{}')
    const globalDismissed =
      !user && window.localStorage.getItem(GLOBAL_DISMISSED_KEY) === 'true'

    return {
      hasSeenWelcome: Boolean(parsed.hasSeenWelcome || globalDismissed),
      dismissedWelcome: Boolean(parsed.dismissedWelcome || globalDismissed),
      contextualTipsEnabled: parsed.contextualTipsEnabled === true,
      completedFlows: parsed.completedFlows || {},
      updatedAt: parsed.updatedAt || '',
    }
  } catch {
    return {
      hasSeenWelcome: false,
      dismissedWelcome: false,
      contextualTipsEnabled: false,
      completedFlows: {},
      updatedAt: '',
    }
  }
}

export function saveTutorialState(user, nextState) {
  const safeState = {
    ...nextState,
    updatedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(getTutorialStorageKey(user), JSON.stringify(safeState))

  if (!user && (safeState.dismissedWelcome || safeState.hasSeenWelcome)) {
    window.localStorage.setItem(GLOBAL_DISMISSED_KEY, 'true')
  }

  return safeState
}

export function resetTutorialState(user) {
  window.localStorage.removeItem(getTutorialStorageKey(user))
  window.localStorage.removeItem(GLOBAL_DISMISSED_KEY)
  const pendingKey = getWelcomePendingKey(user)
  if (pendingKey) window.localStorage.removeItem(pendingKey)
}

export function markWelcomeTutorialPending(user) {
  const pendingKey = getWelcomePendingKey(user)
  if (!pendingKey) return

  window.localStorage.setItem(pendingKey, 'true')
}

export function clearWelcomeTutorialPending(user) {
  const pendingKey = getWelcomePendingKey(user)
  if (!pendingKey) return

  window.localStorage.removeItem(pendingKey)
}

export function hasWelcomeTutorialPending(user) {
  const pendingKey = getWelcomePendingKey(user)
  if (!pendingKey) return false

  return window.localStorage.getItem(pendingKey) === 'true'
}

export function shouldShowWelcomeTutorial(user, state = null) {
  if (!user || !user.profileCompleted) return false
  if (!hasWelcomeTutorialPending(user)) return false

  // Não abre mais o card automaticamente a cada sessão.
  // O tutorial continua disponível manualmente em Configurações ou pelo botão de ajuda.
  if (!user || !user.profileCompleted) return false

  const tutorialState = state || getTutorialState(user)

  return !tutorialState.hasSeenWelcome && !tutorialState.dismissedWelcome
}
