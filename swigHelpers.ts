import { SpawnOptions, spawn } from 'node:child_process'

export function log(message?: unknown, ...optionalParams: unknown[]) {
  console.log(message, ...optionalParams)
}

export interface SpawnResult {
  code: number
  error?: Error,
  cwd?: string
}

export function spawnAsync(command: string, args: string[], options?: SpawnOptions): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const defaultSpawnOptions: SpawnOptions = {
      stdio: 'inherit'
    }

    const mergedOptions = { ...defaultSpawnOptions, ...options }

    const result: SpawnResult = {
      code: 99,
      cwd: mergedOptions.cwd?.toString() ?? process.cwd()
    }

    const child = spawn(command, args, mergedOptions)

    child.on('close', (code) => {
      result.code = code ?? 99
      resolve(result)
    })

    child.on('exit', (code) => {
      result.code = code ?? 99
      resolve(result)
    })

    child.on('error', (error) => {
      result.error = error
      resolve(result)
    })

    process.on('SIGINT', () => {
      child.kill('SIGINT')
    })
  })
}
