[![Build and deploy](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/test-and-build.yml/badge.svg)](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/test-and-build.yml)
[![Audit dependencies (daily)](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/audit-dependencies.yml/badge.svg)](https://github.com/open-pioneer/trails-openlayers-base-packages/actions/workflows/audit-dependencies.yml)

# OpenLayers Base Packages

This repository is intended to manage various base packages for building applications based on [OpenLayers](https://openlayers.org/).

[Samples](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/) | [API Documentation](https://open-pioneer.github.io/trails-demo/openlayers-base-packages/docs/) | [User manual](https://github.com/open-pioneer/trails-starter/tree/main/docs)

## Getting started

Requirements: Node >= 18, pnpm >= 8.

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

## License

Apache-2.0 (see `LICENSE` file)
