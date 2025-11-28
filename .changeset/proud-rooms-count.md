---
"@open-pioneer/coordinate-search": patch
"@open-pioneer/coordinate-viewer": patch
"@open-pioneer/spatial-bookmarks": patch
"@open-pioneer/basemap-switcher": patch
"@open-pioneer/map-navigation": patch
"@open-pioneer/map-test-utils": patch
"@open-pioneer/ogc-features": patch
"@open-pioneer/overview-map": patch
"@open-pioneer/scale-setter": patch
"@open-pioneer/scale-viewer": patch
"@open-pioneer/geolocation": patch
"@open-pioneer/measurement": patch
"@open-pioneer/result-list": patch
"@open-pioneer/scale-bar": patch
"@open-pioneer/selection": patch
"@open-pioneer/printing": patch
"@open-pioneer/editing": patch
"@open-pioneer/legend": patch
"@open-pioneer/search": patch
"@open-pioneer/map": patch
"@open-pioneer/toc": patch
---

Use `workspace:*` instead of `workspace:^` for local package references as default. This ensures that trails packages from this repository are always referenced with their exact version to avoid potential issues with version mismatches. If a project specifically wants to use other versions for some trails packages, a pnpm override can be used to force other versions.
