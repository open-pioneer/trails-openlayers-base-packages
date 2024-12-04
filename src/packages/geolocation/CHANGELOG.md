# @open-pioneer/geolocation

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
    -   @open-pioneer/map-ui-components@0.7.0
    -   @open-pioneer/map@0.7.0

## 0.4.4

### Patch Changes

-   3e7d978: Refactor implementation (internal state management now based on the reactivity API)
-   b152428: Update trails dependencies
-   Updated dependencies [b152428]
-   Updated dependencies [291ccb6]
    -   @open-pioneer/map-ui-components@0.1.1
    -   @open-pioneer/map@0.6.1

## 0.4.3

### Patch Changes

-   28e092a: Update dependencies
-   Updated dependencies [28e092a]
-   Updated dependencies [0d51d2f]
-   Updated dependencies [2090e72]
-   Updated dependencies [76f8863]
    -   @open-pioneer/map-ui-components@0.1.0
    -   @open-pioneer/map@0.6.0

## 0.4.2

### Patch Changes

-   4140646: Update trails dependencies
-   4140646: Update to react 18.3.1
-   81bc7da: Update trails dependencies
-   2c092dc: Update dependencies
-   Updated dependencies [4140646]
-   Updated dependencies [4140646]
-   Updated dependencies [b5bb7a1]
-   Updated dependencies [81bc7da]
-   Updated dependencies [2c092dc]
-   Updated dependencies [4140646]
    -   @open-pioneer/react-utils@0.2.3
    -   @open-pioneer/map@0.5.1

## 0.4.1

### Patch Changes

-   Updated dependencies [520a97b]
    -   @open-pioneer/map@0.5.0

## 0.4.0

### Minor Changes

-   9334e81: Update to OpenLayers 9

### Patch Changes

-   1a8ad89: Update package.json metadata
-   6162979: Update versions of core packages
-   Updated dependencies [1a8ad89]
-   Updated dependencies [a11bf72]
-   Updated dependencies [fc6bf82]
-   Updated dependencies [a0d8882]
-   Updated dependencies [6162979]
-   Updated dependencies [9334e81]
-   Updated dependencies [ac7fdd1]
-   Updated dependencies [13ea342]
    -   @open-pioneer/react-utils@0.2.2
    -   @open-pioneer/map@0.4.0

## 0.3.1

### Patch Changes

-   Updated dependencies [611ddb9]
    -   @open-pioneer/map@0.3.1

## 0.3.0

### Minor Changes

-   ee7c2d4: Update runtime version.

### Patch Changes

-   Updated dependencies [ee7c2d4]
-   Updated dependencies [a582e5e]
-   Updated dependencies [0456500]
-   Updated dependencies [762e7b9]
    -   @open-pioneer/map@0.3.0
    -   @open-pioneer/notifier@0.3.0
    -   @open-pioneer/react-utils@0.2.1

## 0.2.0

### Minor Changes

-   70349a8: Update to new core packages major versions

### Patch Changes

-   Updated dependencies [70349a8]
    -   @open-pioneer/map@0.2.0
    -   @open-pioneer/notifier@0.2.0
    -   @open-pioneer/react-utils@0.2.0

## 0.1.1

### Patch Changes

-   0cfbb2f: Add `maxZoom` property to restrict the zoom level after successful geolocation.
-   Updated dependencies [08bffbc]
-   Updated dependencies [a58546b]
-   Updated dependencies [a58546b]
-   Updated dependencies [0c4ce04]
    -   @open-pioneer/map@0.1.1

## 0.1.0

### Minor Changes

-   bc54925: Initial release.

### Patch Changes

-   Updated dependencies [bb2f27a]
-   Updated dependencies [182da1c]
-   Updated dependencies [182da1c]
    -   @open-pioneer/map@0.1.0
    -   @open-pioneer/notifier@0.1.0
    -   @open-pioneer/react-utils@0.1.0
