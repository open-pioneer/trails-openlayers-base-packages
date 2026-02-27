# @open-pioneer/editing

## 1.3.0

### Minor Changes

- d54ccfd: Update to Chakra UI 3.32.0

### Patch Changes

- Updated dependencies [9b5d5f3]
- Updated dependencies [fcbd505]
- Updated dependencies [2ceb1ca]
- Updated dependencies [73453af]
- Updated dependencies [fcbd505]
- Updated dependencies [d54ccfd]
- Updated dependencies [4bcc8ce]
- Updated dependencies [2ceb1ca]
    - @open-pioneer/map@1.3.0

## 1.2.0

### Patch Changes

- 9c29256: Update to core packages 4.4.0
- 279ca67: Use `workspace:*` instead of `workspace:^` for local package references as default. This ensures that trails packages from this repository are always referenced with their exact version to avoid potential issues with version mismatches. If a project specifically wants to use other versions for some trails packages, a pnpm override can be used to force other versions.
- 9580bb4: Update various dependencies.
- 9580bb4: Update to Chakra 3.31.0
- Updated dependencies [597584b]
- Updated dependencies [9c29256]
- Updated dependencies [279ca67]
- Updated dependencies [597584b]
- Updated dependencies [9580bb4]
- Updated dependencies [9580bb4]
    - @open-pioneer/map@1.2.0

## 1.1.0

### Minor Changes

- 10338fa: Update OpenLayers to 10.7.0
- a8b8a36: Update trails core packages to 4.3.0
- 10338fa: Update Chakra to 3.29.0

### Patch Changes

- Updated dependencies [fce7fa9]
- Updated dependencies [10338fa]
- Updated dependencies [a8b8a36]
- Updated dependencies [10338fa]
- Updated dependencies [c38b619]
    - @open-pioneer/map@1.1.0

## 1.0.0

### Minor Changes

- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 4f1e7bd: The highlight layer(s) created by this package now uses the map model's `topmost` option to register an (internal) layer.
  The previous implementation was based on adding a "raw" OpenLayers layer to the `olMap`.
- 138d85b: Update core packages to 4.2.0
- da6a410: Update dependencies
- Updated dependencies [c6180c6]
- Updated dependencies [29a10df]
- Updated dependencies [10d2fe7]
- Updated dependencies [4f1e7bd]
- Updated dependencies [2702df4]
- Updated dependencies [12561fe]
- Updated dependencies [5df900f]
- Updated dependencies [8986b3b]
- Updated dependencies [b3709f1]
- Updated dependencies [14c484e]
- Updated dependencies [138d85b]
- Updated dependencies [4f1e7bd]
- Updated dependencies [aeb9000]
- Updated dependencies [9e9bc6e]
- Updated dependencies [b3709f1]
- Updated dependencies [2c8b617]
- Updated dependencies [b3709f1]
- Updated dependencies [5df900f]
- Updated dependencies [f1f69f2]
- Updated dependencies [a1614de]
- Updated dependencies [773fa2d]
- Updated dependencies [2abcaaf]
- Updated dependencies [da6a410]
    - @open-pioneer/map@1.0.0

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0

### Patch Changes

- Updated dependencies [738390e]
- Updated dependencies [66179bc]
- Updated dependencies [0a8ff71]
- Updated dependencies [acd5115]
- Updated dependencies [738390e]
    - @open-pioneer/map@0.11.0

## 0.10.0

### Minor Changes

- 193068a: Deprecate the method signatures taking `mapId` on the `EditingService`.
  Use an instance of `MapModel` as a parameter instead.

### Patch Changes

- cd1435b: Update ol to 10.5.0
- 032eed7: Bump dependencies.
- cd1435b: Update to react 19.1.0
- Updated dependencies [2bafdad]
- Updated dependencies [cd1435b]
- Updated dependencies [193068a]
- Updated dependencies [032eed7]
- Updated dependencies [cd1435b]
- Updated dependencies [7558df4]
    - @open-pioneer/map@0.10.0

