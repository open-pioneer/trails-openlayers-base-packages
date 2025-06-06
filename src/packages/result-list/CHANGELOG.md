# @open-pioneer/result-list

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

- Updated dependencies [738390e]
- Updated dependencies [66179bc]
- Updated dependencies [0a8ff71]
- Updated dependencies [acd5115]
- Updated dependencies [738390e]
    - @open-pioneer/map@0.11.0

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

- 2fa8020: Update trails core package dependencies.

    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

- 49f0207: Update trails core packages to version 2.4.0
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
    - @open-pioneer/map@0.7.0

## 0.3.2

### Patch Changes

- b152428: Update trails dependencies
- Updated dependencies [b152428]
- Updated dependencies [291ccb6]
    - @open-pioneer/map@0.6.1

## 0.3.1

### Patch Changes

- 28e092a: Update dependencies
- Updated dependencies [28e092a]
- Updated dependencies [0d51d2f]
- Updated dependencies [76f8863]
    - @open-pioneer/map@0.6.0

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
- Updated dependencies [4140646]
- Updated dependencies [4140646]
- Updated dependencies [b5bb7a1]
- Updated dependencies [81bc7da]
- Updated dependencies [2c092dc]
- Updated dependencies [4140646]
    - @open-pioneer/react-utils@0.2.3
    - @open-pioneer/map@0.5.1

## 0.2.0

### Minor Changes

- 520a97b: Add `ZoomOptions` prop in map package
- 48bdf81: Add highlight functionality
- 8e764ce: Zoom to features loaded into the result-list

### Patch Changes

- Updated dependencies [520a97b]
    - @open-pioneer/map@0.5.0

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
