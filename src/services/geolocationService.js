import { registerPlugin } from '@capacitor/core'

import { isNativeApp } from '../utils/platformUtils'

const Geolocation = registerPlugin('Geolocation')

function normalizePosition(position) {
  const coords = position?.coords || {}
  const latitude = Number(coords.latitude)
  const longitude = Number(coords.longitude)

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Latitude inválida retornada pelo dispositivo.')
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Longitude inválida retornada pelo dispositivo.')
  }

  return {
    enabled: true,
    latitude,
    longitude,
    accuracy: Number.isFinite(Number(coords.accuracy)) ? Number(coords.accuracy) : null,
    capturedAt: new Date().toISOString(),
    source: isNativeApp() ? 'capacitor' : 'browser',
  }
}

export async function requestWorkoutLocation() {
  if (isNativeApp() && Geolocation) {
    try {
      const permissions = await Geolocation.checkPermissions?.()
      const coarse = permissions?.coarseLocation
      const location = permissions?.location

      if (location !== 'granted' && coarse !== 'granted') {
        const requested = await Geolocation.requestPermissions?.({ permissions: ['location'] })
        if (requested?.location !== 'granted' && requested?.coarseLocation !== 'granted') {
          throw new Error('Permissão de localização negada.')
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      })

      return normalizePosition(position)
    } catch (error) {
      throw new Error(error?.message || 'Não foi possível capturar sua localização.', { cause: error })
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocalização não disponível neste dispositivo.')
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    })
  })

  return normalizePosition(position)
}

export function getMapsUrl(location) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

export function formatLocationLabel(location) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)
  const label = String(location?.label || location?.name || '').trim()

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'Localização não salva'
  }

  if (label) return label

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function formatLocationCoordinates(location) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return ''

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}
