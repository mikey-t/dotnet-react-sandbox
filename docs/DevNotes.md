# Dotnet React Sandbox Dev Notes

## Swig

When working on swigfile changes within the new `swig-cli-modules` project, sometimes `npm link` doesn't work well. Another simple option is to link directly to the directory instead:

- `npm rm swig-cli-modules`
- `npm i -D ../swig-cli-modules`
- In swig-cli-modules: `npm run watchEsm`

And to undo this just remove and re-add the dependency:

- `npm rm swig-cli-modules`
- `npm i -D swig-cli-modules`
