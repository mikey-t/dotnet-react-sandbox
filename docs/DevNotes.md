# Dotnet React Sandbox Dev Notes

## Swig

When working on swigfile changes within the new `swig-cli-modules` project, sometimes `npm link` doesn't work well. Another simple option is to link directly to the directory instead:

- `npm rm swig-cli-modules`
- `npm i -D ../swig-cli-modules`
- In swig-cli-modules: `npm run watchEsm`

And to undo this just remove and re-add the dependency:

- `npm rm swig-cli-modules`
- `npm i -D swig-cli-modules`

Also make sure that the version number matches exactly before running `npm link swg-cli-modules`.

## Vite, WSL and ESBuild

If switching between Ubuntu/WSL and Powershell, keep in mind that the client app's use of Vite and it's underlying ESBuild tooling will cause issues unless you re-run `npm install` each time you switch.
