# @open-pioneer/measurement

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

## 0.4.4

### Patch Changes

-   b152428: Update trails dependencies
-   23b48ad: Add two new optional properties:

    -   `predefinedMeasurements`: an array of measurements that will be added to the map (without user interaction)
    -   `onMeasurementsChange`: an event listener that will be called when measurements are added or removed

    ```tsx
    const predefinedMeasurements = useMemo(
        () => [
            new LineString([
                [398657.97, 5755696.26],
                [402570.98, 5757547.78]
            ])
        ],
        []
    );

    <Measurement
        mapId={MAP_ID}
        onMeasurementsChange={(e) => console.log(e.kind, e.geometry)}
        predefinedMeasurements={predefinedMeasurements}
    />;
    ```

-   Updated dependencies [b152428]
-   Updated dependencies [291ccb6]
    -   @open-pioneer/map@0.6.1

## 0.4.3

### Patch Changes

-   28e092a: Update dependencies
-   484ad86: Add tooltip role to tooltip divs (See https://github.com/open-pioneer/trails-openlayers-base-packages/issues/309).
-   Updated dependencies [28e092a]
-   Updated dependencies [0d51d2f]
-   Updated dependencies [76f8863]
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
-   a0d8882: hide help texts during map export
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
    -   @open-pioneer/react-utils@0.2.1

## 0.2.0

### Minor Changes

-   70349a8: Update to new core packages major versions

### Patch Changes

-   Updated dependencies [70349a8]
    -   @open-pioneer/map@0.2.0
    -   @open-pioneer/react-utils@0.2.0

## 0.1.1

### Patch Changes

-   a1adcef: Remove specific width
-   Updated dependencies [08bffbc]
-   Updated dependencies [a58546b]
-   Updated dependencies [a58546b]
-   Updated dependencies [0c4ce04]
    -   @open-pioneer/map@0.1.1

## 0.1.0

### Minor Changes

-   cd43c02: Initial release
-   3c0d1b1: Initial release.

### Patch Changes

-   Updated dependencies [bb2f27a]
-   Updated dependencies [182da1c]
    -   @open-pioneer/map@0.1.0
    -   @open-pioneer/react-utils@0.1.0
