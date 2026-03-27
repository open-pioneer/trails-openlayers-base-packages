# @open-pioneer/measurement

## 1.3.0

### Minor Changes

- 9b5d5f3: Support for new common container props (role, aria-\*, data-\* and css)
- d54ccfd: Update to Chakra UI 3.34.0
- 206b397: Update to trails core packages 4.5.0

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

### Minor Changes

- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 4f1e7bd: The highlight layer(s) created by this package now uses the map model's `topmost` option to register an (internal) layer.
  The previous implementation was based on adding a "raw" OpenLayers layer to the `olMap`.
- 138d85b: Update core packages to 4.2.0
- 030e657: The measurement tooltip was fixed to update its text even if the mouse is not moved.
- da6a410: Update dependencies

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0
- 738390e: Update to Chakra v3

## 0.10.0

### Minor Changes

- 193068a: Deprecate the `mapId` property on React components.
  Use the `MapModel` directly instead to pass a reference to the map.

    Example:

    ```tsx
    // Default map for entire component tree
    <DefaultMapProvider map={mapModel}>
        <Toc />
    </DefaultMapProvider>

    // Map for specific component
    <Toc map={mapModel} />
    ```

### Patch Changes

- cd1435b: Update ol to 10.5.0
- 032eed7: Bump dependencies.
- cd1435b: Update to react 19.1.0

## 0.9.0

### Minor Changes

- cb94c75: update dependencies

## 0.8.0

### Minor Changes

- b717121: Update from OL 9 to OL 10.
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
- 583f1d6: The `mapId` or `map` properties are now optional on individual components.
  You can use the `DefaultMapProvider` to configure an implicit default value.

    Note that configuring _neither_ a default _nor_ an explicit `map` or `mapId` will trigger a runtime error.

- 583f1d6: All UI components in this project now accept the `mapId` (a `string`) _or_ the `map` (a `MapModel`) directly.
- a8b3449: Switch to a new versioning strategy.
  From now on, packages released by this repository share a common version number.
- 900eb11: Update dependencies.

## 0.4.4

### Patch Changes

- b152428: Update trails dependencies
- 23b48ad: Add two new optional properties:
    - `predefinedMeasurements`: an array of measurements that will be added to the map (without user interaction)
    - `onMeasurementsChange`: an event listener that will be called when measurements are added or removed

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

## 0.4.3

### Patch Changes

- 28e092a: Update dependencies
- 484ad86: Add tooltip role to tooltip divs (See https://github.com/open-pioneer/trails-openlayers-base-packages/issues/309).

## 0.4.2

### Patch Changes

- 4140646: Update trails dependencies
- 4140646: Update to react 18.3.1
- 81bc7da: Update trails dependencies
- 2c092dc: Update dependencies

## 0.4.1

## 0.4.0

### Minor Changes

- 9334e81: Update to OpenLayers 9

### Patch Changes

- 1a8ad89: Update package.json metadata
- a0d8882: hide help texts during map export
- 6162979: Update versions of core packages

## 0.3.1

## 0.3.0

### Minor Changes

- ee7c2d4: Update runtime version.

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

## 0.1.1

### Patch Changes

- a1adcef: Remove specific width

## 0.1.0

### Minor Changes

- cd43c02: Initial release
- 3c0d1b1: Initial release.
