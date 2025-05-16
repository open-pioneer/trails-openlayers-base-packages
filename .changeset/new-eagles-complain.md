---
"@open-pioneer/map": minor
---

**Breaking:** Remove the following hooks, which were deprecated since version 0.8.0:

- useView
- useProjection
- useResolution
- useCenter
- useScale

Use reactive properties on the map model instead, e.g. `mapModel.scale`.
