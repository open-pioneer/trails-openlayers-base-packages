# @open-pioneer/map-test-utils

## 1.2.0

### Patch Changes

- 9c29256: Update to core packages 4.4.0
- 279ca67: Use `workspace:*` instead of `workspace:^` for local package references as default. This ensures that trails packages from this repository are always referenced with their exact version to avoid potential issues with version mismatches. If a project specifically wants to use other versions for some trails packages, a pnpm override can be used to force other versions.
- 9580bb4: Update various dependencies.
- 9580bb4: Update to Chakra 3.31.0

## 1.1.0

### Minor Changes

- 10338fa: Update OpenLayers to 10.7.0
- a8b8a36: Update trails core packages to 4.3.0
- 10338fa: Update Chakra to 3.29.0

## 1.0.0

### Major Changes

- 14c484e: Deprecate `createServiceOptions()` function.

    This function was previously used in tests to mock the map registry for a react component under test.
    This is no longer necessary because our react components now receive the map model directly (no lookup is done anymore).

### Minor Changes

- 14c484e: Create a new test helper `createTestOlLayer()` that returns a simple, empty (tile) layer.
- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 138d85b: Update core packages to 4.2.0
- da6a410: Update dependencies

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0

## 0.10.0

### Patch Changes

- cd1435b: Update ol to 10.5.0
- 032eed7: Bump dependencies.
- cd1435b: Update to react 19.1.0

## 0.9.0

### Minor Changes

- cb94c75: update dependencies

### Patch Changes

- d72e42c: Removed BKGTopPlusOpen layer source. The BKGTopPlusOpen was an internal layer source only needed for tests. Please use own test sources instead.

## 0.8.0

### Minor Changes

- 2fa8020: Update trails core package dependencies.
    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

- 49f0207: Update trails core packages to version 2.4.0
- 224102d: Use reactive map model API to watch for changes of initialExtent.

## 0.7.0

### Minor Changes

- 310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

- 310800c: Update core packages version.
- a8b3449: Switch to a new versioning strategy.
  From now on, packages released by this repository share a common version number.
- 900eb11: Update dependencies.

## 0.3.4

### Patch Changes

- b152428: Update trails dependencies

## 0.3.3

### Patch Changes

- 28e092a: Update dependencies
- 76f8863: Don't import map package internals using the services module.

## 0.3.2

### Patch Changes

- 4140646: Update trails dependencies
- 4140646: Update to react 18.3.1
- 81bc7da: Update trails dependencies
- 2c092dc: Update dependencies

## 0.3.1

## 0.3.0

### Minor Changes

- a11bf72: mock vector layer rendering during tests
- 9334e81: Update to OpenLayers 9

### Patch Changes

- 1a8ad89: Update package.json metadata

## 0.2.2

## 0.2.1

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

## 0.1.1

## 0.1.0

### Minor Changes

- 90103b9: Initial release.
