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
const {spawn, spawnSync} = require('child_process')
const fse = require('fs-extra')
const fs = require('fs')
const {series, parallel, src, dest} = require('gulp')
const path = require('path')
const yargs = require('yargs/yargs')
const {hideBin} = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv;
const which = require('which')
require('dotenv').config()

const projectName = process.env.PROJECT_NAME || 'drs' // Need a placeholder before first syncEnvFile task runs

const buildDir = './build'
const buildWwwrootDir = './build/wwwroot'
const clientAppPath = './src/client'
const serverAppPath = './src/WebServer'
const tarballName = `${projectName}.tar.gz`
const dockerPath = './docker'
const dockerProjectName = projectName
const dockerDbContainerName = `${projectName}_postgres`
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

  const rootEnv = './.env'
  const rootEnvTemplate = rootEnv + '.template'

  // Copy root .env.[category].template to .env
  await copyNewEnvValues(rootEnvTemplate, rootEnv)

  // Copy root .env.[category] to subdirectory .env files
  await overwriteEnvFile(rootEnv, path.join(serverAppPath, envName))
  await overwriteEnvFile(rootEnv, path.join(dockerPath, envName))
  await overwriteEnvFile(rootEnv, path.join(dbMigratorPath, envName))
  await overwriteEnvFile(rootEnv, path.join(clientAppPath, envName))
  await writeServerTestEnv()

  await ensureBuildDir()
  await overwriteEnvFile(rootEnv, path.join('./build/', envName))
}

async function buildServer() {
  fse.emptyDirSync(buildDir)
  await dotnetPublish(serverAppPath, path.resolve(__dirname, buildDir))
  await fse.remove(path.join(buildDir, '.env'))
}

async function buildClient() {
  await waitForProcess(spawn('npm', ['run', 'build', '--prefix', clientAppPath], defaultSpawnOptions))
}

async function runBuilt() {
  await doRunBuiltChanges()
  await waitForProcess(spawn('dotnet', ['WebServer.dll', '--launch-profile', '"PreDeploy"'], {...defaultSpawnOptions, cwd: './build/'}))
}

// **************
// Helper Methods

async function ensureBuildDir() {
  fse.mkdirpSync(buildWwwrootDir)
}

// Important: this must not be marked async. In this case we want to return the stream object, not a promise.
function copyClientBuild() {
  if (fse.pathExistsSync(path.join(clientAppPath, 'build'))) {
    fse.emptyDirSync(buildWwwrootDir)
  }
  return src(`${clientAppPath}/dist/**/*`).pipe(dest(buildWwwrootDir))
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
  fse.emptyDirSync(migratorPublishPath)
}

async function removeEnvFromPublishedMigrator() {
  await fse.remove(path.join(dbMigratorPath, 'publish/.env'))
}

async function createDbMigratorTarball() {
  console.log('creating DbMigrator project tarball')
  await createTarball('publish', 'release', 'DbMigrator.tar.gz', dbMigratorPath)
}

async function configureDotnetDevCert() {
  await waitForProcess(spawn('dotnet', ['dev-certs', 'https', '--clean']))
  await waitForProcess(spawn('dotnet', ['dev-certs', 'https', '-t']))
}

