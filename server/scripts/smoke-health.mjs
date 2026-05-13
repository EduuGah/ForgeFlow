const rawUrl = process.env.SMOKE_HEALTH_URL || process.env.BACKEND_URL || 'http://localhost:3001'
const healthUrl = rawUrl.endsWith('/health') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/health`

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000)

const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), timeoutMs)

try {
    const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        console.error(`❌ Healthcheck falhou: ${response.status}`)
        console.error(data || await response.text().catch(() => 'sem corpo'))
        process.exit(1)
    }

    if (!data?.ok) {
        console.error('❌ Healthcheck respondeu sem ok=true')
        console.error(data)
        process.exit(1)
    }

    console.log(`✅ Healthcheck OK: ${healthUrl}`)
    console.log(JSON.stringify({
        mongoState: data.mongoState,
        uptime: data.uptime,
        timestamp: data.timestamp,
    }, null, 2))
} catch (error) {
    console.error(`❌ Falha ao acessar healthcheck: ${healthUrl}`)
    console.error(error.message)
    process.exit(1)
} finally {
    clearTimeout(timeout)
}
