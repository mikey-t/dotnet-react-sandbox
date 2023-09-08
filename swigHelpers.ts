import { ChildProcess, SpawnOptions, exec, spawn, spawnSync } from 'node:child_process'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import tar, { CreateOptions, FileOptions } from 'tar'
import { platform } from 'node:os'

export function log(message?: unknown, ...optionalParams: unknown[]) {
  console.log(message, ...optionalParams)
}

export interface SpawnResult {
  code: number
  error?: Error,
  cwd?: string
}

export interface SimpleSpawnResult {
  status: number | null
  stdout: string
  stderr: string
  error?: Error | undefined
  stdoutLines: string[]
}

export interface WhichResult {
  location: string | undefined
  additionalLocations: string[] | undefined
  error: Error | undefined
}

export type DockerComposeCommand = 'build' | 'config' | 'cp' | 'create' | 'down' | 'events' | 'exec' | 'images' | 'kill' | 'logs' | 'ls' | 'pause' | 'port' | 'ps' | 'pull' | 'push' | 'restart' | 'rm' | 'run' | 'start' | 'stop' | 'top' | 'unpause' | 'up' | 'version'

const dockerComposeCommandsThatSupportDetached = ['exec', 'logs', 'ps', 'restart', 'run', 'start', 'stop', 'up']

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function spawnAsync(command: string, args?: string[], options?: SpawnOptions, isLongRunning?: boolean): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    try {
      log(`parent listeners: ${process.listenerCount('SIGINT')}`)

      const defaultSpawnOptions: SpawnOptions = { stdio: 'inherit' }
      const argsToUse = args ?? []
      const prefix = `[spawn ${command} ${argsToUse.join(' ')}] `
      const mergedOptions = { ...defaultSpawnOptions, ...options }
      const result: SpawnResult = { code: 1, cwd: mergedOptions.cwd?.toString() ?? process.cwd() }

      // Windows has a bug where child processes are orphaned when using the shell option. This workaround will spawn
      // a "middle" process to check whether parent process is still running at intervals and if not, kill the child process tree.
      const workaroundCommand = 'node'
      const workaroundScript = path.join(process.cwd(), './runWhileParentAlive.mjs')
      if (isLongRunning && isWindows() && mergedOptions.shell && command !== workaroundCommand && argsToUse[0] !== workaroundScript) {
        log(`${prefix}Running on Windows with shell option - using middle process hack to prevent orphaned processes`)
        spawnAsync(workaroundCommand, [workaroundScript, command, ...(args ?? [])], mergedOptions)
          .then((workaroundResult) => {
            result.code = workaroundResult.code
            resolve(result)
          }).catch((err) => {
            reject(err)
          })
        return
      }

      const child = spawn(command, argsToUse, mergedOptions)
      const childId: number | undefined = child.pid
      if (childId === undefined) {
        throw new Error(`${prefix}ChildProcess pid is undefined - spawn failed`)
      }

      const listener = new SignalListener(child, prefix)

      child.on('exit', (code, signal) => {
        log(`${prefix}ChildProcess exited with code ${code} and signal ${signal}`)
        result.code = code === null ? 0 : code // Using 0 for null since ctrl+c will return null in some cases apparently
        child.removeAllListeners()
        listener.detach()
        resolve(result)
      })

      child.on('error', (error) => {
        log(`${prefix}ChildProcess emitted an error event: `, error)
      })
    } catch (err) {
      reject(err)
    }
  })
}

class SignalListener {
  private signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
  private child: ChildProcess
  private logPrefix: string

  constructor(child: ChildProcess, logPrefix: string) {
    this.child = child
    this.logPrefix = logPrefix
    this.attach()
  }

  // Arrow function provides unique handler function for each instance of SignalListener
  private handler = (signal: NodeJS.Signals) => {
    console.log(`${this.logPrefix}Process received ${signal} - killing ChildProcess with ID ${this.child.pid}`)
    this.child.kill(signal)
    this.detach()
  }

  attach() {
    this.signals.forEach(signal => process.on(signal, this.handler))
  }

  detach() {
    this.signals.forEach(signal => process.removeListener(signal, this.handler))
  }
}

