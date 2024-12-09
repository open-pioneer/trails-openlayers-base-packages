# @open-pioneer/scale-setter

## 0.8.0

### Minor Changes

-   2fa8020: Update trails core package dependencies.

    -   Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    -   Removes any obsolete references to `@chakra-ui/system`.
        This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

-   49f0207: Update trails core packages to version 2.4.0
-   d8337a6: Refactor implementation to use the new reactive properties of the map model.
-   Updated dependencies [b717121]
-   Updated dependencies [e7978a8]
-   Updated dependencies [7a5f1e1]
-   Updated dependencies [7ae9f90]
-   Updated dependencies [d8337a6]
-   Updated dependencies [49f0207]
-   Updated dependencies [b2127df]
-   Updated dependencies [2fa8020]
-   Updated dependencies [7ae9f90]
-   Updated dependencies [d8337a6]
    -   @open-pioneer/map@0.8.0

## 0.7.0

### Minor Changes

-   310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

-   310800c: Update core packages version.
-   583f1d6: The `mapId` or `map` properties are now optional on individual components.
    You can use the `DefaultMapProvider` to configure an implicit default value.

    Note that configuring _neither_ a default _nor_ an explicit `map` or `mapId` will trigger a runtime error.

-   583f1d6: All UI components in this project now accept the `mapId` (a `string`) _or_ the `map` (a `MapModel`) directly.
-   a8b3449: Switch to a new versioning strategy.
    From now on, packages released by this repository share a common version number.
-   900eb11: Update dependencies.
-   Updated dependencies [310800c]
-   Updated dependencies [2502050]
-   Updated dependencies [583f1d6]
-   Updated dependencies [583f1d6]
-   Updated dependencies [397d617]
-   Updated dependencies [a8b3449]
-   Updated dependencies [310800c]
-   Updated dependencies [900eb11]
-   Updated dependencies [583f1d6]
-   Updated dependencies [397d617]
    -   @open-pioneer/map@0.7.0

## 0.1.1

### Patch Changes

-   b152428: Update trails dependencies
-   Updated dependencies [b152428]
-   Updated dependencies [291ccb6]
    -   @open-pioneer/map@0.6.1

## 0.1.0

### Minor Changes

-   b9f5f39: Initial release

### Patch Changes

-   Updated dependencies [28e092a]
-   Updated dependencies [0d51d2f]
-   Updated dependencies [76f8863]
    -   @open-pioneer/map@0.6.0
