---
"@open-pioneer/map-navigation": patch
---

Fix `HistoryBackward` and `HistoryForward` replacing the map's OpenLayers view when navigating.
The configured view options (extent, zoom limits, resolution constraints, rotation) and any listeners on `map.olView` survive a navigation now.

Fix `ZoomIn` and `ZoomOut` ignoring every click after a click that happened before the map had a zoom level.
