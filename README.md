[![Build and deploy](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/test-and-build.yml)
[![Audit dependencies (daily)](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/audit-dependencies.yml/badge.svg)](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/audit-dependencies.yml)

# OpenLayers Base Packages

This repository is intended to manage various base packages for building applications based on [OpenLayers](https://openlayers.org/).

-   Samples: [latest](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/latest) | [dev](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/dev)
-   API Documentation: [latest](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/latest/docs) | [dev](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/dev/docs)
-   [User manual](https://github.com/open-pioneer/trails-starter/tree/main/docs)

## Getting started

Requirements: Node >= 18, pnpm >= 9.

To start the development server, run:

```bash
$ pnpm install # initially and always after changing package dependencies
$ pnpm dev     # starts dev server
  VITE v4.3.9  ready in 832 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

To run tests:

```bash
# all tests
$ pnpm test
# only run tests for a certain package (or file)
$ pnpm test <PATH_TO_PACKAGE>
```

For more details, consult the starter project's [Repository Guide](https://github.com/open-pioneer/trails-starter/blob/main/docs/RepositoryGuide.md).

## Packages

This repository publishes the following packages:

<!--
  List packages:

  $ pnpm ls -r --depth -1 --json | jq ".[].name"

  NPM badges: See https://shields.io/badges/npm-version
-->

| Name                                                                 | Version                                                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [@open-pioneer/basemap-switcher](./src/packages/basemap-switcher/)   | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fbasemap-switcher)](https://www.npmjs.com/package/@open-pioneer/basemap-switcher)   |
| [@open-pioneer/coordinate-search](./src/packages/coordinate-search/) | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fcoordinate-search)](https://www.npmjs.com/package/@open-pioneer/coordinate-search) |
| [@open-pioneer/coordinate-viewer](./src/packages/coordinate-viewer/) | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fcoordinate-viewer)](https://www.npmjs.com/package/@open-pioneer/coordinate-viewer) |
| [@open-pioneer/editing](./src/packages/editing/)                     | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fediting)](https://www.npmjs.com/package/@open-pioneer/editing)                     |
| [@open-pioneer/geolocation](./src/packages/geolocation/)             | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fgeolocation)](https://www.npmjs.com/package/@open-pioneer/geolocation)             |
| [@open-pioneer/legend](./src/packages/legend/)                       | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Flegend)](https://www.npmjs.com/package/@open-pioneer/legend)                       |
| [@open-pioneer/map](./src/packages/map/)                             | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fmap)](https://www.npmjs.com/package/@open-pioneer/map)                             |
| [@open-pioneer/map-navigation](./src/packages/map-navigation/)       | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fmap-navigation)](https://www.npmjs.com/package/@open-pioneer/map-navigation)       |
| [@open-pioneer/map-test-utils](./src/packages/map-test-utils/)       | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fmap-test-utils)](https://www.npmjs.com/package/@open-pioneer/map-test-utils)       |
| [@open-pioneer/map-ui-components](./src/packages/map-ui-components/) | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fmap-ui-components)](https://www.npmjs.com/package/@open-pioneer/map-ui-components) |
| [@open-pioneer/measurement](./src/packages/measurement/)             | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fmeasurement)](https://www.npmjs.com/package/@open-pioneer/measurement)             |
| [@open-pioneer/ogc-features](./src/packages/ogc-features/)           | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fogc-features)](https://www.npmjs.com/package/@open-pioneer/ogc-features)           |
| [@open-pioneer/overview-map](./src/packages/overview-map/)           | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Foverview-map)](https://www.npmjs.com/package/@open-pioneer/overview-map)           |
| [@open-pioneer/printing](./src/packages/printing/)                   | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fprinting)](https://www.npmjs.com/package/@open-pioneer/printing)                   |
| [@open-pioneer/result-list](./src/packages/result-list/)             | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fresult-list)](https://www.npmjs.com/package/@open-pioneer/result-list)             |
| [@open-pioneer/scale-bar](./src/packages/scale-bar/)                 | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fscale-bar)](https://www.npmjs.com/package/@open-pioneer/scale-bar)                 |
| [@open-pioneer/scale-setter](./src/packages/scale-setter/)           | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fscale-setter)](https://www.npmjs.com/package/@open-pioneer/scale-setter)           |
| [@open-pioneer/scale-viewer](./src/packages/scale-viewer/)           | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fscale-viewer)](https://www.npmjs.com/package/@open-pioneer/scale-viewer)           |
| [@open-pioneer/search](./src/packages/search/)                       | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fsearch)](https://www.npmjs.com/package/@open-pioneer/search)                       |
| [@open-pioneer/selection](./src/packages/selection/)                 | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fselection)](https://www.npmjs.com/package/@open-pioneer/selection)                 |
| [@open-pioneer/spatial-bookmarks](./src/packages/spatial-bookmarks/) | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Fspatial-bookmarks)](https://www.npmjs.com/package/@open-pioneer/spatial-bookmarks) |
| [@open-pioneer/theme](./src/packages/theme/)                         | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Ftheme)](https://www.npmjs.com/package/@open-pioneer/theme)                         |
| [@open-pioneer/toc](./src/packages/toc/)                             | [![NPM Version](https://img.shields.io/npm/v/%40open-pioneer%2Ftoc)](https://www.npmjs.com/package/@open-pioneer/toc)                             |

## License

Apache-2.0 (see `LICENSE` file)
