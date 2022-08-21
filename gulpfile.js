const {
  defaultSpawnOptions,
  waitForProcess,
  createTarball,
  copyNewEnvValues,
  overwriteEnvFile,
  dockerDepsUp,
  dockerDepsUpDetached,
  dockerDepsDown,
  dockerContainerIsRunning,
  dotnetDllCommand,
  dotnetPublish,
  dotnetDbMigrationsList,
  dotnetDbMigrate,
  dotnetDbAddMigration,
  dotnetDbRemoveMigration
} = require('@mikeyt23/node-cli-utils')
const spawn = require('child_process').spawn
const fs = require('fs-extra')
const {series, parallel, src, dest} = require('gulp')
const path = require('path')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv;

const buildDir = './build'
const buildWwwrootDir = './build/wwwroot'
const clientAppPath = './src/client'
const serverAppPath = './src/WebServer'
const tarballName = 'drs.tar.gz'
const dockerPath = './docker'
const dockerProjectName = 'drs'
const dockerDbContainerName = 'drs_postgres'
const preDeployHttpPort = '3001'
const preDeployHttpsPort = '3000'

const dbMigratorPath = 'src/DbMigrator/'
const mainDbContextName = 'MainDbContext'
const testDbContextName = 'TestDbContext'

// Comment out function to undo skipping of docker dependency checks
throwIfDockerDependenciesNotUp = async () => {
  console.log('skipping docker dependencies check')
}

// ****************
// Task Definitions

async function syncEnvFiles() {
  const envName = '.env'

  const rootServerEnv = './env/.env.server'
  const rootServerEnvTemplate = rootServerEnv + '.template'

  // Copy root .env.[category].template to .env
  await copyNewEnvValues(rootServerEnvTemplate, rootServerEnv)

  // Copy root .env.[category] to subdirectory .env files
  await overwriteEnvFile(rootServerEnv, path.join(serverAppPath, envName))
  await overwriteEnvFile(rootServerEnv, path.join(dockerPath, envName))
  await overwriteEnvFile(rootServerEnv, path.join(dbMigratorPath, envName))

  await ensureBuildDir()
  await overwriteEnvFile(rootServerEnv, path.join('./build/', envName))
}

async function buildServer() {
  fs.emptyDirSync(buildDir)
  await dotnetPublish(serverAppPath, path.resolve(__dirname, buildDir))
  await fs.remove(path.join(buildDir, '.env'))
}

async function buildClient() {
  await waitForProcess(spawn('npm', ['run', 'build', '--prefix', clientAppPath], defaultSpawnOptions))
  await fs.remove(path.join(clientAppPath, 'build', '.env'))
}

async function runBuilt() {
  await addRunBuiltEnv()
  await waitForProcess(spawn('dotnet', ['WebServer.dll', '--launch-profile', '"PreDeploy"'], {...defaultSpawnOptions, cwd: './build/'}))
}

// **************
// Helper Methods

async function ensureBuildDir() {
  fs.mkdirpSync(buildWwwrootDir)
}

// Important: this must not be marked async. In this case we want to return the stream object, not a promise.
function copyClientBuild() {
  if (fs.pathExistsSync(path.join(clientAppPath, 'build'))) {
    fs.emptyDirSync(buildWwwrootDir)
  }
  return src(`${clientAppPath}/build/**/*`).pipe(dest(buildWwwrootDir))
}

async function packageBuild() {
  console.log('creating tarball for release')
  await createTarball('build', 'release', tarballName)
}

async function throwIfDockerDependenciesNotUp() {
  const postgresIsRunning = await dockerContainerIsRunning(dockerDbContainerName)
  if (!postgresIsRunning) {
    throw `Docker dependencies are not running (container ${dockerDbContainerName}). Try running 'npm run dockerUp' or 'npm run dockerUpDetached'.`
  }
}

async function emptyMigratorPublishDir() {
  const migratorPublishPath = path.join(__dirname, `${dbMigratorPath}/publish/`)
  console.log('emptying path: ' + migratorPublishPath)
  fs.emptyDirSync(migratorPublishPath)
}

async function removeEnvFromPublishedMigrator() {
  await fs.remove(path.join(dbMigratorPath, 'publish/.env'))
}

async function createDbMigratorTarball() {
  console.log('creating DbMigrator project tarball')
  await createTarball('publish', 'release', 'DbMigrator.tar.gz', dbMigratorPath)
}

async function configureDotnetDevCert() {
  await waitForProcess(spawn('dotnet', ['dev-certs', 'https', '--clean']))
  await waitForProcess(spawn('dotnet', ['dev-certs', 'https', '-t']))
}

