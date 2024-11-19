---
"@open-pioneer/map": minor
---

The following hooks are deprecated and will be removed in a future release:

-   `useView`
-   `useProjection`
-   `useResolution`
-   `useCenter`
-   `useScale`

They can all be replaced by using the new reactive properties on the `MapModel`, for example:

```javascript
// old:
const center = useCenter(olMap);

// new:
const center = useReactiveSnapshot(() => mapModel.center, [mapModel]);
```
