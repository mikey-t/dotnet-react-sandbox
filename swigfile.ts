import dotenv from 'dotenv'
import { dotnetReactSandboxConfig } from 'swig-cli-modules/config'

dotenv.config()

dotnetReactSandboxConfig.projectName = process.env.PROJECT_NAME ?? 'drs'
dotnetReactSandboxConfig.loadEnvFunction = dotenv.config

export * from 'swig-cli-modules/DotnetReactSandbox'
