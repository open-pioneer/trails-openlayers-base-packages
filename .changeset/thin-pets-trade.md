---
"@open-pioneer/map": minor
---

Deprecate the parameter-less signature of `useMapModel()`:

```ts
// Returns the DefaultMapProvider's map, but wrapped in a result value (loading/resolved/rejected)
const result = useMapModel();
```

Use `useMapModelValue()` instead:

```ts
// Returns the map model directly.
const mapModel = useMapModelValue();
```

All other signatures of `useMapModel()` are still fully supported.
