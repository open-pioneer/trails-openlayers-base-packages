# @open-pioneer/result-list

## 1.3.0

### Minor Changes

- 9b5d5f3: Support for new common container props (role, aria-\*, data-\* and css)
- d54ccfd: Update to Chakra UI 3.34.0
- 206b397: Update to trails core packages 4.5.0

### Patch Changes

- 0f1277f: minor changes to support dark color mode

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

### Patch Changes

- fce7fa9: Implement stricter null safety checks.

## 1.0.0

### Minor Changes

- 2732052: Icons have been changed to unify the appearance of the components. Preferably, Lucide react-icons are used.
- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 138d85b: Update core packages to 4.2.0
- da6a410: Update dependencies

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0
- 738390e: Update to Chakra v3

### Patch Changes

- 9376a74: Ensure that icons and other decorative elements are hidden from the screen reader using the `aria-hidden="true"` attribute.

    The easiest way to do that is to wrap icons into chakra's `<Icon />` component, for example:

    ```tsx
    import { Icon } from "@chakra-ui/react";
    import { FiX } from "react-icons/fi";

    <Icon>
        <FiX />
    </Icon>;
    ```

- 5c2cca2: Fix a11y issues:
    - Fix wrong `aria-labelledby` ids
    - Introduce optional property `labelProperty` to result list's `input` option
        - A feature's property value is used to provide context in aria attributes.
          This is currently used for `aria-labels` of checkboxes in each row of the data table.
        - Use feature id as fallback if `labelProperty` is not set or feature does not have the specified property.

    ```tsx
    const input: ResultListInput = {
        columns: columns,
        data: results,
        labelProperty: "name", // uses feature.properties.name as label
        formatOptions: formatOptions
    };
    ```

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

## 0.3.2

### Patch Changes

- b152428: Update trails dependencies

## 0.3.1

### Patch Changes

- 28e092a: Update dependencies

## 0.3.0

### Minor Changes

- fbd12d6: Added the possibility to configure single or multi row selection mode.
- 9a0c1a9: Added a new optional parameter `memoizeRows` to improve render performance.
  When rows are memoized, they are only rerendered under certain conditions (e.g. selection changes, sort order changes), which can
  greatly improve performance in some circumstances.

    Example:

    ```tsx
    <ResultList mapId={mapId} input={input} memoizeRows={true} />
    ```

- 5623b5e: Changed ResultListProps interface to differentiate between highlightOptions and zoomOptions.

### Patch Changes

- 4140646: Fix imports.
- 4140646: Update trails dependencies
- 4140646: Update to react 18.3.1
- 81bc7da: Update trails dependencies
- 2c092dc: Update dependencies

## 0.2.0

### Minor Changes

- 520a97b: Add `ZoomOptions` prop in map package
- 48bdf81: Add highlight functionality
- 8e764ce: Zoom to features loaded into the result-list

## 0.1.0

### Minor Changes

- ca6c2fd: Added formatting support of result list table cells depending on the type of value including support of cell render functions.
- 6f0fc0c: add changeevent for selection
- 13ea342: Initial release
- 9334e81: Update to OpenLayers 9

### Patch Changes

- ca6c2fd: Don't remove uppercase characters in slugs
- 1a8ad89: Update package.json metadata
- 87f6bda: Export selection change event type.
- 6162979: Update versions of core packages
