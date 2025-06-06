# @open-pioneer/coordinate-search

## 0.11.0

### Minor Changes

- 66179bc: Update to core-packages v4.0.0
- 888fc2b: improve a11y of coordinate search and coordinate input

    - switch order of projection select and coordinate input (visually and tab order) in order to have the correct focus order
    - add instructions to `aria-label` for coordinate input to improve usability for screenreader users

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

- 1127419: Present error messages to screen readers using a (hidden) `<Field.ErrorMessage />` next to the input field.
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

- c8df895: Added new component CoordinateSearch with functionality to search for coordinates via input. Additionally added component CoordinateInput that allows the user to input coordinates manually and validates the input.

    ```tsx
    <CoordinateSearch mapId="map_id" />
    ```

    ```tsx
    <CoordinateInput mapId="map_id" />
    ```

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
