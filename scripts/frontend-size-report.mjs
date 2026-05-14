import { existsSync, statSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const ignoredDirs = new Set(['node_modules', 'dist', 'build', '.git', '.vite', 'coverage', 'server', 'android', 'ios'])
const ignoredFiles = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'])
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json'])

async function walk(dir) {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue
    if (ignoredFiles.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath))
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

const files = await walk(rootDir)
const rows = []

for (const file of files) {
  const source = await readFile(file, 'utf8').catch(() => '')
  const lines = source.split(/\r?\n/).length
  const nonEmpty = source.split(/\r?\n/).filter((line) => line.trim()).length
  const bytes = statSync(file).size

  rows.push({
    file: path.relative(rootDir, file),
    lines,
    nonEmpty,
    kb: Number((bytes / 1024).toFixed(1)),
  })
}

rows.sort((a, b) => b.lines - a.lines)

const totalLines = rows.reduce((sum, item) => sum + item.lines, 0)
const totalNonEmpty = rows.reduce((sum, item) => sum + item.nonEmpty, 0)

console.log('\nForgeFlow Frontend Size Report')
console.log('==============================')
console.log(`Arquivos analisados: ${rows.length}`)
console.log(`Linhas totais: ${totalLines}`)
console.log(`Linhas não vazias: ${totalNonEmpty}`)

console.log('\nTop 20 maiores arquivos:')
for (const item of rows.slice(0, 20)) {
  console.log(`${String(item.lines).padStart(5)} linhas | ${String(item.kb).padStart(7)} KB | ${item.file}`)
}
