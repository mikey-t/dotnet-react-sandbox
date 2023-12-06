## Dotnet React Sandbox Changelog

### 2023-12-16

Upgrade dependency versions.

- Pinned NodeJS to 20 for root and client project
- Upgraded vite to 5.x

### 2023-12-05

Updated project to work with new db-migrations-dotnet project and associated changes in swig-cli module DotnetReactSandbox.

- Replaced `DbMigrator` project with `DbMigrations` that was generated from the `swig swig dbBootstrapMigrationsProject` command
- Updated node-cli-utils and swig-cli-modules versions to get new functionality
- Removed a large chunk of swig commands that aren't needed anymore
- Added the ability to specify hooks to docker and ef commands so that swig tasks are simpler (no need to chain every single command with `syncEnvFiles`)

### 2023-09-18

Merged branch `new-directory-structure`.

- Completely new directory structure to further separate client and server source code and to allow easily creating separate VSCode workspaces for the client and server development
- Ripped out gulp and replaced it with swig
- Using new slightly altered commands for DB related actions using sub-commands to specify which db(s) and to pass migration names (see docs above)
- Referenced a new beta version of NodeCliUtils (utilized in swigfile.ts)
- Changed how docker-compose get's the project name (using env var COMPOSE_PROJECT_NAME instead of passing CLI param every time)
- Removed root project dependencies that are no longer needed
- Added eslint to client project and attempted to fix as many of the warnings as I could
