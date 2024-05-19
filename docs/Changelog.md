## Dotnet React Sandbox Changelog

### 2023-05-12

Switched `account.id` from a number to a guid.

### 2023-12-07

Upgrade dependency versions.

- Pinned NodeJS to version 20 for root and client app projects
- Upgraded client app vite version to 5.x
- Upgraded .net from 6 to 8 for the WebServer and WebServer.Test projects
- Upgrade PasswordLogic hashing algorithm. Note that if you move these changes into an existing DRS implementation project with real users, you will need to carefully plan out how to migrate users to the new hash, for examples:
  - Keep the old logic around so you have V1 and V2 versions. On login failure, check with old hash and if it passes, upgrade hash and save to account record. Ensure all users get their hash upgraded (keep track of what user's have had their hash upgraded, for example with a new column like "hash_version").
  - OR force user's to change their passwords and use something similar to the registration logic where they will have to click a link in their email and come though a mandatory password change/set page.
  - OR something else - just don't change the PasswordLogic hashing algorithm without a plan.

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
