import { spawnSync } from 'node:child_process'

const mode = process.argv[2] || 'check'

const tasks = {
  'test:frontend': [
    [process.execPath, ['node_modules/eslint/bin/eslint.js', 'src', 'public', 'scripts']],
  ],
  'test:server': [
    [process.execPath, ['server/scripts/sanity-check.mjs']],
    [process.execPath, ['server/scripts/workout-validation.test.mjs']],
  ],
  'check:server': [
    [process.execPath, ['--check', 'server/index.js']],
    [process.execPath, ['server/scripts/sanity-check.mjs']],
    [process.execPath, ['server/scripts/workout-validation.test.mjs']],
    [process.execPath, ['server/scripts/backend-route-audit.mjs']],
  ],
  'check:client': [
    [process.execPath, ['node_modules/eslint/bin/eslint.js', 'src', 'public', 'scripts']],
    [process.execPath, ['node_modules/vite/bin/vite.js', 'build']],
    [process.execPath, ['scripts/frontend-dependency-audit.mjs']],
    [process.execPath, ['scripts/frontend-size-report.mjs']],
  ],
}

tasks.test = [...tasks['test:frontend'], ...tasks['test:server']]
tasks.check = [...tasks['check:client'], ...tasks['check:server']]
tasks['check:all'] = tasks.check

const selectedTasks = tasks[mode]

if (!selectedTasks) {
  console.error(`Modo inválido: ${mode}`)
  process.exit(1)
}

for (const [command, args] of selectedTasks) {
  const result = spawnSync(command, args, {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, CI: '1' },
    shell: process.platform === 'win32',
  })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

process.exit(0)
