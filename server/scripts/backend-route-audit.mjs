import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(scriptDir, '..')
const indexPath = path.join(serverRoot, 'index.js')
const source = fs.readFileSync(indexPath, 'utf8')
const lines = source.split(/\r?\n/)

const routeStartRegex = /^\s*app\.(get|post|put|patch|delete)\s*\(/
const routePathRegex = /app\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/s

const publicRouteMatchers = [
  /^GET \/health$/,
  /^GET \/auth\/google$/,
  /^GET \/auth\/google\/mobile$/,
  /^GET \/auth\/google\/callback$/,
  /^GET \/auth\/csrf$/,
  /^POST \/auth\/register$/,
  /^POST \/auth\/login$/,
  /^POST \/auth\/forgot-password$/,
  /^POST \/auth\/reset-password\/:token$/,
  /^POST \/auth\/reset-password-code$/,
  /^POST \/auth\/logout$/,
]

const sensitiveRouteMatchers = [
  /^POST \/auth\/register$/,
  /^POST \/auth\/login$/,
  /^POST \/auth\/forgot-password$/,
  /^POST \/auth\/reset-password\/:token$/,
  /^POST \/auth\/reset-password-code$/,
  /^POST \/admin\/users\/:userId\/reset-password$/,
  /^DELETE \/me$/,
]

const obsoleteRouteMatchers = [
  /\/workout-templates/,
]

function isPublicRoute(method, routePath) {
  const key = `${method.toUpperCase()} ${routePath}`
  return publicRouteMatchers.some((matcher) => matcher.test(key))
}

function isSensitiveRoute(method, routePath) {
  const key = `${method.toUpperCase()} ${routePath}`
  return sensitiveRouteMatchers.some((matcher) => matcher.test(key))
}

function routeSignatureContainsSensitiveGuard(signature) {
  return signature.includes('sensitiveRateLimit') || signature.includes('authRateLimit')
}

function collectRoutes() {
  const routes = []

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]

    if (!routeStartRegex.test(line)) continue

    const signatureLines = []
    let openParens = 0
    let seenStart = false

    for (let cursor = lineIndex; cursor < Math.min(lines.length, lineIndex + 20); cursor += 1) {
      const currentLine = lines[cursor]
      signatureLines.push(currentLine)

      for (const char of currentLine) {
        if (char === '(') {
          openParens += 1
          seenStart = true
        } else if (char === ')') {
          openParens -= 1
        }
      }

      const signature = signatureLines.join('\n')
      const foundPath = routePathRegex.exec(signature)
      const likelyReachedHandler = /async\s*\(|\(req\s*,\s*res\)|[a-zA-Z_$][\w$]*\s*\)/.test(currentLine)

      if (foundPath && seenStart && likelyReachedHandler && signature.includes(',')) {
        const [, method, routePath] = foundPath
        routes.push({
          method: method.toUpperCase(),
          path: routePath,
          line: lineIndex + 1,
          signature,
        })
        break
      }

      if (seenStart && openParens <= 0) break
    }
  }

  return routes
}

const routes = collectRoutes()
const failures = []
const warnings = []

for (const route of routes) {
  const key = `${route.method} ${route.path}`
  const signature = route.signature
  const publicRoute = isPublicRoute(route.method, route.path)

  if (route.path.startsWith('/admin')) {
    if (!signature.includes('authMiddleware')) {
      failures.push(`${key} linha ${route.line}: rota admin sem authMiddleware`)
    }

    if (!signature.includes('requireAdmin')) {
      failures.push(`${key} linha ${route.line}: rota admin sem requireAdmin`)
    }
  }

  if (!publicRoute && !signature.includes('authMiddleware')) {
    failures.push(`${key} linha ${route.line}: rota privada sem authMiddleware`)
  }

  if (isSensitiveRoute(route.method, route.path) && !routeSignatureContainsSensitiveGuard(signature)) {
    warnings.push(`${key} linha ${route.line}: rota sensível sem rate limit explícito`)
  }

  if (obsoleteRouteMatchers.some((matcher) => matcher.test(route.path))) {
    warnings.push(`${key} linha ${route.line}: rota de templates ainda existe no backend, mas o frontend não usa mais templates`)
  }
}

const adminRoutes = routes.filter((route) => route.path.startsWith('/admin'))
const protectedRoutes = routes.filter((route) => route.signature.includes('authMiddleware'))
const publicRoutes = routes.filter((route) => isPublicRoute(route.method, route.path))

console.log('\nForgeFlow Backend Route Audit')
console.log('=============================')
console.log(`Rotas analisadas: ${routes.length}`)
console.log(`Rotas protegidas por authMiddleware: ${protectedRoutes.length}`)
console.log(`Rotas admin: ${adminRoutes.length}`)
console.log(`Rotas públicas permitidas: ${publicRoutes.length}`)

if (warnings.length > 0) {
  console.log('\nAvisos:')
  for (const warning of warnings) {
    console.log(`  - ${warning}`)
  }
}

if (failures.length > 0) {
  console.error('\nFalhas críticas:')
  for (const failure of failures) {
    console.error(`  - ${failure}`)
  }
  process.exitCode = 1
} else {
  console.log('\nNenhuma falha crítica de proteção de rota encontrada.')
}
