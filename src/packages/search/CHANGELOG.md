# @open-pioneer/search

## 1.3.0

### Minor Changes

- 9b5d5f3: Support for new common container props (role, aria-\*, data-\* and css)
- d05a3b8: Refactor user interface: now based on chakra's combobox instead of react-select.

    NOTE: This causes changes to many internal CSS classes and attributes.
    The UX of the control should be the same.

- d54ccfd: Update to Chakra UI 3.34.0
- 206b397: Update to trails core packages 4.5.0

## 1.2.0

### Minor Changes

- 1b5632a: Provide a search API method to programmatically set the search value input without triggering any search actions.
  See README for details.

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

- 0485014: Introduce search API and `resetInput` method (see [PR](https://github.com/open-pioneer/trails-openlayers-base-packages/pull/493)).

    The search API allows programmatic access to the search component.
    Currently, it provides a method to reset the search input field.

- 2732052: Icons have been changed to unify the appearance of the components. Preferably, Lucide react-icons are used.
- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 138d85b: Update core packages to 4.2.0
- 952edb7: Pass the map in the `SearchOptions` to an `SearchSource` when a search is triggered. This allows to improve the search using information from the map (e.g. only search for results in the current map extent).
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

### Patch Changes

- 4d6dc09: Fix a styling issue where the selected option could be rendered as white text on white background.
- 260b228: Allow user to paste content into search using context menu.

## 0.8.0

### Minor Changes

- 2fa8020: Update trails core package dependencies.
    - Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    - Removes any obsolete references to `@chakra-ui/system`.
      This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

- 49f0207: Update trails core packages to version 2.4.0
- 22a0e34: Add placeholder prop to Search component

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

## 0.4.3

### Patch Changes

- 7f5e58a: add aria role group for sections in search results (fixes issue [#322](https://github.com/open-pioneer/trails-openlayers-base-packages/issues/322))
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

- 1a8ad89: Update package.json metadata
- a0d8882: hide help texts during map export
- 6162979: Update versions of core packages

## 0.3.1

### Patch Changes

- 611ddb9: Export interface `BaseFeature` from Map API and use it correctly in base packages `selection` and `search`.

## 0.3.0

### Minor Changes

- ee7c2d4: Update runtime version.
- 0456500: Add interface `BaseFeature` to Map API.

### Patch Changes

- 0883bbd: Add property `menuPosition` to React Select.

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

## 0.1.0

### Minor Changes

- 6209d6c: Initial release

### Patch Changes

- 565bd8b: Fix usage via touch (NOTE: currently requires a patch to react-select; see repository's `package.json` file).

## 0.2.0

### Minor Changes

- 70349a8: Update to new core packages major versions

## 0.1.0

### Minor Changes

- 6209d6c: Initial release

### Patch Changes

- 565bd8b: Fix usage via touch (NOTE: currently requires a patch to react-select; see repository's `package.json` file).
