# @open-pioneer/map-ui-components

## 1.0.0

### Minor Changes

- 2abcaaf: Update to chakra-ui 3.28.0

### Patch Changes

- 10d2fe7: Update dependencies
- 138d85b: Update core packages to 4.2.0
- da6a410: Update dependencies

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0
- 738390e: **Breaking:** Rename `<ToolButton />` props for consistency with Chakra naming conventions:
    - `isLoading` (old) --> `loading` (new)
    - `isActive` (old) --> `active` (new)
    - `isDisabled` (old) --> `disabled` (new)

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
- a8b3449: Switch to a new versioning strategy.
  From now on, packages released by this repository share a common version number.
- 900eb11: Update dependencies.

## 0.1.1

### Patch Changes

- b152428: Update trails dependencies

## 0.1.0

### Minor Changes

- 2090e72: Initial release.
  The purpose of this package is to develop UI components that are closely related to the map.

    The package `@open-pioneer/react-utils` has been moved into the [core-packages repository](https://github.com/open-pioneer/trails-core-packages/tree/main/src/packages/react-utils).
    Most contents of the package have been moved as well, if they can be used independently from the map.

    The component `ToolButton` has been moved into _this_ package instead.
    See also the [release notes](https://github.com/open-pioneer/trails-core-packages/releases/tag/%40open-pioneer%2Freact-utils%401.0.0) of `@open-pioneer/react-utils`.

### Patch Changes

- 28e092a: Update dependencies