/**
 * Ensure the directory exists. Similar to `mkdir -p` (creates parent directories if they don't exist).
 * 
 * @param dir The directory to ensure exists. If it does not exist, it will be created.
 */
export async function ensureDirectory(dir: string) {
  requireString('dir', dir)
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true })
  }
}

/**
 * Empties a directory of all files and subdirectories.
 * 
 * Optionally skips files and directories at the top level.
 * 
 * @param directoryToEmpty The directory to empty.
 * @param fileAndDirectoryNamesToSkip An optional array of file and directory names to skip, but only at the top level of the directoryToEmpty.
 */
export async function emptyDirectory(directoryToEmpty: string, fileAndDirectoryNamesToSkip?: string[]) {
  requireString('directoryToEmpty', directoryToEmpty)

  if (!fs.existsSync(directoryToEmpty)) {
    log(`directoryToEmpty does not exist - creating directory ${directoryToEmpty}`)
    await fsp.mkdir(directoryToEmpty, { recursive: true })
  }

  const dir = await fsp.opendir(directoryToEmpty, { encoding: 'utf-8' })

  if (fileAndDirectoryNamesToSkip && !Array.isArray(fileAndDirectoryNamesToSkip)) {
    throw new Error('fileAndDirectoryNamesToSkip must be an array')
  }

  let dirEntry = await dir.read()

  while (dirEntry) {
    if (fileAndDirectoryNamesToSkip && fileAndDirectoryNamesToSkip.includes(dirEntry.name)) {
      dirEntry = await dir.read()
      continue
    }

    const direntPath = path.join(directoryToEmpty, dirEntry.name)

    if (dirEntry.isDirectory()) {
      await fsp.rmdir(direntPath, { recursive: true })
    } else {
      await fsp.unlink(direntPath)
    }

    dirEntry = await dir.read()
  }

  await dir.close()
}

/**
 * Copies the contents of a directory to another directory (not including the top-level directory itself).
 * 
 * If the destination directory does not exist, it will be created.
 * 
 * @param sourceDirectory Directory to copy from
 * @param destinationDirectory Directory to copy to
 */
export async function copyDirectoryContents(sourceDirectory: string, destinationDirectory: string) {
  requireString('sourceDirectory', sourceDirectory)
  requireString('destinationDirectory', destinationDirectory)

  if (!fs.existsSync(sourceDirectory)) {
    throw new Error(`sourceDirectory directory does not exist: ${sourceDirectory}`)
  }

  if (!fs.lstatSync(sourceDirectory).isDirectory()) {
    throw new Error(`sourceDirectory is not a directory: ${sourceDirectory}`)
  }

  if (!fs.existsSync(destinationDirectory)) {
    await fsp.mkdir(destinationDirectory, { recursive: true })
  }

  if (!fs.lstatSync(destinationDirectory).isDirectory()) {
    throw new Error(`destinationDirectory is not a directory: ${destinationDirectory}`)
  }

  const dir = await fsp.opendir(sourceDirectory, { encoding: 'utf-8' })

  let dirEntry = await dir.read()

  while (dirEntry) {
    const sourcePath = path.join(sourceDirectory, dirEntry.name)
    const destPath = path.join(destinationDirectory, dirEntry.name)

    if (dirEntry.isDirectory()) {
      await copyDirectoryContents(sourcePath, destPath)
    } else {
      await fsp.copyFile(sourcePath, destPath)
    }

    dirEntry = await dir.read()
  }
}

/**
 * Helper method to spawn a process and run 'dotnet publish'.
 * 
 * @param projectPath Path to project file (like .csproj) or directory of project to build
 * @param configuration Build configuration, such as 'Release'
 * @param outputDir The relative or absolute path for the build output
 * @param cwd Optionally run the command from another current working directory
 */
export async function dotnetPublish(projectPath: string = './', configuration: string = 'Release', outputDir: string = 'publish', cwd?: string) {
  requireValidPath('projectPath', projectPath)
  requireString('outputDir', outputDir)
  requireString('configuration', configuration)
  if (cwd) {
    requireValidPath('cwd', cwd)
  }
  const args = ['publish', projectPath, '-c', configuration, '-o', outputDir]
  log(`running dotnet ${args.join(' ')}${cwd ? ` in cwd ${cwd}` : ''}`)
  await spawnAsync('dotnet', args, { cwd: cwd })
}

