const GENERIC_SERVER_ERROR_MESSAGE = 'Erro interno no servidor.'

function getSafeErrorMessage(error) {
    if (!error) return GENERIC_SERVER_ERROR_MESSAGE

    if (error.name === 'CastError') {
        return 'Identificador inválido.'
    }

    if (error.name === 'ValidationError') {
        return 'Dados inválidos. Revise as informações enviadas.'
    }

    if (error.code === 11000) {
        return 'Já existe um registro com essas informações.'
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
        return 'Arquivo muito grande. Envie uma imagem de até 5 MB.'
    }

    if (error.statusCode && error.statusCode < 500 && error.message) {
        return error.message
    }

    return GENERIC_SERVER_ERROR_MESSAGE
}

function getStatusCode(error) {
    if (error?.statusCode && Number.isInteger(error.statusCode)) {
        return error.statusCode
    }

    if (error?.name === 'CastError' || error?.name === 'ValidationError' || error?.code === 11000) {
        return 400
    }

    if (error?.code === 'LIMIT_FILE_SIZE') {
        return 400
    }

    return 500
}

export function logServerError(scope, error) {
    const label = scope ? `[${scope}]` : '[ServerError]'
    const details = {
        name: error?.name || 'Error',
        message: error?.message || String(error || ''),
        code: error?.code,
        statusCode: error?.statusCode,
    }

    if (process.env.NODE_ENV !== 'production' && error?.stack) {
        details.stack = error.stack
    }

    console.error(label, details)
}

export function notFoundHandler(req, res) {
    return res.status(404).json({
        message: 'Rota não encontrada.',
    })
}

export function globalErrorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error)
    }

    const statusCode = getStatusCode(error)
    logServerError(`${req.method} ${req.originalUrl}`, error)

    return res.status(statusCode).json({
        message: getSafeErrorMessage(error),
    })
}
