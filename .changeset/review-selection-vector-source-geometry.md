---
"@open-pioneer/selection": patch
---

`VectorLayerSelectionSource` does no longer accidentally include the feature's geometry in the `properties` of a `SelectionResult`.
The geometry is available as `result.geometry`.