async function addRunBuiltEnv() {
  const envPath = path.join(buildDir, '.env')
  await fs.outputFile(envPath, '\nASPNETCORE_ENVIRONMENT=Production', {flag: 'a'})
  await fs.outputFile(envPath, `\nPRE_DEPLOY_HTTP_PORT=${preDeployHttpPort}`, {flag: 'a'})
  await fs.outputFile(envPath, `\nPRE_DEPLOY_HTTPS_PORT=${preDeployHttpsPort}`, {flag: 'a'})
}

async function dbMigratorCommand(command) {
  await dotnetDllCommand('publish/DbMigrator.dll', [command], dbMigratorPath, true)
}

async function dbMigrate(dbContextName) {
  await dotnetDbMigrate(dbContextName, dbMigratorPath, argv['name'])
}

async function dbAddMigration(dbContextName) {
  await dotnetDbAddMigration(dbContextName, dbMigratorPath, argv['name'])
}

async function dbRemoveMigration(dbContextName) {
  await dotnetDbRemoveMigration(dbContextName, dbMigratorPath)
}

async function dbMigrationsList(dbContextName) {
  await dotnetDbMigrationsList(dbContextName, dbMigratorPath)
}

// ******************************
// Composed and exported commands

const publishMigrator = async () => await dotnetPublish(dbMigratorPath)
const buildAll = series(ensureBuildDir, parallel(buildServer, buildClient), copyClientBuild)
const publishDbMigrator = series(publishMigrator, removeEnvFromPublishedMigrator, createDbMigratorTarball)
const prepDbMigration = series(throwIfDockerDependenciesNotUp, syncEnvFiles)
const prepDbMigratorCli = series(throwIfDockerDependenciesNotUp, parallel(syncEnvFiles, emptyMigratorPublishDir), publishMigrator)

// Build
exports.buildServer = series(ensureBuildDir, buildServer, copyClientBuild)
exports.buildClient = series(ensureBuildDir, buildClient)
exports.buildAll = buildAll
exports.runBuilt = series(syncEnvFiles, runBuilt)
exports.createRelease = parallel(series(buildAll, packageBuild), publishDbMigrator)

// Docker commands
exports.dockerUpDetached = series(syncEnvFiles, () => dockerDepsUpDetached(dockerProjectName))
exports.dockerUpAttached = series(syncEnvFiles, () => dockerDepsUp(dockerProjectName))
exports.dockerDown = () => dockerDepsDown(dockerProjectName)

// DB operations
exports.dbInitialCreate = series(prepDbMigratorCli, async () => await dbMigratorCommand('dbInitialCreate'))
exports.dbDropAll = series(prepDbMigratorCli, async () => await dbMigratorCommand('dbDropAll'))
exports.dbDropAndRecreate = series(
  prepDbMigratorCli,
  async () => await dbMigratorCommand('dbDropAll'),
  async () => await dbMigratorCommand('dbInitialCreate')
)
exports.dbMigrateFromBuilt = series(prepDbMigratorCli, async () => await dbMigratorCommand('dbMigrate'))

exports.dbMigrate = series(prepDbMigration, async () => await dbMigrate(mainDbContextName))
exports.testDbMigrate = series(prepDbMigration, async () => await dbMigrate(testDbContextName))
exports.bothDbMigrate = series(prepDbMigration, async () => await dbMigrate(mainDbContextName), async () => await dbMigrate(testDbContextName))

exports.dbAddMigration = series(prepDbMigration, async () => await dbAddMigration(mainDbContextName))
exports.testDbAddMigration = series(prepDbMigration, async () => await dbAddMigration(testDbContextName))
exports.bothDbAddMigration = series(prepDbMigration, async () => await dbAddMigration(mainDbContextName), async () => await dbAddMigration(testDbContextName))

exports.dbRemoveMigration = series(prepDbMigration, async () => await dbRemoveMigration(mainDbContextName))
exports.testDbRemoveMigration = series(prepDbMigration, async () => await dbRemoveMigration(testDbContextName))
exports.bothDbRemoveMigration = series(prepDbMigration, async () => await dbRemoveMigration(mainDbContextName), async () => await dbRemoveMigration(testDbContextName))

exports.dbMigrationsList = series(prepDbMigration, async () => await dbMigrationsList(mainDbContextName))
exports.testDbMigrationsList = series(prepDbMigration, async () => await dbMigrationsList(testDbContextName))
exports.bothDbMigrationsList = series(prepDbMigration, async () => await dbMigrationsList(mainDbContextName), async () => await dbMigrationsList(testDbContextName))

exports.publishDbMigrator = publishDbMigrator

// Misc operations
exports.syncEnvFiles = syncEnvFiles
exports.configureDotnetDevCert = configureDotnetDevCert
exports.copyClientBuild = copyClientBuild
exports.packageBuild = packageBuild
