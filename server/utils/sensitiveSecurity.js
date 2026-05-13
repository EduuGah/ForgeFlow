export function requireRecentPassword(user, password) {
    if (!user?.passwordHash) {
        return {
            ok: false,
            message: 'Esta ação exige uma senha tradicional. Crie uma senha antes de continuar.',
        }
    }

    if (!password?.trim()) {
        return {
            ok: false,
            message: 'Informe sua senha para confirmar esta ação.',
        }
    }

    return {
        ok: true,
    }
}
