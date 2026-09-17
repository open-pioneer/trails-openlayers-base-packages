# @open-pioneer/feature-editing

## 1.5.0

### Minor Changes

- 40748ad: Disable the feature selection button when there are no visible layers for selection. The enabling / disabling behavior can be customized by using the new `resolveSelectionAvailability` prop.
- f790fda: Update to Chakra 3.37.0
- a9c1213: Rework the tooltips rendered on the map: help tooltips now look like chakra's tooltips, and the measurement tooltips (active and finished measurements) are also derived from chakra's tooltip styles.

    The built-in styles of these tooltips are no longer shipped as plain css, chakra style props are used instead.
    The existing css classes (`editing-tooltip`, `measurement-tooltip`, `measurement-active-tooltip`, `measurement-finished-tooltip`, `selection-tooltip`) remain on the overlay's element.

- a186f5d: Update core packages to 4.8.0.
- 1d303e3: When editing an existing feature: do not show the "confirm cancel" dialog when the feature wasn't actually modifified.

### Patch Changes

- 09ec7c7: Updated dependencies

## 1.4.0

### Minor Changes

- c30396d: Update Chakra to 3.36.1
- d862003: Update to trails core-packages 4.7.0

### Patch Changes

- 078bef5: Use private JavaScript properties (#) instead of TypeScript keyword.
- c16a401: Migrated from eslint to oxlint and from prettier to oxfmt.

## 1.3.0

### Minor Changes

- d3e137d: Initial release

### Patch Changes

- 0704cd6: Use `classnames` from `@open-pioneer/react-utils` instead of `classnames` package.
