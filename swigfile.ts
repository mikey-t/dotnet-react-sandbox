import dotenv from 'dotenv'
import config from 'swig-cli-modules/ConfigDotnetReactSandbox'

config.init(dotenv.config)

export * from 'swig-cli-modules/DotnetReactSandbox'
