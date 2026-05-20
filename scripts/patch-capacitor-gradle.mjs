import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const targets = [
  path.join(root, 'node_modules', '@capacitor', 'local-notifications', 'android', 'build.gradle'),
  path.join(root, 'node_modules', '@capacitor', 'app', 'android', 'build.gradle'),
  path.join(root, 'node_modules', '@capacitor', 'android', 'capacitor', 'build.gradle'),
]

let patched = 0

for (const file of targets) {
  if (!fs.existsSync(file)) continue

  const original = fs.readFileSync(file, 'utf8')
  const updated = original.replaceAll('proguard-android.txt', 'proguard-android-optimize.txt')

  if (updated !== original) {
    fs.writeFileSync(file, updated)
    patched += 1
  }
}

if (patched > 0) {
  console.log(`[ForgeFlow] Gradle Capacitor patch aplicado em ${patched} arquivo(s).`)
}
