import dotenv from 'dotenv'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { parallel, series } from 'swig-cli'
import * as nodeCliUtils from '@mikeyt23/node-cli-utils'
import * as certUtils from '@mikeyt23/node-cli-utils/certUtils'
import * as dbMigrationUtils from '@mikeyt23/node-cli-utils/dbMigrationUtils'
import * as dotnetUtils from '@mikeyt23/node-cli-utils/dotnetUtils'
import { log } from '@mikeyt23/node-cli-utils'
import SandboxDependencyChecker from './SandboxDependencyChecker.ts'
import ProjectSetupUtil from './ProjectSetupUtil.ts'
import { StringBoolArray } from './DependencyChecker.ts'

dotenv.config()

const projectName = process.env.PROJECT_NAME || 'drs' // Need a placeholder before first time syncEnvFiles task runs

const buildDir = './build'
const buildWwwrootDir = `${buildDir}/wwwroot`
const releaseDir = './release'
const dockerPath = './docker'
const serverPath = './server/src/WebServer'
const serverTestPath = `./server/src/WebServer.Test`
const clientPath = './client'
const dbMigratorPath = 'server/src/DbMigrator/'

const releaseTarballName = `${projectName}.tar.gz`
const dbMigratorTarballName = 'DbMigrator.tar.gz'
const dockerComposePath = `${dockerPath}/docker-compose.yml`
const serverCsprojPath = `${serverPath}/WebServer.csproj`
const preDeployHttpsPort = '3000'
const preDeployHttpPort = '3001'
const mainDbContextName = 'MainDbContext'
const testDbContextName = 'TestDbContext'
const directoriesWithEnv = [dockerPath, serverPath, serverTestPath, dbMigratorPath, clientPath, buildDir]

let dependencyChecker: SandboxDependencyChecker
let projectSetupUtil: ProjectSetupUtil
let siteUrl: string = ''
let noDb = false

export const setup = series(
  syncEnvFiles,
  populateSetupGlobals,
  setupCheckDependencies,
  setupCert,
  setupHostsEntry,
  ['dockerUp', async () => conditionally(async () => doDockerCompose('up'), !noDb)],
  ['dbInitialCreate', async () => conditionally(async () => withRetryAsync(async () => dbMigratorCliCommand('dbInitialCreate'), 5, 3000, 10000, 'dbMigratorCliCommand'), !noDb)],
  ['dbMigrate', async () => conditionally(async () => executeEfAction('update', 'both'), !noDb)]
)

export const setupStatus = series(
  syncEnvFiles,
  populateSetupGlobals,
  reportSetupStatus
)

export const teardown = series(
  syncEnvFiles,
  populateSetupGlobals,
  teardownCheckDependencies,
  teardownCert,
  teardownHostsEntry,
  teardownDb
)

export const server = series(syncEnvFiles, runServer)
export const client = series(syncEnvFiles, runClient)

export const testServer = series(syncEnvFiles, doTestServer)

export const buildClient = series(syncEnvFiles, doBuildClient)
export const copyClientBuildOnly = doCopyClientBuild
export const buildServer = series(syncEnvFiles, doBuildServer)
export const createDbMigratorRelease = series(parallel(syncEnvFiles, ensureReleaseDir), doCreateDbMigratorRelease)
export const buildAll = series(parallel(syncEnvFiles, ensureReleaseDir), parallel(doBuildClient, doBuildServer), doCopyClientBuild)

export const runBuilt = series(syncEnvFiles, doRunBuilt)

export const createRelease = parallel(series(buildAll, createReleaseTarball), doCreateDbMigratorRelease)
export const createReleaseTarballOnly = createReleaseTarball

export const dockerUp = series(syncEnvFiles, ['dockerUp', async () => doDockerCompose('up')])
export const dockerUpAttached = series(syncEnvFiles, ['dockerDown', async () => doDockerCompose('down')], ['dockerUpAttached', async () => doDockerCompose('up', true)])
export const dockerDown = series(syncEnvFiles, ['dockerUp', async () => doDockerCompose('down')])

