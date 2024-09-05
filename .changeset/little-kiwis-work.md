---
"@open-pioneer/coordinate-viewer": patch
"@open-pioneer/spatial-bookmarks": patch
"@open-pioneer/basemap-switcher": patch
"@open-pioneer/map-navigation": patch
"@open-pioneer/overview-map": patch
"@open-pioneer/scale-setter": patch
"@open-pioneer/scale-viewer": patch
"@open-pioneer/geolocation": patch
"@open-pioneer/measurement": patch
"@open-pioneer/result-list": patch
"@open-pioneer/scale-bar": patch
"@open-pioneer/selection": patch
"@open-pioneer/printing": patch
"@open-pioneer/legend": patch
"@open-pioneer/search": patch
"@open-pioneer/map": patch
"@open-pioneer/toc": patch
---

The `mapId` or `map` properties are now optional on individual components.
You can use the `DefaultMapProvider` to configure an implicit default value.

Note that configuring _neither_ a default _nor_ an explicit `map` or `mapId` will trigger a runtime error.

```

```
