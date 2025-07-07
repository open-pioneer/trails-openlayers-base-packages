# @open-pioneer/toc

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

- e00186b: Add a tooltip around the menu trigger buttons (map tools and layer tools).
- Updated dependencies [738390e]
- Updated dependencies [738390e]
- Updated dependencies [66179bc]
- Updated dependencies [0a8ff71]
- Updated dependencies [acd5115]
- Updated dependencies [738390e]
    - @open-pioneer/map@0.11.0
    - @open-pioneer/basemap-switcher@0.11.0

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
    - @open-pioneer/basemap-switcher@0.10.0

## 0.9.0

### Minor Changes

- cb94c75: update dependencies
- bd82a78: Adds the optional functionality to collapse and expand groups in the TOC.
  This option can be activated with the `collapsibleGroups` property (default is `false`).
  If the property `initiallyCollapsed` is `true` all groups are collapsed by default when the TOC is rendered.
  This is helpful if the app has a large layer tree.

    Additionally, a menu item to collapse all groups can be added to the tools section by setting `toolsConfig.showCollapseAllGroups` to `true` (default is `true`).
    This is only applicable if `collapsibleGroups` and `showTools` are both `true`.

    ```jsx
    import { Toc } from "@open-pioneer/toc";

    <Toc
        mapId={MAP_ID}
        showTools={true}
        collapsibleGroups={true} //groups are collapsible in TOC
        initiallyCollapsed={true} //groups are collapsed initially
        toolsConfig={{ showCollapseAllGroups: true }} //show 'collapse all' menu item in Tools
    />;
    ```

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
    - @open-pioneer/basemap-switcher@0.9.0

## 0.8.0

### Minor Changes

- 2fa8020: Update trails core package dependencies.
    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

- 7ae9f90: When showing a layer via the toc, all parent layers of that layer will also be made visible.

    This can be disabled by configuring `autoShowParents={false}` on the `TOC` component.

    ```jsx
    // Default: true
    <Toc autoShowParents={false} />
    ```

### Patch Changes

- e7978a8: Use reactive map model APIs to access the current set of layers and their attributes.
- 49f0207: Update trails core packages to version 2.4.0
- 7ae9f90: Implement support for `GroupLayer`.
  The hierarchy of (possibly nested) groups is visualized by rendering them as a tree.
- Updated dependencies [b717121]
- Updated dependencies [e7978a8]
- Updated dependencies [7a5f1e1]
- Updated dependencies [7ae9f90]
- Updated dependencies [e7978a8]
- Updated dependencies [d8337a6]
- Updated dependencies [49f0207]
- Updated dependencies [b2127df]
- Updated dependencies [2fa8020]
- Updated dependencies [7ae9f90]
- Updated dependencies [d8337a6]
    - @open-pioneer/map@0.8.0
    - @open-pioneer/basemap-switcher@0.8.0

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
- 2502050: Use new union types for layers.
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
    - @open-pioneer/basemap-switcher@0.7.0
    - @open-pioneer/map@0.7.0

## 0.4.4

### Patch Changes

- b152428: Update trails dependencies
- Updated dependencies [291ccb6]
- Updated dependencies [b152428]
- Updated dependencies [291ccb6]
    - @open-pioneer/basemap-switcher@0.4.4
    - @open-pioneer/map@0.6.1

## 0.4.3

### Patch Changes

- 0b48e97: improve aria labels and roles for hierachical layer groups in toc (fixes issue [#321](https://github.com/open-pioneer/trails-openlayers-base-packages/issues/321))
- 28e092a: Update dependencies
- Updated dependencies [28e092a]
- Updated dependencies [0d51d2f]
- Updated dependencies [65a14f4]
- Updated dependencies [76f8863]
    - @open-pioneer/basemap-switcher@0.4.3
    - @open-pioneer/map@0.6.0

## 0.4.2

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
- Updated dependencies [4140646]
    - @open-pioneer/basemap-switcher@0.4.2
    - @open-pioneer/react-utils@0.2.3
    - @open-pioneer/map@0.5.1

## 0.4.1

### Patch Changes

- Updated dependencies [520a97b]
    - @open-pioneer/map@0.5.0
    - @open-pioneer/basemap-switcher@0.4.1

## 0.4.0

### Minor Changes

- 9334e81: Update to OpenLayers 9

### Patch Changes

- ca6c2fd: Don't remove uppercase characters in slugs
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
    - @open-pioneer/basemap-switcher@0.4.0
    - @open-pioneer/react-utils@0.2.2
    - @open-pioneer/map@0.4.0

## 0.3.1

### Patch Changes

- Updated dependencies [611ddb9]
    - @open-pioneer/map@0.3.1
    - @open-pioneer/basemap-switcher@0.3.1

## 0.3.0

### Minor Changes

- ee7c2d4: Update runtime version.

### Patch Changes

- 0883bbd: Add property `menuPosition` to React Select.
- Updated dependencies [6984d20]
- Updated dependencies [0883bbd]
- Updated dependencies [ee7c2d4]
- Updated dependencies [a582e5e]
- Updated dependencies [0456500]
- Updated dependencies [762e7b9]
    - @open-pioneer/basemap-switcher@0.3.0
    - @open-pioneer/map@0.3.0
    - @open-pioneer/react-utils@0.2.1

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

### Patch Changes

- Updated dependencies [70349a8]
    - @open-pioneer/basemap-switcher@0.2.0
    - @open-pioneer/map@0.2.0
    - @open-pioneer/react-utils@0.2.0

## 0.1.1

### Patch Changes

- Updated dependencies [08bffbc]
- Updated dependencies [a58546b]
- Updated dependencies [a58546b]
- Updated dependencies [0c4ce04]
    - @open-pioneer/map@0.1.1
    - @open-pioneer/basemap-switcher@0.1.1

## 0.1.0

### Minor Changes

- cafb66b: Initial release.

### Patch Changes

- Updated dependencies [bb2f27a]
- Updated dependencies [1e7545c]
- Updated dependencies [182da1c]
    - @open-pioneer/map@0.1.0
    - @open-pioneer/basemap-switcher@0.1.0
    - @open-pioneer/react-utils@0.1.0
