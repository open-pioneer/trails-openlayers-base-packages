# @open-pioneer/map-ui-components

## 0.9.0

### Minor Changes

- cb94c75: update dependencies

## 0.8.0

### Minor Changes

- 2fa8020: Update trails core package dependencies.

    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

- 49f0207: Update trails core packages to version 2.4.0

## 0.7.0

### Minor Changes

- 310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

- 310800c: Update core packages version.
- a8b3449: Switch to a new versioning strategy.
  From now on, packages released by this repository share a common version number.
- 900eb11: Update dependencies.

## 0.1.1

### Patch Changes

- b152428: Update trails dependencies

## 0.1.0

### Minor Changes

- 2090e72: Initial release.
  The purpose of this package is to develop UI components that are closely related to the map.

    The package `@open-pioneer/react-utils` has been moved into the [core-packages repository](https://github.com/open-pioneer/trails-core-packages/tree/main/src/packages/react-utils).
    Most contents of the package have been moved as well, if they can be used independently from the map.

    The component `ToolButton` has been moved into _this_ package instead.
    See also the [release notes](https://github.com/open-pioneer/trails-core-packages/releases/tag/%40open-pioneer%2Freact-utils%401.0.0) of `@open-pioneer/react-utils`.

### Patch Changes

- 28e092a: Update dependencies
