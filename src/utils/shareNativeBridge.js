import { Capacitor, registerPlugin } from '@capacitor/core'

const ForgeFlowMedia = registerPlugin('ForgeFlowMedia')

function isNativeRuntime() {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

function isForgeFlowMediaAvailable() {
  try {
    return Boolean(Capacitor.isPluginAvailable?.('ForgeFlowMedia'))
  } catch {
    return false
  }
}

function dataUrlToBase64(dataUrl = '') {
  const [, base64 = ''] = String(dataUrl).split(',')
  return base64
}

function normalizeMimeType(mimeType = 'image/png') {
  return String(mimeType || 'image/png').toLowerCase()
}

export function canUseNativeMediaBridge() {
  return isNativeRuntime() && isForgeFlowMediaAvailable()
}


export async function normalizeImageToJpegNative({ dataUrl, filename, mimeType = 'image/jpeg', maxSide = 2600, quality = 90 }) {
  if (!isNativeRuntime()) return null
  if (!isForgeFlowMediaAvailable()) throw new Error('Plugin nativo ForgeFlowMedia não está registrado no APK.')

  const base64 = dataUrlToBase64(dataUrl)
  if (!base64) throw new Error('Imagem sem conteúdo base64.')

  return ForgeFlowMedia.normalizeImageToJpeg({
    base64,
    fileName: filename || 'forgeflow-photo',
    mimeType: normalizeMimeType(mimeType),
    maxSide,
    quality,
  })
}

export async function saveImageToGalleryNative({ dataUrl, filename, mimeType = 'image/png' }) {
  if (!isNativeRuntime()) return null
  if (!isForgeFlowMediaAvailable()) throw new Error('Plugin nativo ForgeFlowMedia não está registrado no APK.')

  const base64 = dataUrlToBase64(dataUrl)
  if (!base64) throw new Error('Imagem sem conteúdo base64.')

  return ForgeFlowMedia.saveImageToGallery({
    base64,
    fileName: filename,
    mimeType: normalizeMimeType(mimeType),
    album: 'ForgeFlow',
  })
}

export async function shareImageToInstagramStoryNative({ dataUrl, filename, mimeType = 'image/png', shareText }) {
  if (!isNativeRuntime()) return null
  if (!isForgeFlowMediaAvailable()) throw new Error('Plugin nativo ForgeFlowMedia não está registrado no APK.')

  const base64 = dataUrlToBase64(dataUrl)
  if (!base64) throw new Error('Imagem sem conteúdo base64.')

  return ForgeFlowMedia.shareImageToInstagramStory({
    base64,
    fileName: filename,
    mimeType: normalizeMimeType(mimeType),
    album: 'ForgeFlow',
    caption: shareText || '',
    sourceApplication: import.meta.env.VITE_INSTAGRAM_SOURCE_APP_ID || '',
  })
}
