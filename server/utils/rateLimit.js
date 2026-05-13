const rateLimitStore = new Map()

export function createRateLimiter({ windowMs = 60_000, max = 60, keyPrefix = 'global' } = {}) {
    return (req, res, next) => {
        const ip =
            req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            'unknown'

        const key = `${keyPrefix}:${ip}`
        const now = Date.now()
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
