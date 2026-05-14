const SMART_DEFAULT_TEMPLATE_BLUEPRINTS = [
    {
        kind: 'push',
        name: 'Push - Peito, Ombros e Tríceps',
        description: 'Treino pronto de empurrar com exercícios para peito, ombros e tríceps.',
        category: 'Push Pull Legs',
        goal: 'Hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 60,
        groups: ['Peito', 'Peito', 'Ombros', 'Ombros', 'Tríceps', 'Tríceps'],
        fallbackKeywords: ['supino', 'peito', 'chest', 'desenvolvimento', 'ombro', 'triceps', 'tríceps'],
        limit: 6,
    },
    {
        kind: 'pull',
        name: 'Pull - Costas e Bíceps',
        description: 'Treino pronto de puxar com exercícios para costas, bíceps e posterior de ombro.',
        category: 'Push Pull Legs',
        goal: 'Hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 60,
        groups: ['Costas', 'Costas', 'Costas', 'Bíceps', 'Bíceps', 'Ombros'],
        fallbackKeywords: ['puxada', 'remada', 'costas', 'back', 'rosca', 'bíceps', 'biceps', 'face pull'],
        limit: 6,
    },
    {
        kind: 'legs',
        name: 'Legs - Pernas completo',
        description: 'Treino pronto de pernas com foco em quadríceps, posterior, glúteos e panturrilhas.',
        category: 'Push Pull Legs',
        goal: 'Hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 70,
        groups: ['Quadríceps', 'Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilhas', 'Abdômen'],
        fallbackKeywords: ['agachamento', 'leg press', 'cadeira', 'mesa', 'posterior', 'panturrilha', 'gluteo', 'glúteo', 'perna'],
        limit: 6,
    },
    {
        kind: 'upper',
        name: 'Upper - Superiores',
        description: 'Treino pronto para membros superiores em divisão Upper/Lower.',
        category: 'Upper Lower',
        goal: 'Força e hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 65,
        groups: ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps'],
        fallbackKeywords: ['supino', 'puxada', 'remada', 'desenvolvimento', 'rosca', 'triceps', 'tríceps'],
        limit: 5,
    },
    {
        kind: 'lower',
        name: 'Lower - Inferiores',
        description: 'Treino pronto para membros inferiores em divisão Upper/Lower.',
        category: 'Upper Lower',
        goal: 'Força e hipertrofia',
        difficulty: 'Intermediário',
        estimatedDuration: 65,
        groups: ['Quadríceps', 'Posterior de coxa', 'Glúteos', 'Panturrilhas', 'Abdômen'],
        fallbackKeywords: ['agachamento', 'leg press', 'posterior', 'panturrilha', 'gluteo', 'glúteo', 'abdomen', 'abdômen'],
        limit: 5,
    },
    {
        kind: 'full-body',
        name: 'Full Body - Corpo inteiro',
        description: 'Treino pronto de corpo inteiro misturando os principais grupos musculares.',
        category: 'Full Body',
        goal: 'Condicionamento geral',
        difficulty: 'Iniciante',
        estimatedDuration: 50,
        groups: ['Peito', 'Costas', 'Quadríceps', 'Ombros', 'Abdômen'],
        fallbackKeywords: ['supino', 'remada', 'agachamento', 'desenvolvimento', 'prancha', 'abdomen', 'abdômen'],
        limit: 5,
    },
]

function normalizeSmartText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

function normalizeSmartGroup(group) {
    const normalized = normalizeSmartText(group)

    const aliases = {
        peito: 'peito',
        peitoral: 'peito',
        chest: 'peito',
        costas: 'costas',
        dorsal: 'costas',
        back: 'costas',
        ombro: 'ombros',
        ombros: 'ombros',
        deltoide: 'ombros',
        deltoides: 'ombros',
        shoulder: 'ombros',
        shoulders: 'ombros',
        biceps: 'bíceps',
        triceps: 'tríceps',
        quadriceps: 'quadríceps',
        pernas: 'quadríceps',
        perna: 'quadríceps',
        quads: 'quadríceps',
        posterior: 'posterior de coxa',
        posteriores: 'posterior de coxa',
        hamstrings: 'posterior de coxa',
        posterior_de_coxa: 'posterior de coxa',
        gluteos: 'glúteos',
        glutes: 'glúteos',
        panturrilha: 'panturrilhas',
        panturrilhas: 'panturrilhas',
        calves: 'panturrilhas',
        abdomen: 'abdômen',
        abdomem: 'abdômen',
        abdome: 'abdômen',
        abs: 'abdômen',
        core: 'abdômen',
        lombar: 'lombar',
        lowerback: 'lombar',
        cardio: 'cardio',
        corpo_inteiro: 'corpo inteiro',
        fullbody: 'corpo inteiro',
    }

    return aliases[normalized.replace(/\s+/g, '_')] || aliases[normalized] || normalized
}

