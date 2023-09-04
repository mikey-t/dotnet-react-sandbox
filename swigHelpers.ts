import { SpawnOptions, spawn } from 'node:child_process'

export function log(message?: unknown, ...optionalParams: unknown[]) {
  console.log(message, ...optionalParams)
}

export interface SpawnResult {
  code: number
  stdout: string
  stderr: string
  cwd?: string
}

export async function spawnAsync(command: string, args: string[], options: SpawnOptions, liveOutput = false): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const result: SpawnResult = {
      stdout: '',
      stderr: '',
      code: 99,
      cwd: options.cwd?.toString()
    }

    const proc = spawn(command, args, options)

    proc.on('exit', () => proc.kill())
    proc.on('SIGINT', () => proc.kill())
    proc.on('SIGUSR1', () => proc.kill())
    proc.on('SIGUSR2', () => proc.kill())
    proc.on('uncaughtException', () => proc.kill())
    proc.on('SIGTERM', () => proc.kill())

    // const exitSignals = [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`]
    // exitSignals.forEach((eventType) => {
    //   proc.on(eventType, () => {
    //     proc.kill()
    //   })
    // })

    proc.stdout?.on('data', (data) => {
      result.stdout += data
      if (liveOutput) {
        log(data.toString())
      }
    })

    proc.stderr?.on('data', (data) => {
      result.stderr += data
      if (liveOutput) {
        console.error(data.toString())
      }
    })

    proc.on('error', (error) => {
      reject(`Spawned process encountered an error: ${error}`)
    })

    proc.on('close', (code) => {
      if (code === null) {
        reject(`Spawned process returned a null result code: ${command}`)
      } else {
        result.code = code
        resolve(result)
      }
    })
  })
}
