import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(__dirname, '..')
const serverIndex = path.join(serverDir, 'index.js')

function ok(message) {
    console.log(`✅ ${message}`)
}

function fail(message) {
    console.error(`❌ ${message}`)
    process.exitCode = 1
}

function assert(condition, message) {
    if (condition) {
        ok(message)
        return
    }

    fail(message)
}

try {
    execFileSync(process.execPath, ['--check', serverIndex], {
        stdio: 'pipe',
    })
    ok('server/index.js passou no node --check')
} catch (error) {
    console.error(error.stdout?.toString() || '')
    console.error(error.stderr?.toString() || error.message)
    fail('server/index.js falhou no node --check')
}

const requiredFiles = [
    'index.js',
    'utils/authCookie.js',
    'utils/csrfProtection.js',
    'utils/workoutValidation.js',
    'utils/securityHeaders.js',
    'utils/rateLimit.js',
    'utils/sensitiveSecurity.js',
    'utils/errorHandling.js',
]

for (const relativePath of requiredFiles) {
    assert(
        existsSync(path.join(serverDir, relativePath)),
        `arquivo obrigatório existe: server/${relativePath}`
    )
}

const indexSource = await readFile(serverIndex, 'utf8')

const requiredImports = [
    './utils/authCookie.js',
    './utils/csrfProtection.js',
    './utils/workoutValidation.js',
    './utils/securityHeaders.js',
    './utils/rateLimit.js',
    './utils/sensitiveSecurity.js',
    './utils/errorHandling.js',
]

for (const importPath of requiredImports) {
    assert(indexSource.includes(importPath), `server/index.js importa ${importPath}`)
}

const requiredRoutes = [
    "app.get('/health'",
    "app.post('/auth/login'",
    "app.post('/auth/register'",
    "app.get('/auth/session'",
    "app.get('/admin/users'",
    "app.get('/admin/rankings'",
    "app.get('/active-workout'",
    "app.post('/active-workout/finish'",
    "app.delete('/me'",
]

for (const route of requiredRoutes) {
    assert(indexSource.includes(route), `rota encontrada: ${route}`)
}

assert(!indexSource.includes("app.options('*'"), "não usa app.options('*'), incompatível com Express atual")
assert(indexSource.includes('app.use(csrfProtection)'), 'CSRF protection está registrado')
assert(indexSource.includes('app.use(securityHeaders)'), 'securityHeaders está registrado')
assert(indexSource.includes('app.use(generalRateLimit)'), 'rate limit geral está registrado')
assert(indexSource.includes('app.use(notFoundHandler)'), 'handler 404 JSON está registrado')
assert(indexSource.includes('app.use(globalErrorHandler)'), 'handler global de erro JSON está registrado')

if (process.exitCode) {
    console.error('\nSanity check encontrou problemas.')
    process.exit(process.exitCode)
}

console.log('\n✅ Sanity check concluído com sucesso.')
