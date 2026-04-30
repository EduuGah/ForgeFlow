import fs from 'fs'
import axios from 'axios'

const EXERCISE_DB_URL = 'https://exercisedb.p.rapidapi.com/exercises'
const API_KEY = 'c22051c99bmsh8efdd20d9efb2f0p163304jsn6c9ee7fdc30d'

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
}

function similarity(a, b) {
  return a.includes(b) || b.includes(a)
}

async function fetchExercises() {
  const res = await axios.get(EXERCISE_DB_URL, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
    },
  })

  return res.data
}

async function enrich() {
  const file = fs.readFileSync('./src/data/defaultExercises.js', 'utf-8')

  const json = file
    .replace('const defaultExercises = ', '')
    .replace('export default defaultExercises', '')

  const exercises = JSON.parse(json)

  const dbExercises = await fetchExercises()

  const enriched = exercises.map((exercise) => {
    const name = normalizeName(exercise.originalName || exercise.name)

    const match = dbExercises.find((db) =>
      similarity(name, normalizeName(db.name))
    )

    if (!match) return exercise

    return {
      ...exercise,
      mediaUrl: match.gifUrl,
      thumbnail: match.gifUrl,
    }
  })

  const content = `const defaultExercises = ${JSON.stringify(enriched, null, 2)}

export default defaultExercises
`

  fs.writeFileSync('./src/data/defaultExercises.js', content)

  console.log('✔ Exercícios enriquecidos com mídia')
}

enrich()