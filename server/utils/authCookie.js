import crypto from 'crypto'

export const AUTH_COOKIE_NAME = 'forgeflow_session'
export const CSRF_COOKIE_NAME = 'forgeflow_csrf'

export function createCsrfToken() {
    return crypto.randomBytes(32).toString('hex')
}

export function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24,
    }
}

export function getCsrfCookieOptions() {
    return {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 24,
    }
}

export function setCsrfCookie(res, csrfToken) {
    res.cookie(CSRF_COOKIE_NAME, csrfToken, getCsrfCookieOptions())
}

export function clearCsrfCookie(res) {
    res.clearCookie(CSRF_COOKIE_NAME, {
        ...getCsrfCookieOptions(),
        maxAge: undefined,
    })
}

export function setAuthCookie(res, token) {
    const csrfToken = createCsrfToken()

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions())
    setCsrfCookie(res, csrfToken)

    return csrfToken
}

export function clearAuthCookie(res) {
    res.clearCookie(AUTH_COOKIE_NAME, {
        ...getAuthCookieOptions(),
        maxAge: undefined,
    })

    clearCsrfCookie(res)
}

export function getTokenFromRequest(req) {
    const authHeader = req.headers.authorization

    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1]
    }

    return req.cookies?.[AUTH_COOKIE_NAME] || ''
}

export function usesCookieAuth(req) {
    return Boolean(req.cookies?.[AUTH_COOKIE_NAME])
}
