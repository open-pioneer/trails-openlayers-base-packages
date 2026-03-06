---
"@open-pioneer/map": minor
---

Add new `mapModel.overlays` API to render arbitrary React content on the map at certain coordinates.
This can be helpful for feature info, popups and for tooltips during map interactions.

Use `mapModel.overlay.add({ content: <SomeReactContent />, ...})` to create a new overlay.
