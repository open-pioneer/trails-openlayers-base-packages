# @open-pioneer/selection

## 0.2.4

### Patch Changes

-   291ccb6: Automatically select initial selection-source.
-   b152428: Update trails dependencies
-   da18bda: The `onSelectionSourceChange` event is no longer thrown if user selects the currently selected source again.
-   Updated dependencies [b152428]
-   Updated dependencies [291ccb6]
    -   @open-pioneer/map@0.6.1

## 0.2.3

### Patch Changes

-   28e092a: Update dependencies
-   28e092a: Adapt to OpenLayers type changes.

    When creating a selection source for a `VectorLayer`, the precise type of that vector layer must now be `VectorLayer<Feature>` (instead of `VectorLayer<VectorSource>`).
    This is a TypeScript-only change that has no effects on the JavaScript code at runtime.

-   65a14f4: Open select-menu on enter (fixes issue [#320](https://github.com/open-pioneer/trails-openlayers-base-packages/issues/320))
-   484ad86: Add tooltip role to tooltip divs (See https://github.com/open-pioneer/trails-openlayers-base-packages/issues/309).
-   Updated dependencies [28e092a]
-   Updated dependencies [0d51d2f]
-   Updated dependencies [76f8863]
    -   @open-pioneer/map@0.6.0

## 0.2.2

### Patch Changes

-   4140646: Fix imports.
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

## 0.2.1

### Patch Changes

-   Updated dependencies [520a97b]
    -   @open-pioneer/map@0.5.0

## 0.2.0

### Minor Changes

-   9334e81: Update to OpenLayers 9

### Patch Changes

-   13ea342: `VectorLayerSelectionSource`: Use a UUID as a fallback if a found feature has no id.
-   1a8ad89: Update package.json metadata
-   13ea342: Fix import of internal module of another package.
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

## 0.1.1

### Patch Changes

-   611ddb9: Export interface `BaseFeature` from Map API and use it correctly in base packages `selection` and `search`.
-   Updated dependencies [611ddb9]
    -   @open-pioneer/map@0.3.1

## 0.1.0

### Minor Changes

-   ee7c2d4: Update runtime version.
-   61d3e0e: Initial release.
-   0456500: Add interface `BaseFeature` to Map API.
-   35be8ef: Introduction of `SelectionSourceFactory` for creating selection sources of an OpenLayers VectorLayer.

### Patch Changes

-   Updated dependencies [ee7c2d4]
-   Updated dependencies [a582e5e]
-   Updated dependencies [0456500]
-   Updated dependencies [762e7b9]
    -   @open-pioneer/map@0.3.0
    -   @open-pioneer/notifier@0.3.0
    -   @open-pioneer/react-utils@0.2.1