function requireString(paramName: string, paramValue: string) {
  if (paramValue === undefined || paramValue === null || paramValue === '') {
    throw new Error(`Required param '${paramName}' is missing`)
  }
  if (typeof paramValue !== 'string') {
    throw new Error(`Required param '${paramName}' is not a string`)
  }
}

function requireValidPath(paramName: string, paramValue: string) {
  requireString(paramName, paramValue)

  if (!fs.existsSync(paramValue)) {
    throw new Error(`Invalid or nonexistent path provided for param '${paramName}': ${paramValue}`)
  }
}

/**
 * Creates a tarball from a directory.
 * 
 * @param directoryToTarball The directory to tarball. The directory name will be used as the root directory in the tarball.
 * @param tarballPath The path to the tarball to create. Must end with '.tar.gz'.
 */
export async function createTarball(directoryToTarball: string, tarballPath: string): Promise<void> {
  requireString('directoryToTarball', directoryToTarball)
  requireString('tarballPath', tarballPath)

  if (tarballPath.endsWith('.tar.gz') === false) {
    throw new Error(`tarballPath must end with '.tar.gz': ${tarballPath}`)
  }

  if (!fs.existsSync(directoryToTarball)) {
    throw new Error(`directoryToTarball does not exist: ${directoryToTarball}`)
  }

  const directoryToTarballParentDir = path.dirname(directoryToTarball)
  const directoryToTarballName = path.basename(directoryToTarball)

  const outputDirectory = path.dirname(tarballPath)
  const tarballName = path.basename(tarballPath)

  if (!fs.existsSync(outputDirectory)) {
    log(`tarballPath directory does not exist - creating '${outputDirectory}'`)
    await fsp.mkdir(outputDirectory, { recursive: true })
  } else if (fs.existsSync(tarballPath)) {
    log(`removing existing tarball '${tarballName}' before creating new one`)
    await fsp.unlink(tarballPath)
  }

  const options: CreateOptions & FileOptions = { gzip: true, file: tarballPath, cwd: directoryToTarballParentDir }
  const fileList: ReadonlyArray<string> = [directoryToTarballName]
  await (tar.create as (options: CreateOptions & FileOptions, fileList: ReadonlyArray<string>) => Promise<void>)(options, fileList)

  log('tarball created: ' + tarballPath)
}

/**
 * Options for the dockerCompose function.
 * 
 * @param args Additional arguments to pass to the docker-compose command
 * @param projectName Pass the same projectName for each commands for the same project to ensure your containers get unique, descriptive and consistent names
 * @param detached Default: false. Commands that use -d: exec, logs, ps, restart, run, start, stop, up
 */
export interface DockerComposeOptions {
  args?: string[]
  projectName?: string
  detached?: boolean
  useDockerComposeFileDirectoryAsCwd?: boolean
}

/**
 * For docker compose commands, see https://docs.docker.com/compose/reference/.
 * 
 * @param dockerComposePath Path to docker-compose.yml
 * @param dockerComposeCommand The docker-compose command to run
 * @param options {@link DockerComposeOptions} to use, including additional arguments to pass to the docker compose command and the project name
 */