export const dbInitialCreate = series(syncEnvFiles, ['dbInitialCreate', async () => dbMigratorCliCommand('dbInitialCreate')])
export const dbDropAll = series(syncEnvFiles, ['dbDropAll', async () => dbMigratorCliCommand('dbDropAll')])
export const dbDropAndRecreate = series(syncEnvFiles, ['dbDropAndRecreate', async () => dbMigratorCliCommand('dbDropAndRecreate')])

export const dbListMigrations = series(syncEnvFiles, doListMigrations)
export const dbMigrate = series(syncEnvFiles, doDbMigrate)
export const dbAddMigration = series(syncEnvFiles, doDbAddMigration)
export const dbRemoveMigration = series(syncEnvFiles, doDbRemoveMigration)

export const bashIntoDb = series(syncEnvFiles, bashIntoPostgresContainer)

export const installOrUpdateDotnetEfTool = dotnetUtils.installOrUpdateDotnetEfTool
export const configureDotnetDevCerts = dotnetUtils.configureDotnetDevCerts

export async function deleteBuildAndRelease() {
  const dirs = ['./build', './release']
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      await fsp.rm(dir, { recursive: true })
    }
  }
}

/**
 * Copies any new values from .env.template to .env and then copies .env to all directories in directoriesWithEnv.
 * Values added directly to .env files in directoriesWithEnv will not be overwritten, but this is not recommended.
 * Instead, use your root .env file as the source of truth and never directly modify the others unless it's temporary.
 * 
 * Use additional arg 'clean' to delete all the non-root .env copies before making new copies. Useful for removing
 * values that are no longer in the root .env file.
 */
export async function syncEnvFiles() {
  const rootEnvPath = './.env'
  if (process.argv[3] && process.argv[3] === 'clean') {
    log(`syncEnvFiles called with 'clean' arg - deleting .env copies`)
    await deleteEnvCopies()
  }

  await nodeCliUtils.copyNewEnvValues(`${rootEnvPath}.template`, rootEnvPath)
  // Load env vars from root .env file into process.env in case this is the
  // first run or if there are new vars copied over from .env.template.
  dotenv.config()

  await nodeCliUtils.ensureDirectory(buildWwwrootDir)
  for (const dir of directoriesWithEnv) {
    await nodeCliUtils.overwriteEnvFile(rootEnvPath, path.join(dir, '.env'), dir === serverTestPath)
  }
  await nodeCliUtils.copyModifiedEnv(
    rootEnvPath,
    `${serverTestPath}/.env`,
    ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'],
    { 'DB_NAME': `test_${process.env.DB_NAME || 'DB_NAME_MISSING_FROM_PROCESS_ENV'}` }
  )
}

export async function deleteEnvCopies() {
  for (const dir of directoriesWithEnv) {
    const envPath = path.join(dir, '.env')
    if (fs.existsSync(envPath)) {
      log('deleting .env file at path', envPath)
      await nodeCliUtils.deleteEnvIfExists(envPath)
    }
  }
}

export async function generateCert() {
  const url = getRequireAdditionalParam('Missing param to be used for cert url. Example: swig generateCert local.acme.com')
  await certUtils.generateCertWithOpenSsl(url)
}

export async function winInstallCert() {
  const url = getRequireAdditionalParam('Missing param to be used for cert url. Example: swig winInstallCert local.acme.com')
  const certPath = path.join('./cert/', `${url}.pfx`)
  if (fs.existsSync(certPath)) {
    log(`using cert file at path ${certPath}`)
  } else {
    log(`cert does not exist at path ${certPath}, generating...`)
    await certUtils.generateCertWithOpenSsl(url)
  }
  log(`attempting to install cert for url ${url}`)
  await certUtils.winInstallCert(url)
}

export async function winUninstallCert() {
  const certSubject = getRequireAdditionalParam('Missing param to be used for cert url. Example: swig winUninstallCert local.acme.com')
  await certUtils.winUninstallCert(certSubject)
}

