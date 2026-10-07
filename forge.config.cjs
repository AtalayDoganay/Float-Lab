'use strict';
// Electron Forge configuration for Roseflow PC Mac Training.
// Windows is the first packaging target. No publisher is configured: nothing is
// uploaded or released automatically. `npm run make` writes local artifacts
// under out/make/.
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Roseflow PC Mac Training',
    executableName: 'RoseflowPCMacTraining',
    appCopyright: 'Independent training app. Not affiliated with Gilderfluke & Co.',
    // Keep development-only folders out of the packaged app.
    ignore: [
      /^\/one-file-promot-float-lab/,
      /^\/tests/,
      /^\/scripts/,
      /^\/docs/,
      /^\/\.github/,
      /^\/out/,
      /^\/\.smoke-userdata/,
      /^\/forge\.config\.cjs$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      // Writes out/make/squirrel.windows/<arch>/RoseflowPCMacTraining-Setup.exe
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'RoseflowPCMacTraining',
        setupExe: 'RoseflowPCMacTraining-Setup.exe',
        authors: 'Atalay Doganay',
        description: 'Independent, offline, simulation-only PC-MACs-style training app.',
        noMsi: true,
      },
    },
    // No zip maker: @electron-forge/maker-zip's cross-zip dependency calls
    // fs.rmdir({ recursive: true }), which Node 25 removed. The portable form
    // is the packaged folder from `npm run package`.
  ],
  plugins: [
    // Electron fuses harden the packaged binary; see docs/SETUP.md "Security model".
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
