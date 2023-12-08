# Dotnet React Sandbox Dev Notes

## Swig

When working on swigfile changes within the new `swig-cli-modules` project, sometimes `npm link` doesn't work well. Another simple option is to link directly to the directory instead:

- `npm rm swig-cli-modules`
- `npm i -D ../swig-cli-modules`
- In swig-cli-modules: `npm run watch`

And to undo this just remove and re-add the dependency:

- `npm rm swig-cli-modules`
- `npm i -D swig-cli-modules`

Also make sure that the version number matches exactly before running `npm link swg-cli-modules`.

## Vite, WSL and ESBuild

If switching between Ubuntu/WSL and Powershell, keep in mind that the client app's use of Vite and it's underlying ESBuild tooling will cause issues unless you re-run `npm install` each time you switch.

## Updating JS Dependencies

Check what dependencies have new versions available:

```
npm outdated
```

Update to latest semver:

```
npm update --save
```

Don't forget to update root dependencies in addition to client project dependencies.

Updating past semver should probably be done one at a time to test for breaking changes for each dependency separately.

Note that dependencies with a major version of 0 will never be updated by `npm update --save`, so you'll have to manually run `npm i -D name-of-package@latest` to get the latest version.

## Running and Debugging with VSCode

There is an entry in `./vscode/launch.json` (and in the server workspace at `./server/.vscode/launch.json`) that should start up the API in debug mode - simply hit F5 (or use the command palette). It will first run the `build-solution` task from `tasks.json`. The build task just assumes you have exactly one solution file at `./server/` and that it has the correct project references.

Attaching to an already running instance of the API:

- In VSCode, open command palette and type "attach". The relevant option is probably something like "Debug: Attach to a .NET 5+ or .NET Core process"
- When it prompts you to select a process, find it by the executable name "WebServer.exe"

Debugging the client app:

- Start the API normally in the shell with `swig server`
- Instead of starting the client with `swig client` (or `npm run dev` from client dir), use the launch configuration by hitting F5.
  - If in the root solution, you may have to click into the "Run and Debug" left-pane and select the chrome launch task instead of the API launch task
