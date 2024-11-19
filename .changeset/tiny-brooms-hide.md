---
"@open-pioneer/map": minor
---

Provide new reactive properties on the `MapModel` type.

-   `olView` (-> `olMap.getView()`)
-   `projection` (-> `olMap.getView().getProjection()`)
-   `resolution` (-> `olMap.getView().getResolution()`)
-   `zoomLevel` (-> `olMap.getView().getZoom()`)
-   `center` (-> `olMap.getView().getCenter()`)
-   `scale` (derived from center and resolution)

Most of the listed properties are already available on raw OpenLayers objects (see code in parentheses above).
However, those OpenLayers properties require manual work for synchronization, whereas the new properties are reactive (and can be watched, for example, using `useReactiveSnapshot()`).

A new method `setScale()` has also been added to the model.
