import { CSRF_COOKIE_NAME, usesCookieAuth } from './authCookie.js'

export function csrfProtection(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next()
    }

    const publicAuthPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/logout',
        '/auth/forgot-password',
    ]

    if (
        publicAuthPaths.includes(req.path) ||
        req.path.startsWith('/auth/reset-password/')
    ) {
        return next()
    }

    if (!usesCookieAuth(req)) {
        return next()
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]
    const headerToken = req.headers['x-csrf-token']

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({
            message: 'Falha de segurança CSRF. Recarregue a página e tente novamente.',
            reason: 'csrf_failed',
        })
    }

    return next()
}