async function doRunBuiltChanges() {
  const envPath = path.join(buildDir, '.env')
  await fse.outputFile(envPath, '\nASPNETCORE_ENVIRONMENT=Production', {flag: 'a'})
  await fse.outputFile(envPath, `\nPRE_DEPLOY_HTTP_PORT=${preDeployHttpPort}`, {flag: 'a'})
  await fse.outputFile(envPath, `\nPRE_DEPLOY_HTTPS_PORT=${preDeployHttpsPort}`, {flag: 'a'})
  
  const certFromPath = path.join('./cert/', process.env.DEV_CERT_NAME)
  const certToPath = path.join(buildDir, process.env.DEV_CERT_NAME)
  await fse.copySync(certFromPath, certToPath, {})
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

async function opensslGenCert() {
  // First check if openssl is installed
  let macOpensslPath
  if (process.platform !== 'darwin') {
    if (!which.sync('openssl', {nothrow: true})) {
      throw Error('openssl is required but was not found in the path')
    }
  } else {
    console.log('*****************************************************************')
    console.log('* Important: mac support requires openssl be installed via brew *')
    console.log('*****************************************************************')
    
    macOpensslPath = `${getBrewOpensslPath()}/bin/openssl`
    console.log(`openssl path: ${macOpensslPath}`)
  }

  console.log('openssl is installed, continuing...')

  fse.mkdirpSync('./cert')

  let url = argv['url']
  if (!url) {
    throw Error('Param \'url\' is required. Example: npm run opensslGenCert -- --url=local.your-site.com')
  }

  const keyName = url + '.key'
  const crtName = url + '.crt'
  const pfxName = url + '.pfx'

  if (fse.pathExistsSync(path.join(__dirname, `cert/${pfxName}`))) {
    throw Error(`./cert/${pfxName} already exists. Delete this first if you want to generate a new version.`)
  }

  console.log(`attempting to generate cert ${pfxName}`)

  const genCertSpawnArgs = {...defaultSpawnOptions, cwd: 'cert'}

  const genKeyAndCrtArgs = `req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes -keyout ${keyName} -out ${crtName} -subj "/CN=${url}" -addext "subjectAltName=DNS:${url},IP:127.0.0.1"`.split(' ')

  const cmd = process.platform !== 'darwin' ? 'openssl' : macOpensslPath

  console.log('cmd: ' + cmd)

  await waitForProcess(spawn(cmd, genKeyAndCrtArgs, genCertSpawnArgs))

  console.log('converting key and crt to pfx...')

  const convertToPfxArgs = `pkcs12 -certpbe AES-256-CBC -export -out ${pfxName} -aes256 -inkey ${keyName} -in ${crtName} -password pass:`.split(' ')

  await waitForProcess(spawn(cmd, convertToPfxArgs, genCertSpawnArgs))
}

function getBrewOpensslPath() {
  let childProc = spawnSync('brew', ['--prefix', 'openssl'], { encoding: 'utf-8' })
  if (childProc.error) {
    throw Error('error attempting to find openssl installed by brew')
  }

  const output = childProc.stdout

  if (!output || output.length === 0 || output.toLowerCase().startsWith('error')) {
    throw Error('unexpected output while attempting to find openssl')
  }
  
  return output.replace('\n', '')
}

async function winInstallCert() {
  console.log('******************************\n* Requires admin permissions *\n******************************')

  let certName = argv['name']
  if (!certName) {
    throw Error('Param cert \'name\' is required. Example: npm run winInstallCert -- --name=local.your-site.com.pfx')
  }

  if (!certName.endsWith('.pfx')) {
    certName += '.pfx'
  }

  const certPath = path.join(__dirname, `cert/${certName}`)

  if (!fse.pathExistsSync(certPath)) {
    throw Error(`File ${certPath} does not exist. Generate this first if you want to install it.`)
  }

  const psCommand = `$env:PSModulePath = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine'); Import-PfxCertificate -FilePath '${certPath}' -CertStoreLocation Cert:\\LocalMachine\\Root`

  await waitForProcess(spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand]))
}

async function winUninstallCert() {
  console.log('******************************\n* Requires admin permissions *\n******************************')

  let certSubject = argv['subject']
  if (!certSubject) {
    throw Error('Param cert \'subject\' is required. Example: npm run winUninstallCert -- --subject=local.your-site.com')
  }

  const psCommand = `$env:PSModulePath = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine'); Get-ChildItem Cert:\\LocalMachine\\Root | Where-Object { $_.Subject -match '${certSubject}' } | Remove-Item`;

  await waitForProcess(spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand]))
}

async function linuxInstallCert() {
  const instructions = `
Automated linux cert install not supported (chrome does not use system certs without significant extra configuration).

Manual Instructions:
- In Chrome, go to chrome://settings/certificates
- Select Authorities -> import
- Select your generated .crt file from ./cert/ (if you haven't generated it, see the opensslGenCert command)
- Check box for "Trust certificate for identifying websites"
- Click OK
- Reload site`
  console.log(instructions)
}

async function writeServerTestEnv() {
  const envPath = '.env'
  const testEnvPath = 'src/WebServer.Test/.env'
  const originalEnvString = fs.readFileSync(envPath, 'utf-8')
  
  let keepKeys = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
  
  let newTestEnvString = ''
  
  for (let line of originalEnvString.split('\n')) {
    if (!line || line.indexOf('=') === -1) {
      continue
    }

    const key = line.substring(0, line.indexOf('='))
    
    if (!keepKeys.includes(key)) {
      continue
    }
    
    if (key === 'DB_NAME') {
      const modifiedLine = line.replace('=', '=test_')
      newTestEnvString += `${modifiedLine}\n`
    } else {
      newTestEnvString += `${line}\n`
    }
  }
  
  fs.writeFileSync(testEnvPath, newTestEnvString)
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
exports.opensslGenCert = opensslGenCert
exports.winInstallCert = winInstallCert
exports.winUninstallCert = winUninstallCert
exports.linuxInstallCert = linuxInstallCert
