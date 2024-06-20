# @open-pioneer/result-list

## 0.3.0

### Minor Changes

-   fbd12d6: Added the possibility to configure single or multi row selection mode.
-   9a0c1a9: Added a new optional parameter `memoizeRows` to improve render performance.
    When rows are memoized, they are only rerendered under certain conditions (e.g. selection changes, sort order changes), which can
    greatly improve performance in some circumstances.

    Example:

    ```tsx
    <ResultList mapId={mapId} input={input} memoizeRows={true} />
    ```

-   5623b5e: Changed ResultListProps interface to differentiate between highlightOptions and zoomOptions.

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

## 0.2.0

### Minor Changes

-   520a97b: Add `ZoomOptions` prop in map package
-   48bdf81: Add highlight functionality
-   8e764ce: Zoom to features loaded into the result-list

### Patch Changes

-   Updated dependencies [520a97b]
    -   @open-pioneer/map@0.5.0

## 0.1.0

### Minor Changes

-   ca6c2fd: Added formatting support of result list table cells depending on the type of value including support of cell render functions.
-   6f0fc0c: add changeevent for selection
-   13ea342: Initial release
-   9334e81: Update to OpenLayers 9

### Patch Changes

-   ca6c2fd: Don't remove uppercase characters in slugs
-   1a8ad89: Update package.json metadata
-   87f6bda: Export selection change event type.
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
