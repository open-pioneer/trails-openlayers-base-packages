---
"@open-pioneer/map": minor
---

Add the properties `visibleInHierarchy` and `effectivelyVisible` to all layers.

- A layer is `visibleInHierarchy` if it is `visible` and all its parents are visible as well.
  Use this property to test whether a layer is hidden by one of its parents (e.g. an invisible group layer).
- A layer is `effectivelyVisible` if nothing prevents it from being rendered on the map:
  it must be visible in its hierarchy and no other condition of the layer type may block it.
  For example, operational layers are only effectively visible if they are also `visibleInScale`.
