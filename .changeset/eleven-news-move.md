---
"@open-pioneer/map-navigation": patch
---

Don't attempt to zoom past configured zoom limits (#356).
As a side effect of this change, clicks on the zoom in/out buttons are ignored during the brief animation period (currently 200ms).
