# @open-pioneer/map-navigation

## 0.8.0

### Minor Changes

- 2fa8020: Update trails core package dependencies.

    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

- 49f0207: Update trails core packages to version 2.4.0
- d8337a6: Refactor implementation to use the new reactive properties of the map model.
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
    - @open-pioneer/map-ui-components@0.8.0

## 0.7.0

### Minor Changes

- 440b165: Create new tool buttons that allow the user to navigate the history of map views (e.g. jump back to previous map extent):

    ```jsx
    <HistoryBackward /* ... */  />
    <HistoryForward /* ... */ />
    ```

- 310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

- 310800c: Update core packages version.
- 483c416: Don't attempt to zoom past configured zoom limits (#356).
  As a side effect of this change, clicks on the zoom in/out buttons are ignored during the brief animation period (currently 200ms).
- 583f1d6: The `mapId` or `map` properties are now optional on individual components.
  You can use the `DefaultMapProvider` to configure an implicit default value.

    Note that configuring _neither_ a default _nor_ an explicit `map` or `mapId` will trigger a runtime error.

- 583f1d6: All UI components in this project now accept the `mapId` (a `string`) _or_ the `map` (a `MapModel`) directly.
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
    - @open-pioneer/map-ui-components@0.7.0
    - @open-pioneer/map@0.7.0

## 0.4.4

### Patch Changes

- b152428: Update trails dependencies
- Updated dependencies [b152428]
- Updated dependencies [291ccb6]
    - @open-pioneer/map-ui-components@0.1.1
    - @open-pioneer/map@0.6.1

## 0.4.3

### Patch Changes

- 28e092a: Update dependencies
- Updated dependencies [28e092a]
- Updated dependencies [0d51d2f]
- Updated dependencies [2090e72]
- Updated dependencies [76f8863]
    - @open-pioneer/map-ui-components@0.1.0
    - @open-pioneer/map@0.6.0

## 0.4.2

### Patch Changes

- 4140646: Update trails dependencies
- 4140646: Update to react 18.3.1
- f2912be: Added more context to some button labels and tooltips for better usability.
- 81bc7da: Update trails dependencies
- 2c092dc: Update dependencies
- Updated dependencies [4140646]
- Updated dependencies [4140646]
- Updated dependencies [b5bb7a1]
- Updated dependencies [81bc7da]
- Updated dependencies [2c092dc]
- Updated dependencies [4140646]
    - @open-pioneer/react-utils@0.2.3
    - @open-pioneer/map@0.5.1

## 0.4.1

### Patch Changes

- Updated dependencies [520a97b]
    - @open-pioneer/map@0.5.0

## 0.4.0

### Minor Changes

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
    - @open-pioneer/react-utils@0.2.2
    - @open-pioneer/map@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [611ddb9]
    - @open-pioneer/map@0.3.1

## 0.3.0

### Minor Changes

- ee7c2d4: Update runtime version.

### Patch Changes

- Updated dependencies [ee7c2d4]
- Updated dependencies [a582e5e]
- Updated dependencies [0456500]
- Updated dependencies [762e7b9]
    - @open-pioneer/map@0.3.0
    - @open-pioneer/react-utils@0.2.1

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

### Patch Changes

- Updated dependencies [70349a8]
    - @open-pioneer/map@0.2.0
    - @open-pioneer/react-utils@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [08bffbc]
- Updated dependencies [a58546b]
- Updated dependencies [a58546b]
- Updated dependencies [0c4ce04]
    - @open-pioneer/map@0.1.1

## 0.1.0

### Minor Changes

- 70b2381: Initial release

### Patch Changes

- Updated dependencies [bb2f27a]
- Updated dependencies [182da1c]
    - @open-pioneer/map@0.1.0
    - @open-pioneer/react-utils@0.1.0
