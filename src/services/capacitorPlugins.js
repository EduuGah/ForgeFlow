import { registerPlugin } from '@capacitor/core'

/**
 * Registro único dos plugins nativos.
 *
 * `registerPlugin` precisa ser chamado uma vez por plugin: quando dois módulos
 * registram o mesmo nome, o Capacitor descarta o segundo e avisa no console
 * ("Cannot register plugins twice"). Manter as instâncias aqui também evita
 * que um componente do fluxo de autenticação precise importar o serviço de
 * notificações inteiro só para escutar um evento.
 */
export const LocalNotifications = registerPlugin('LocalNotifications')
export const ActiveWorkoutForeground = registerPlugin('ActiveWorkoutForeground')
export const Geolocation = registerPlugin('Geolocation')