export async function linuxInstallCert() {
  certUtils.linuxInstallCert() // This doesn't actually install anything - it just dumps out instructions for how to do it manually...
}

// End exported functions //
//**************************
// Start helper functions //

async function runServer() {
  const command = 'dotnet'
  const args = ['watch', '--project', serverCsprojPath]
  await nodeCliUtils.spawnAsyncLongRunning(command, args)
}

async function runClient() {
  const command = 'node'
  const args = ['./node_modules/vite/bin/vite.js', 'dev']
  await nodeCliUtils.spawnAsyncLongRunning(command, args, clientPath)
}

async function doTestServer() {
  await nodeCliUtils.spawnAsyncLongRunning('dotnet', ['test'], serverTestPath)
}

async function doBuildClient() {
  await nodeCliUtils.spawnAsync('npm', ['run', 'build', '--omit=dev'], { cwd: clientPath })
}

async function doBuildServer() {
  log('emptying build directory')
  await nodeCliUtils.emptyDirectory(buildDir, ['wwwroot'])
  log('building server')
  await dotnetUtils.dotnetPublish(serverCsprojPath, 'Release', buildDir)
}

async function ensureReleaseDir() {
  await nodeCliUtils.ensureDirectory(releaseDir)
}

async function doBuildDbMigrator() {
  const publishDir = path.join(dbMigratorPath, 'publish')
  await dotnetUtils.dotnetPublish(dbMigratorPath, 'Release', publishDir)
  await nodeCliUtils.deleteEnvIfExists(path.join(publishDir, '.env'))
  return publishDir
}

async function doCreateDbMigratorRelease() {
  const publishDir = await doBuildDbMigrator()
  await nodeCliUtils.createTarball(publishDir, path.join(releaseDir, dbMigratorTarballName), { excludes: ['.env'] })
}

async function doCopyClientBuild() {
  await nodeCliUtils.copyDirectoryContents(path.join(clientPath, 'dist'), buildWwwrootDir)
}

async function createReleaseTarball() {
  await nodeCliUtils.createTarball(buildDir, path.join(releaseDir, releaseTarballName), { excludes: ['.env'] })
}

async function doDockerCompose(upOrDown: 'up' | 'down', attached = false) {
  await nodeCliUtils.spawnDockerCompose(dockerComposePath, upOrDown, { attached })
}

async function bashIntoPostgresContainer() {
  await nodeCliUtils.spawnDockerCompose(dockerComposePath, 'exec', { args: ['-it', 'postgresql', 'bash'], attached: true })
}

type DbMigratorCommand = 'dbInitialCreate' | 'dbDropAll' | 'dbDropAndRecreate'

async function dbMigratorCliCommand(command: DbMigratorCommand) {
  if (command === 'dbInitialCreate') {
    const result = await nodeCliUtils.spawnAsync('dotnet', ['run', '--project', dbMigratorPath, 'dbInitialCreate'])
    if (result.code !== 0) {
      throw new Error(`dbInitialCreate failed with exit code ${result.code}`)
    }
    return
  }
  if (command === 'dbDropAll' && !await nodeCliUtils.getConfirmation('Are you sure you want to drop main and test databases and database user?')) {
    return
  }
  if (command === 'dbDropAndRecreate') {
    if (!await nodeCliUtils.getConfirmation('Are you sure you want to drop main and test databases and database user?')) {
      return
    } else {
      await nodeCliUtils.spawnAsync('dotnet', ['run', '--project', dbMigratorPath, 'dbDropAll'], { throwOnNonZero: true })
      await nodeCliUtils.spawnAsync('dotnet', ['run', '--project', dbMigratorPath, 'dbInitialCreate'], { throwOnNonZero: true })
      return
    }
  }
  throw new Error(`Unknown DbMigrator command: ${command}`)
}

type DbContextOption = 'main' | 'test' | 'both'
const dbContextOptions = ['main', 'test', 'both']

