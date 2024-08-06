---
"@open-pioneer/selection": patch
---

Adapt to OpenLayers type changes.

When creating a selection source for a `VectorLayer`, the precise type of that vector layer must now be `VectorLayer<Feature>` (instead of `VectorLayer<VectorSource>`).
This is a TypeScript-only change that has no effects on the JavaScript code at runtime.
