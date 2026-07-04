/** @type {import('pnpm').ProjectConfig} */
module.exports = {
  overrides: {
    hono: "4.12.25",
  },
  onlyBuiltDependencies: ["esbuild", "sharp"],
  config: {
    minimumReleaseAge: "0 seconds",
  },
}