const dbContexts: nodeCliUtils.StringKeyedDictionary = {
  main: mainDbContextName,
  test: testDbContextName
}

function getDbContextArg() {
  const additionalArg = process.argv[3]
  return additionalArg && dbContextOptions.includes(additionalArg) ? additionalArg : 'main'
}

function getMigrationNameArg() {
  const migrationName = process.argv[4] || process.argv[3]
  return migrationName && !dbContextOptions.includes(migrationName) ? migrationName : undefined
}

function logDbCommandMessage(prefix: string) {
  log(`${prefix} using project path 📁${dbMigratorPath} and db context arg ⚙️${getDbContextArg()} (options: ${dbContextOptions.join('|')})`)
}

async function executeEfAction(action: 'list' | 'update' | 'add' | 'remove', dbContextOverride?: DbContextOption) {
  const dbContextArg = dbContextOverride || getDbContextArg()
  const migrationName = getMigrationNameArg()

  log(`dbContextArg: ${dbContextArg}`)
  if (migrationName) {
    log(`migrationName: ${migrationName}`)
  }

  if (action === 'add' && !migrationName) {
    throw new Error('Missing migration name')
  }

  // Build once explicitly so that all commands can use the noBuild option.
  // This will speed up operations that require multiple 'dotnet ef' commands.
  await dotnetUtils.dotnetBuild(dbMigratorPath)

  for (const key of Object.keys(dbContexts)) {
    if (dbContextArg === key || dbContextArg === 'both') {
      const dbContextName = dbContexts[key]
      switch (action) {
        case 'list':
          await dbMigrationUtils.efMigrationsList(dbMigratorPath, dbContextName)
          break
        case 'update':
          log(migrationName ? `Updating ➡️${dbContextName} to migration name: ${migrationName}` : `Updating ➡️${dbContextName} to latest migration`)
          await dbMigrationUtils.efMigrationsUpdate(dbMigratorPath, dbContextName, migrationName)
          break
        case 'add':
          log(`adding migration ➡️${migrationName} to ➡️${dbContextName}`)
          await dbMigrationUtils.efAddMigration(dbMigratorPath, dbContextName, migrationName!, true)
          break
        case 'remove':
          log(`removing last migration from ➡️${dbContextName}`)
          await dbMigrationUtils.efRemoveLastMigration(dbMigratorPath, dbContextName)
          break
      }
    }
  }
}

async function doListMigrations() {
  logDbCommandMessage('Listing migrations')
  await executeEfAction('list')
}

async function doDbMigrate() {
  logDbCommandMessage('Updating database')
  await executeEfAction('update')
}

async function doDbAddMigration() {
  logDbCommandMessage('Adding migration')
  await executeEfAction('add')
}

async function doDbRemoveMigration() {
  logDbCommandMessage('Removing last migration')
  await executeEfAction('remove')
}

async function doRunBuilt() {
  const buildEnvPath = path.join(buildDir, '.env')
  await fsp.writeFile(buildEnvPath, '\nASPNETCORE_ENVIRONMENT=Production', { flag: 'a' })
  await fsp.writeFile(buildEnvPath, `\nPRE_DEPLOY_HTTP_PORT=${preDeployHttpPort}`, { flag: 'a' })
  await fsp.writeFile(buildEnvPath, `\nPRE_DEPLOY_HTTPS_PORT=${preDeployHttpsPort}`, { flag: 'a' })
  const siteUrl = projectSetupUtil.getRequiredEnvVar('SITE_URL')
  const devCertName = `${siteUrl}.pfx}`
  const certSourcePath = path.join('./cert/', devCertName)
  const certDestinationPath = path.join(buildDir, devCertName)
  await fsp.copyFile(certSourcePath, certDestinationPath)
  await nodeCliUtils.spawnAsyncLongRunning('dotnet', ['WebServer.dll', '--launch-profile', '"PreDeploy"'], './build/')
}

