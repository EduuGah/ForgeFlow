import fs from 'node:fs'
import path from 'node:path'

const dist = path.resolve('dist')
if (!fs.existsSync(dist)) {
  console.log('[ForgeFlow] dist ainda não existe. Rode npm run build para gerar o relatório real.')
  process.exit(0)
}

let total = 0
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else total += fs.statSync(full).size
  }
}
walk(dist)
console.log(`[ForgeFlow] Tamanho aproximado do dist: ${(total / 1024 / 1024).toFixed(2)} MB`)
