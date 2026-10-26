# Three.js, vendored

The guide character (Rosie) is rendered with Three.js. The library is
bundled here as files so the app stays offline and loads it from its own
files under the content security policy (`script-src 'self'`). Nothing is
fetched at run time and `package.json` lists no runtime dependency for it.

| File | Source | SHA-256 |
| --- | --- | --- |
| `three.module.js` | `package/build/three.module.js` from the npm registry tarball `three-0.186.1.tgz` (three@0.186.1) | `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea` |
| `three.core.js` | `package/build/three.core.js` from the same tarball | `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6` |
| `LICENSE` | `package/LICENSE` from the same tarball (MIT, © 2010-2026 three.js authors) | |

The files are the upstream bytes, unmodified and unminified (the package
ships no minified build). `three.module.js` imports `./three.core.js`, so the
two must always be replaced together. `tests/vendor-three.test.mjs` checks
the hashes, the licence, and that neither file contains `eval(` or
`new Function(`.

The renderer uses only the WebGL renderer, geometries, materials, lights,
sprites, textures drawn on canvases, and `PMREMGenerator`. No loader, no
worker, and no network code path is used; the CSP (`connect-src 'none'`)
would block them anyway.

To update: download the new tarball with `npm pack three@<version>`, copy
the two build files and the licence, update the hashes here and in the
test, and run `npm test` and `npm run smoke`.