function getSmartExerciseGroup(exercise) {
    return normalizeSmartGroup(
        exercise?.muscleGroup ||
        exercise?.normalizedGroup ||
        exercise?.group ||
        exercise?.targetMuscle ||
        exercise?.bodyPart
    )
}

export function getSmartTemplateKind(templateName) {
    const name = normalizeSmartText(templateName)

    if (name.includes('push')) return 'push'
    if (name.includes('pull')) return 'pull'
    if (name.includes('legs')) return 'legs'
    if (name.includes('upper')) return 'upper'
    if (name.includes('lower')) return 'lower'
    if (name.includes('full body') || name.includes('corpo inteiro')) return 'full-body'

    return ''
}

function getExerciseUniqueKey(exercise) {
    return String(
        exercise?._id ||
        exercise?.id ||
        `${exercise?.name || ''}-${exercise?.muscleGroup || ''}-${exercise?.equipment || ''}`
    )
}

function normalizeExerciseForTemplate(exercise) {
    const id = exercise?._id || exercise?.id || crypto.randomUUID()

    return {
        ...exercise,
        id: String(id),
        _id: exercise?._id,
        isFavorite: Boolean(exercise?.isFavorite),
    }
}

function createSmartTemplateExerciseItem(exercise, appSettings) {
    return {
        id: crypto.randomUUID(),
        exercise: normalizeExerciseForTemplate(exercise),
        sets: ['12 Rep', '10-12 Rep', '8-10 Rep'].map((description) => ({
            id: crypto.randomUUID(),
            description,
            type: 'working',
        })),
        note: '',
        restTimer: appSettings.defaultRestTimer || 'Desligado',
    }
}

function buildSmartExerciseLibrary(exercises, defaultExercises) {
    const map = new Map()
    const localExercises = Array.isArray(exercises) ? exercises : []
    const localDefaults = Array.isArray(defaultExercises) ? defaultExercises : []

    ;[...localExercises, ...localDefaults].forEach((exercise) => {
        if (!exercise?.name) return

        const key = getExerciseUniqueKey(exercise)

        if (!map.has(key)) {
            map.set(key, normalizeExerciseForTemplate(exercise))
        }
    })

    return Array.from(map.values())
}

function pickSmartExercisesForTemplate(blueprint, library) {
    const selected = []
    const usedKeys = new Set()
    const targetGroups = blueprint.groups.map(normalizeSmartGroup)

    function addExercise(exercise) {
        if (!exercise || selected.length >= blueprint.limit) return

        const key = getExerciseUniqueKey(exercise)

        if (usedKeys.has(key)) return

        usedKeys.add(key)
        selected.push(exercise)
    }

    targetGroups.forEach((group) => {
        const found = library.find((exercise) => {
            return !usedKeys.has(getExerciseUniqueKey(exercise)) && getSmartExerciseGroup(exercise) === group
        })

        addExercise(found)
    })

    if (selected.length < blueprint.limit) {
        const keywords = blueprint.fallbackKeywords.map(normalizeSmartText)

        library.forEach((exercise) => {
            if (selected.length >= blueprint.limit) return
            if (usedKeys.has(getExerciseUniqueKey(exercise))) return

            const searchable = normalizeSmartText(
                `${exercise.name} ${exercise.originalName || ''} ${exercise.muscleGroup || ''} ${exercise.targetMuscle || ''} ${exercise.equipment || ''}`
            )

            if (keywords.some((keyword) => searchable.includes(keyword))) {
                addExercise(exercise)
            }
        })
    }

    if (selected.length < blueprint.limit) {
        library.forEach((exercise) => {
            if (selected.length >= blueprint.limit) return
            addExercise(exercise)
        })
    }

    return selected.slice(0, blueprint.limit)
}

export function buildSmartDefaultTemplatePayloads({ exercises, defaultExercises, appSettings }) {
    const library = buildSmartExerciseLibrary(exercises, defaultExercises)

    return SMART_DEFAULT_TEMPLATE_BLUEPRINTS.map((blueprint) => ({
        kind: blueprint.kind,
        name: blueprint.name,
        description: blueprint.description,
        category: blueprint.category,
        goal: blueprint.goal,
        difficulty: blueprint.difficulty,
        estimatedDuration: blueprint.estimatedDuration,
        source: 'ForgeFlow',
        exercises: pickSmartExercisesForTemplate(blueprint, library).map((exercise) =>
            createSmartTemplateExerciseItem(exercise, appSettings || {})
        ),
    }))
}
