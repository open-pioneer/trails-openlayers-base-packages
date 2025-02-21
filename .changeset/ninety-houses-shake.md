---
"@open-pioneer/map": minor
"@open-pioneer/basemap-switcher": minor
"@open-pioneer/coordinate-search": minor
"@open-pioneer/coordinate-viewer": minor
"@open-pioneer/geolocation": minor
"@open-pioneer/legend": minor
"@open-pioneer/map-navigation": minor
"@open-pioneer/measurement": minor
"@open-pioneer/overview-map": minor
"@open-pioneer/printing": minor
"@open-pioneer/result-list": minor
"@open-pioneer/scale-bar": minor
"@open-pioneer/scale-setter": minor
"@open-pioneer/scale-viewer": minor
"@open-pioneer/search": minor
"@open-pioneer/selection": minor
"@open-pioneer/spatial-bookmarks": minor
"@open-pioneer/toc": minor
---

Deprecate the `mapId` property on React components.
Use the `MapModel` directly instead to pass a reference to the map.

Example:

```tsx
// Default map for entire component tree
<DefaultMapProvider map={mapModel}>
    <Toc />
</DefaultMapProvider>

// Map for specific component
<Toc map={mapModel} />
```