function getRequireAdditionalParam(errorWithExample: string) {
  const additionalParam = process.argv[3]
  if (!additionalParam) {
    throw new Error(errorWithExample)
  }
  return additionalParam
}

async function populateSetupGlobals() {
  dependencyChecker = new SandboxDependencyChecker()
  projectSetupUtil = new ProjectSetupUtil(dependencyChecker)
  siteUrl = projectSetupUtil.getRequiredEnvVar('SITE_URL')
  if (process.argv[3] && process.argv[3].toLowerCase() === 'nodb') {
    noDb = true
  }
}

async function setupCheckDependencies() {
  let report = await dependencyChecker.getReport()
  if (noDb) {
    report = report.filter(({ key }) => key !== 'DB_PORT is available')
  }
  log(dependencyChecker.getFormattedReport(report))
  const depsCheckPassed = dependencyChecker.hasAllDependencies(report)
  log(`Dependencies check passed: ${depsCheckPassed ? 'true' : 'false'}\n`,)
  if (!depsCheckPassed) {
    throw Error('dependencies check failed - see above')
  }
}

async function reportSetupStatus() {
  const dependenciesReport = await dependencyChecker.getReport()
  log('Checking dependencies:')
  log(dependencyChecker.getFormattedReport(dependenciesReport, true, ['Elevated Permissions', 'DB_PORT is available', 'DEV_CLIENT_PORT is available', 'DEV_SERVER_PORT is available']))

  log('Checking cert and hosts setup:')
  const certStatuses = await projectSetupUtil.getStatusCert(siteUrl)
  const hostsStatus = await projectSetupUtil.getStatusHosts(siteUrl)
  const othersReport: StringBoolArray = [...certStatuses, hostsStatus]
  log(dependencyChecker.getFormattedReport(othersReport))
}

async function setupCert() {
  await projectSetupUtil.ensureCertSetup(siteUrl)
}

async function setupHostsEntry() {
  await projectSetupUtil.ensureHostsEntry(siteUrl)
}

async function teardownCheckDependencies() {
  if (!await dependencyChecker!.hasElevatedPermissions()) {
    throw new Error('Elevated permissions are required to run teardown')
  }
}

async function teardownCert() {
  await projectSetupUtil.teardownCertSetup(siteUrl)
}

async function teardownHostsEntry() {
  await projectSetupUtil.removeHostsEntry(siteUrl)
}

async function teardownDb() {
  if (noDb) {
    log('skipping')
    return
  }
  if (!await nodeCliUtils.getConfirmation(`Do you want to completely destroy your database? (this will delete './docker/pg')`)) {
    return
  }
  await doDockerCompose('down')
  await nodeCliUtils.emptyDirectory('docker/pg')
}

async function withRetryAsync(func: () => Promise<void>, maxRetries: number, delayMilliseconds: number, initialDelayMilliseconds?: number, functionLabel?: string) {
  let done = false
  let attemptNumber = 0
  let lastError: unknown
  const funcName = functionLabel || func.name || 'anonymous'

  if (initialDelayMilliseconds) {
    log(`initialDelayMilliseconds set to ${initialDelayMilliseconds} - waiting before first try`)
    await nodeCliUtils.sleep(initialDelayMilliseconds)
  }

  while (!done) {
    attemptNumber++
    log(`calling ${funcName} - attempt number ${attemptNumber}`)
    try {
      await func()
      done = true
      log(`attempt ${attemptNumber} was successful`)
      break
    } catch (err) {
      lastError = err
      log(`attempt number ${attemptNumber} failed - waiting ${delayMilliseconds} milliseconds before trying again`)
    }

    if (attemptNumber === maxRetries) {
      throw new Error(`Failed to run method with retry after ${maxRetries} attempts`, { cause: lastError })
    }

    if (!done) {
      await nodeCliUtils.sleep(delayMilliseconds)
    }
  }
}

async function conditionally(asyncFunc: () => Promise<void>, condition: boolean) {
  if (condition) {
    await asyncFunc()
  } else {
    log('skipping')
  }
}