## 0.9.0

### Minor Changes

- cb94c75: update dependencies

### Patch Changes

- Updated dependencies [e7fdc5d]
- Updated dependencies [cb94c75]
- Updated dependencies [37cd707]
- Updated dependencies [32ed2cd]
- Updated dependencies [f327eec]
- Updated dependencies [f327eec]
- Updated dependencies [209eb8e]
- Updated dependencies [d72e42c]
    - @open-pioneer/map@0.9.0

## 0.8.0

### Minor Changes

- b717121: Update from OL 9 to OL 10.
- e7978a8: Removed EditingWorkflowEvent; the state of the EditingWorkflow is now reactive and should be used instead.
- 2fa8020: Update trails core package dependencies.
    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

- e7978a8: Use reactive map model APIs to access the current map container element.
- 49f0207: Update trails core packages to version 2.4.0
- e7978a8: Stop draw interactions and remove tooltips before saving.
- Updated dependencies [b717121]
- Updated dependencies [e7978a8]
- Updated dependencies [7a5f1e1]
- Updated dependencies [7ae9f90]
- Updated dependencies [d8337a6]
- Updated dependencies [49f0207]
- Updated dependencies [b2127df]
- Updated dependencies [2fa8020]
- Updated dependencies [7ae9f90]
- Updated dependencies [d8337a6]
    - @open-pioneer/map@0.8.0

## 0.7.0

### Minor Changes

- 310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

- 310800c: Update core packages version.
- a8b3449: Switch to a new versioning strategy.
  From now on, packages released by this repository share a common version number.
- 900eb11: Update dependencies.
- Updated dependencies [310800c]
- Updated dependencies [2502050]
- Updated dependencies [583f1d6]
- Updated dependencies [583f1d6]
- Updated dependencies [397d617]
- Updated dependencies [a8b3449]
- Updated dependencies [310800c]
- Updated dependencies [900eb11]
- Updated dependencies [583f1d6]
- Updated dependencies [397d617]
    - @open-pioneer/map@0.7.0

## 0.2.3

### Patch Changes

- b152428: Update trails dependencies
- Updated dependencies [b152428]
- Updated dependencies [291ccb6]
    - @open-pioneer/map@0.6.1

## 0.2.2

### Patch Changes

- 28e092a: Update dependencies
- 484ad86: Add tooltip role to tooltip divs (See https://github.com/open-pioneer/trails-openlayers-base-packages/issues/309).
- Updated dependencies [28e092a]
- Updated dependencies [0d51d2f]
- Updated dependencies [76f8863]
    - @open-pioneer/map@0.6.0

## 0.2.1

### Patch Changes

- 4140646: Update trails dependencies
- 4140646: Update to react 18.3.1
- 81bc7da: Update trails dependencies
- 2c092dc: Update dependencies
- Updated dependencies [4140646]
- Updated dependencies [4140646]
- Updated dependencies [b5bb7a1]
- Updated dependencies [81bc7da]
- Updated dependencies [2c092dc]
    - @open-pioneer/map@0.5.1

## 0.2.0

### Minor Changes

- 434fd3e: Implemented update feature workflow in EditingService

### Patch Changes

- Updated dependencies [520a97b]
    - @open-pioneer/map@0.5.0

## 0.1.0

### Minor Changes

- ac7fdd1: Initial release.
- 9334e81: Update to OpenLayers 9

### Patch Changes

- 1a8ad89: Update package.json metadata
- 6162979: Update versions of core packages
- Updated dependencies [1a8ad89]
- Updated dependencies [a11bf72]
- Updated dependencies [fc6bf82]
- Updated dependencies [a0d8882]
- Updated dependencies [6162979]
- Updated dependencies [9334e81]
- Updated dependencies [ac7fdd1]
- Updated dependencies [13ea342]
    - @open-pioneer/map@0.4.0
