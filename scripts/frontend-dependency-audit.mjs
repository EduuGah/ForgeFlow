import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const packagePath = path.join(rootDir, 'package.json')
const srcDir = path.join(rootDir, 'src')

const ignoredDirs = new Set([
  'node_modules',
  'dist',
  'build',
  '.git',
  '.vite',
  'coverage',
])

const importNameMap = {
  '@vitejs/plugin-react': '@vitejs/plugin-react',
  vite: 'vite',
  react: 'react',
  'react-dom': 'react-dom',
  'react-router-dom': 'react-router-dom',
  recharts: 'recharts',
  'lucide-react': 'lucide-react',
  '@capacitor/core': '@capacitor/core',
  '@capacitor/cli': '@capacitor/cli',
  '@capacitor/android': '@capacitor/android',
  '@vite-pwa/assets-generator': '@vite-pwa/assets-generator',
  'vite-plugin-pwa': 'vite-plugin-pwa',
}

async function walk(dir) {
  if (!existsSync(dir)) return []

  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue

    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath))
    } else if (/\.(js|jsx|ts|tsx|mjs|cjs|css|html)$/.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

function getPackageFromImport(source) {
  if (source.startsWith('.') || source.startsWith('/')) return null

  if (source.startsWith('@')) {
    const [scope, name] = source.split('/')
    return `${scope}/${name}`
  }

  return source.split('/')[0]
}

if (!existsSync(packagePath)) {
  console.error('❌ package.json não encontrado na raiz do frontend.')
  process.exit(1)
}

const packageJson = JSON.parse(await readFile(packagePath, 'utf8'))
const dependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
}

const files = [
  ...await walk(srcDir),
  ...['vite.config.js', 'vite.config.mjs', 'index.html']
    .map((item) => path.join(rootDir, item))
    .filter((item) => existsSync(item)),
]

const usedPackages = new Set()

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const importRegex = /(?:import\s+(?:[^'"]+\s+from\s+)?|import\(|require\()\s*['"]([^'"]+)['"]/g

  for (const match of source.matchAll(importRegex)) {
    const pkg = getPackageFromImport(match[1])
    if (pkg) usedPackages.add(pkg)
  }

  for (const [needle, pkg] of Object.entries(importNameMap)) {
    if (source.includes(needle)) usedPackages.add(pkg)
  }
}

const dependencyNames = Object.keys(dependencies)
const likelyUnused = dependencyNames.filter((pkg) => {
  if (pkg.startsWith('@types/')) return false
  if (pkg === 'typescript') return false
  if (pkg === 'eslint') return false
  if (pkg.startsWith('eslint-')) return false

  return !usedPackages.has(pkg)
})

const missingFromPackageJson = Array.from(usedPackages).filter((pkg) => {
  if (pkg.startsWith('node:')) return false
  return !dependencies[pkg]
})

console.log('\nForgeFlow Frontend Dependency Audit')
console.log('===================================')
console.log(`Arquivos analisados: ${files.length}`)
console.log(`Dependências no package.json: ${dependencyNames.length}`)
console.log(`Pacotes detectados em imports: ${usedPackages.size}`)

console.log('\nPossivelmente não usadas:')
if (likelyUnused.length === 0) {
  console.log('  Nenhuma dependência suspeita encontrada.')
} else {
  for (const pkg of likelyUnused.sort()) {
    console.log(`  - ${pkg}`)
  }
}

console.log('\nUsadas em código mas ausentes no package.json:')
if (missingFromPackageJson.length === 0) {
  console.log('  Nenhuma ausência detectada.')
} else {
  for (const pkg of missingFromPackageJson.sort()) {
    console.log(`  - ${pkg}`)
  }
}

console.log('\nObservação:')
console.log('  Revise manualmente antes de remover dependências. Algumas podem ser usadas por plugins, scripts ou configuração externa.')
