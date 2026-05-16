import fs from 'node:fs/promises'
import path from 'node:path'
import 'dotenv/config'

const API_URL = process.env.EXERCISEDB_API_URL || 'https://exercisedb.p.rapidapi.com'
const API_KEY = process.env.EXERCISEDB_API_KEY

const OUTPUT_PATH = path.resolve('src/data/generated/exerciseDbExercises.json')

const BODY_PART_TO_GROUP = {
  chest: 'Peito',
  back: 'Costas',
  'upper legs': 'Pernas',
  'lower legs': 'Panturrilhas',
  shoulders: 'Ombros',
  'upper arms': 'Braços',
  'lower arms': 'Antebraços',
  waist: 'Abdômen',
  cardio: 'Cardio',
  neck: 'Pescoço',
}

const EQUIPMENT_TRANSLATIONS = {
  'barbell': 'Barra',
  'dumbbell': 'Halteres',
  'body weight': 'Peso corporal',
  'cable': 'Cabo',
  'leverage machine': 'Máquina',
  'assisted': 'Assistido',
  'band': 'Elástico',
  'ez barbell': 'Barra EZ',
  'kettlebell': 'Kettlebell',
  'medicine ball': 'Bola medicinal',
  'stability ball': 'Bola suíça',
  'smith machine': 'Smith',
  'weighted': 'Com peso',
  'rope': 'Corda',
  'wheel roller': 'Roda abdominal',
  'resistance band': 'Elástico',
}

const TARGET_TRANSLATIONS = {
  pectorals: 'Peitoral',
  lats: 'Dorsal',
  'upper back': 'Costas superiores',
  traps: 'Trapézio',
  delts: 'Deltoides',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebraços',
  quads: 'Quadríceps',
  hamstrings: 'Posterior de coxa',
  glutes: 'Glúteos',
  calves: 'Panturrilhas',
  abs: 'Abdômen',
  abductors: 'Abdutores',
  adductors: 'Adutores',
  'spine': 'Lombar',
  'cardiovascular system': 'Cardiovascular',
}

const NAME_TRANSLATIONS = {
  'barbell bench press': 'Supino reto com barra',
  'barbell incline bench press': 'Supino inclinado com barra',
  'dumbbell bench press': 'Supino reto com halteres',
  'dumbbell incline bench press': 'Supino inclinado com halteres',
  'push-up': 'Flexão de braços',
  'cable crossover': 'Crossover no cabo',
  'dumbbell fly': 'Crucifixo com halteres',
  'lever pec deck fly': 'Crucifixo na máquina',
  'barbell squat': 'Agachamento com barra',
  'barbell deadlift': 'Levantamento terra com barra',
  'pull-up': 'Barra fixa',
  'chin-up': 'Barra fixa supinada',
  'lat pulldown': 'Puxada alta',
  'barbell bent over row': 'Remada curvada com barra',
  'dumbbell row': 'Remada unilateral com halter',
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase()
}

function toKebabCase(value = '') {
  return normalizeText(value)
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

function translateName(name) {
  const normalized = normalizeText(name)

  return NAME_TRANSLATIONS[normalized] || capitalizeWords(name)
}

function translateEquipment(equipment) {
  const normalized = normalizeText(equipment)

  return EQUIPMENT_TRANSLATIONS[normalized] || capitalizeWords(equipment || 'Sem equipamento')
}

function translateTarget(target) {
  const normalized = normalizeText(target)

  return TARGET_TRANSLATIONS[normalized] || capitalizeWords(target || 'Sem alvo')
}

function translateBodyPart(bodyPart) {
  const normalized = normalizeText(bodyPart)

  return BODY_PART_TO_GROUP[normalized] || capitalizeWords(bodyPart || 'Sem grupo')
}

function capitalizeWords(value = '') {
  return String(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function createBasicTips(exercise) {
  const target = translateTarget(exercise.target)

  return [
    `Mantenha o controle durante todo o movimento.`,
    `Evite usar impulso excessivo para trabalhar melhor ${target}.`,
    `Use uma carga que permita manter boa técnica.`,
  ]
}

function createBasicMistakes() {
  return [
    'Executar o movimento rápido demais.',
    'Perder a postura durante a repetição.',
    'Usar carga acima do necessário e reduzir a amplitude.',
  ]
}

function createBasicInstructions(exercise) {
  const name = translateName(exercise.name)

  if (Array.isArray(exercise.instructions) && exercise.instructions.length > 0) {
    return exercise.instructions
  }

  return [
    `Prepare-se para executar ${name} com controle.`,
    'Inicie o movimento mantendo boa postura e estabilidade.',
    'Realize a fase principal do exercício sem usar impulso excessivo.',
    'Retorne lentamente à posição inicial.',
  ]
}

function mapExercise(exercise) {
  const originalName = exercise.name || 'Unnamed exercise'
  const id = exercise.id ? String(exercise.id) : toKebabCase(originalName)

  const muscleGroup = translateBodyPart(exercise.bodyPart)
  const target = translateTarget(exercise.target)

  return {
    id: `exdb-${id}`,
    source: 'ExerciseDB',
    sourceId: id,

    name: translateName(originalName),
    originalName,

    muscleGroup,
    targetMuscle: target,
    secondaryMuscles: Array.isArray(exercise.secondaryMuscles)
      ? exercise.secondaryMuscles.map(translateTarget)
      : [],

    equipment: translateEquipment(exercise.equipment),
    difficulty: 'Não definida',
    movementPattern: '',

    media: {
      gif: exercise.gifUrl || '',
      image: '',
    },

    gifUrl: exercise.gifUrl || '',
    mediaUrl: exercise.gifUrl || '',

    instructions: createBasicInstructions(exercise),
    tips: createBasicTips(exercise),
    commonMistakes: createBasicMistakes(exercise),

    raw: {
      bodyPart: exercise.bodyPart || '',
      target: exercise.target || '',
      equipment: exercise.equipment || '',
    },
  }
}

async function fetchExercises() {
  if (!API_KEY) {
    throw new Error('EXERCISEDB_API_KEY não encontrada no .env')
  }

  const url = `${API_URL}/exercises?limit=0`

  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': new URL(API_URL).host,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Erro ao buscar exercícios: ${response.status} - ${text}`)
  }

  return response.json()
}

async function main() {
  console.log('Buscando exercícios na ExerciseDB...')

  const exercises = await fetchExercises()

  console.log(`Recebidos: ${exercises.length} exercícios`)

  const mappedExercises = exercises
    .map(mapExercise)
    .sort((a, b) => a.name.localeCompare(b.name))

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })

  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(mappedExercises, null, 2),
    'utf-8'
  )

  console.log(`Arquivo gerado em: ${OUTPUT_PATH}`)
  console.log(`Total importado: ${mappedExercises.length}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})