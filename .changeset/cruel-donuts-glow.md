---
"@open-pioneer/ogc-features": patch
---

VectorSource: trigger change events on error if no features were added. This should resolve an error where the map was permanently loading if the capabilities failed to load.
