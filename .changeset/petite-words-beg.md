---
"@open-pioneer/spatial-bookmarks": minor
"@open-pioneer/basemap-switcher": minor
"@open-pioneer/map-navigation": minor
"@open-pioneer/map-test-utils": minor
"@open-pioneer/overview-map": minor
"@open-pioneer/scale-setter": minor
"@open-pioneer/scale-viewer": minor
"@open-pioneer/geolocation": minor
"@open-pioneer/map": minor
"@open-pioneer/toc": minor
---

The map initialization has been adjusted to fix the map view initialization if initial view is configured with extent. This change affects the order and timing of the map initialization. This might affect early map interactions or tests. The new test helper function `waitForMapRender` is provided to wait in test for the map view to be completely initialized.