export async function spawnDockerCompose(dockerComposePath: string, dockerComposeCommand: DockerComposeCommand, options?: DockerComposeOptions): Promise<void> {
  requireValidPath('dockerComposePath', dockerComposePath)
  requireString('dockerComposeCommand', dockerComposeCommand)

  const useDockerComposeFileDirectoryAsCwd = options && options.useDockerComposeFileDirectoryAsCwd

  if (await isDockerRunning() === false) {
    throw new Error('Docker is not running')
  }

  const mergedOptions = { ...{ detached: false }, ...options }

  const dockerComposeDir = path.dirname(dockerComposePath)
  const dockerComposeFilename = path.basename(dockerComposePath)

  const spawnCommand = 'docker'
  let spawnArgs = ['compose', '-f', useDockerComposeFileDirectoryAsCwd ? dockerComposeFilename : dockerComposePath]

  if (mergedOptions.projectName) {
    spawnArgs.push('--project-name', mergedOptions.projectName)
  }

  spawnArgs.push(dockerComposeCommand)

  if (mergedOptions.detached && dockerComposeCommandsThatSupportDetached.includes(dockerComposeCommand)) {
    spawnArgs.push('-d')
  }

  if (mergedOptions.args) {
    spawnArgs = spawnArgs.concat(mergedOptions.args)
  }

  const dockerCommandString = `docker ${spawnArgs.join(' ')}`
  const traceMessage = useDockerComposeFileDirectoryAsCwd ?
    `running command in ${dockerComposeDir}: ${dockerCommandString}` :
    `running command: ${dockerCommandString}`

  log(traceMessage)

  const longRunning = dockerComposeCommandsThatSupportDetached.includes(dockerComposeCommand) && options && !options.detached

  const spawnResult = await spawnAsync(spawnCommand, spawnArgs, { cwd: useDockerComposeFileDirectoryAsCwd ? dockerComposeDir : process.cwd(), shell: true }, longRunning)

  if (spawnResult.code !== 0) {
    throw new Error(`docker compose command failed with code ${spawnResult.code}`)
  }
}

/**
 * Splits a string into lines, removing empty lines and carriage return characters.
 * 
 * @param str String to split into lines
 * @returns An array of lines from the string, with empty lines removed
 */
export function stringToLines(str: string): string[] {
  if (!str) { return [] }
  return str.split('\n').filter(line => line && line.trim()).map(line => line.replace('\r', ''))
}

/**
 * Runs the requested command using NodeJS spawnSync wrapped in an outer Windows CMD.exe command and returns the result with stdout split into lines.
 * 
 * Use this for simple quick commands that don't require a lot of control.
 * 
 * For commands that aren't Windows and CMD specific, use {@link getSimpleSpawnResultSync}.
 * 
 * @param command Command to run
 * @param args Arguments to pass to the command
 * @returns An object with the status code, stdout, stderr, and error (if any)
 */
export function getSimpleCmdResultSync(command: string, args?: string[]): SimpleSpawnResult {
  if (!isWindows()) {
    throw new Error('getCmdResult is only supported on Windows')
  }
  return getSimpleSpawnResultSync('cmd', ['/D', '/S', '/C', command, ...(args ?? [])])
}

/**
 * Runs the requested command using NodeJS spawnSync and returns the result with stdout split into lines.
 * 
 * Use this for simple quick commands that don't require a lot of control.
 * 
 * For commands that are Windows and CMD specific, use {@link getSimpleCmdResultSync}.
 * 
 * @param command Command to run
 * @param args Arguments to pass to the command
 * @returns An object with the status code, stdout, stderr, and error (if any)
 */
export function getSimpleSpawnResultSync(command: string, args?: string[]): SimpleSpawnResult {
  requireString('command', command)
  const result = spawnSync(command, args ?? [], { encoding: 'utf-8' })
  return {
    status: result.status,
    stdout: result.stdout.toString(),
    stderr: result.stdout.toString(),
    stdoutLines: stringToLines(result.stdout.toString()),
    error: result.error
  }
}

export function isWindows() {
  return platform() === 'win32'
}

export function whichSync(commandName: string): WhichResult {
  if (isWindows()) {
    const result = getSimpleCmdResultSync('where', [commandName])
    return {
      location: result.stdoutLines[0],
      additionalLocations: result.stdoutLines.slice(1),
      error: result.error
    }
  } else {
    const result = getSimpleSpawnResultSync('which', ['-a', commandName])
    return {
      location: result.stdoutLines[0],
      additionalLocations: result.stdoutLines.slice(1),
      error: result.error
    }
  }
}

export async function isDockerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('docker info', (error, stdout) => {
      if (error) {
        resolve(false)
      } else {
        if (!stdout || stdout.includes('error during connect')) {
          resolve(false)
        } else {
          resolve(true)
        }
      }

    })
  })
}