# @open-pioneer/editing

## 0.8.0

### Minor Changes

-   b717121: Update from OL 9 to OL 10.
-   e7978a8: Removed EditingWorkflowEvent; the state of the EditingWorkflow is now reactive and should be used instead.
-   2fa8020: Update trails core package dependencies.

    -   Also updates Chakra UI to the latest 2.x version and Chakra React Select to version 5.
    -   Removes any obsolete references to `@chakra-ui/system`.
        This dependency seems to be no longer required and may lead to duplicate packages in your dependency tree.

### Patch Changes

-   e7978a8: Use reactive map model APIs to access the current map container element.
-   49f0207: Update trails core packages to version 2.4.0
-   e7978a8: Stop draw interactions and remove tooltips before saving.
-   Updated dependencies [b717121]
-   Updated dependencies [e7978a8]
-   Updated dependencies [7a5f1e1]
-   Updated dependencies [7ae9f90]
-   Updated dependencies [d8337a6]
-   Updated dependencies [49f0207]
-   Updated dependencies [b2127df]
-   Updated dependencies [2fa8020]
-   Updated dependencies [7ae9f90]
-   Updated dependencies [d8337a6]
    -   @open-pioneer/map@0.8.0

## 0.7.0

### Minor Changes

-   310800c: Switch from `peerDependencies` to normal `dependencies`. Peer dependencies have some usability problems when used at scale.

### Patch Changes

-   310800c: Update core packages version.
-   a8b3449: Switch to a new versioning strategy.
    From now on, packages released by this repository share a common version number.
-   900eb11: Update dependencies.
-   Updated dependencies [310800c]
-   Updated dependencies [2502050]
-   Updated dependencies [583f1d6]
-   Updated dependencies [583f1d6]
-   Updated dependencies [397d617]
-   Updated dependencies [a8b3449]
-   Updated dependencies [310800c]
-   Updated dependencies [900eb11]
-   Updated dependencies [583f1d6]
-   Updated dependencies [397d617]
    -   @open-pioneer/map@0.7.0

## 0.2.3

### Patch Changes

-   b152428: Update trails dependencies
-   Updated dependencies [b152428]
-   Updated dependencies [291ccb6]
    -   @open-pioneer/map@0.6.1

## 0.2.2

### Patch Changes

-   28e092a: Update dependencies
-   484ad86: Add tooltip role to tooltip divs (See https://github.com/open-pioneer/trails-openlayers-base-packages/issues/309).
-   Updated dependencies [28e092a]
-   Updated dependencies [0d51d2f]
-   Updated dependencies [76f8863]
    -   @open-pioneer/map@0.6.0

## 0.2.1

### Patch Changes

-   4140646: Update trails dependencies
-   4140646: Update to react 18.3.1
-   81bc7da: Update trails dependencies
-   2c092dc: Update dependencies
-   Updated dependencies [4140646]
-   Updated dependencies [4140646]
-   Updated dependencies [b5bb7a1]
-   Updated dependencies [81bc7da]
-   Updated dependencies [2c092dc]
    -   @open-pioneer/map@0.5.1

## 0.2.0

### Minor Changes

-   434fd3e: Implemented update feature workflow in EditingService

### Patch Changes

-   Updated dependencies [520a97b]
    -   @open-pioneer/map@0.5.0

## 0.1.0

### Minor Changes

-   ac7fdd1: Initial release.
-   9334e81: Update to OpenLayers 9

### Patch Changes

-   1a8ad89: Update package.json metadata
-   6162979: Update versions of core packages
-   Updated dependencies [1a8ad89]
-   Updated dependencies [a11bf72]
-   Updated dependencies [fc6bf82]
-   Updated dependencies [a0d8882]
-   Updated dependencies [6162979]
-   Updated dependencies [9334e81]
-   Updated dependencies [ac7fdd1]
-   Updated dependencies [13ea342]
    -   @open-pioneer/map@0.4.0
