# @open-pioneer/toc

## 1.2.0

### Patch Changes

- 9c29256: Update to core packages 4.4.0
- 279ca67: Use `workspace:*` instead of `workspace:^` for local package references as default. This ensures that trails packages from this repository are always referenced with their exact version to avoid potential issues with version mismatches. If a project specifically wants to use other versions for some trails packages, a pnpm override can be used to force other versions.
- 9580bb4: Update various dependencies.
- 9580bb4: Update to Chakra 3.31.0

## 1.1.0

### Minor Changes

- 10338fa: Update OpenLayers to 10.7.0
- c38b619: Layers that are not visible in the current resolution of the map are indicated with an icon and disabled text (but are still selectable by the user).
- a8b8a36: Update trails core packages to 4.3.0
- 10338fa: Update Chakra to 3.29.0

### Patch Changes

- fce7fa9: Implement stricter null safety checks.

## 1.0.0

### Minor Changes

- 2702df4: Layers that are marked as `internal` are not considered by the Toc.

    ```typescript
    //internal layer will not be displayed in the Toc
    const internalLayer = new SimpleLayer({
        id: "layer1",
        title: "layer 1",
        olLayer: myOlLayer,
        internal: true
    });
    ```

    The layer's `internal` state also affects other UI widgets (e.g. Legend). If the layer should be hidden specifically in the toc (but not in other widgets) the `listMode` attribute can be used to hide the layer item.

    ```typescript
    //use listMode to hide the layer specifically in Toc
    const hiddenLayer = new SimpleLayer({
        id: "layer1",
        title: "layer 1",
        olLayer: myOlLayer,
        attributes: {
            toc: {
                listMode: "hide"
            }
        }
    });
    ```

    Valid values for `listMode` are:
    - `"show"` layer item is displayed in Toc
    - `"hide"` layer item is not rendered in Toc
    - `"hide-children"` layer item for the layer itself is displayed in Toc but no layer items for child layers (e.g. sublayers of a group) are rendered

    The `listMode` does always have precedence over the layer's `internal` property. For example, if the `listMode` is `"show"` the layer item is displayed even if `internal` is `true`.

- cb5368f: Introduce Toc API for programmatic control of toc items, see [PR](https://github.com/open-pioneer/trails-openlayers-base-packages/pull/420).
- 2732052: Icons have been changed to unify the appearance of the components. Preferably, Lucide react-icons are used.
- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 9e9bc6e: The implementation now uses the map model's `includeInternalLayers === true` option to retrieve layers.
  Internal layers are not shown by default, unless their `listMode` is configured.
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

- e00186b: Add a tooltip around the menu trigger buttons (map tools and layer tools).

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

## 0.4.4

### Patch Changes

- b152428: Update trails dependencies

## 0.4.3

### Patch Changes

- 0b48e97: improve aria labels and roles for hierachical layer groups in toc (fixes issue [#321](https://github.com/open-pioneer/trails-openlayers-base-packages/issues/321))
- 28e092a: Update dependencies

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

- ca6c2fd: Don't remove uppercase characters in slugs
- 1a8ad89: Update package.json metadata
- 6162979: Update versions of core packages

## 0.3.1

## 0.3.0

### Minor Changes

- ee7c2d4: Update runtime version.

### Patch Changes

- 0883bbd: Add property `menuPosition` to React Select.

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

## 0.1.1

## 0.1.0

### Minor Changes

- cafb66b: Initial release.
