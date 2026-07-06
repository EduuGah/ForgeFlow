import { spawnSync } from 'node:child_process'

const target = process.argv[2] || 'check:server'
const commands = {
  'check:server': ['npm', ['--prefix', 'server', 'run', 'check:backend']],
  'test:server': ['npm', ['--prefix', 'server', 'run', 'test']],
}

const command = commands[target]
if (!command) {
  console.error(`[ForgeFlow] Check desconhecido: ${target}`)
  process.exit(1)
}

const result = spawnSync(command[0], command[1], { stdio: 'inherit', shell: process.platform === 'win32' })
process.exit(result.status ?? 1)
