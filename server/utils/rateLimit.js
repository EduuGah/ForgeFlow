const rateLimitStore = new Map()
const MAX_RATE_LIMIT_KEYS = 10_000

function cleanupExpiredKeys(now = Date.now()) {
    if (rateLimitStore.size < MAX_RATE_LIMIT_KEYS) return

    for (const [key, value] of rateLimitStore.entries()) {
        if (value.expiresAt <= now) {
            rateLimitStore.delete(key)
        }
    }
}

export function createRateLimiter({ windowMs = 60_000, max = 60, keyPrefix = 'global' } = {}) {
    return (req, res, next) => {
        // req.ip respeita a configuracao `trust proxy` do app. Ler
        // X-Forwarded-For direto do header deixava qualquer cliente forjar um
        // IP novo a cada requisicao e ignorar completamente o rate limit,
        // inclusive o de /auth/login.
        const ip = req.ip || req.socket?.remoteAddress || 'unknown'

        const key = `${keyPrefix}:${ip}`
        const now = Date.now()

        cleanupExpiredKeys(now)
        const current = rateLimitStore.get(key)

        if (!current || current.expiresAt <= now) {
            rateLimitStore.set(key, {
                count: 1,
                expiresAt: now + windowMs,
            })

            return next()
        }

        current.count += 1

        if (current.count > max) {
            const retryAfter = Math.ceil((current.expiresAt - now) / 1000)
            res.setHeader('Retry-After', String(retryAfter))

            return res.status(429).json({
                message: 'Muitas tentativas. Aguarde um pouco e tente novamente.',
            })
        }

        rateLimitStore.set(key, current)
        return next()
    }
}

export const authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 35,
    keyPrefix: 'auth',
})

export const sensitiveRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 12,
    keyPrefix: 'sensitive',
})

export const generalRateLimit = createRateLimiter({
    windowMs: 60 * 1000,
    max: 180,
    keyPrefix: 'general',
})
