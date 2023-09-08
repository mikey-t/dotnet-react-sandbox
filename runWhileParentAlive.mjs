import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const LOG_ENABLED = false
const LOG_PATH = path.join(process.cwd(), 'keepalive.log')
const POLL_INTERVAL = 15000

const parentId = process.ppid
if (!parentId) {
  const noParentIdMessage = `Middle process cannot continue - parent process id not found`
  console.error(noParentIdMessage)
  log(noParentIdMessage)
  process.exit(1)
}

function log(message) {
  if (LOG_ENABLED) {
    fs.appendFileSync(LOG_PATH, message + '\n')
  }
}

function isParentAlive() {
  try {
    const tasklistStdout = execSync('tasklist').toString()
    return tasklistStdout.includes(parentId.toString())
  } catch (err) {
    log("Error attempting to fetch task list using 'tasklist' - returning false for isParentAlive()")
    return false
  }
}

function killTree(pid) {
  try {
    execSync(`taskkill /pid ${pid} /T /F`)
    log(`No errors running killTree`)
  } catch (err) {
    log(`Error running taskkill with PID ${pid}: ${err.toString()}`)
  }
}

const [command, ...args] = process.argv.slice(2)

const child = spawn(command, args, { stdio: 'inherit', shell: true })
const childId = child.pid
if (!childId) {
  const noChildIdMessage = 'spawning ChildProcess failed - no pid on returned handle'
  console.error(noChildIdMessage)
  log(noChildIdMessage)
  process.exit(1)
}

const interval = setInterval(() => {
  if (!isParentAlive()) {
    log('Parent process is not alive. Shutting down.')
    killTree(childId)
    clearInterval(interval)
    log('Used taskkill and cleared interval - exiting...')
    process.exit(0)
  } else {
    log('Parent is alive, keep running.')
  }
}, POLL_INTERVAL)

child.on('exit', (code) => {
  log(`ChildProcess exit event emitted with code ${code} - exiting`)
  clearInterval(interval)
  process.exit(code ?? 1)
})

const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT']

signals.forEach((signal) => {
  process.on(signal, () => {
    log(`Middle process received signal ${signal} - will attempt to kill child process tree, clear interval and exit`)
    try {
      // killTree(childId) // Probably no need to do this for these events - Windows is in the process of killing the tree already
      clearInterval(interval)
      // log(`Ran killTree and clearInterval in signal event ${signal} - exiting`)
      log(`Ran clearInterval in signal event ${signal} - exiting`)
      process.exit(0)
    } catch (err) {
      // log(`Error attempting to run killTree and clearInterval during signal event ${signal}: ${err.toString()}`)
      log(`Error attempting to run clearInterval during signal event ${signal}: ${err.toString()}`)
      process.exit(1)
    }
  })
})
