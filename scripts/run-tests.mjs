import { spawnSync } from 'node:child_process'

const steps = [
  ['npm', ['run', 'test:frontend']],
  ['npm', ['--prefix', 'server', 'run', 'test']],
]

for (const [cmd, args] of steps) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' })
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1)
}
