---
"@open-pioneer/coordinate-viewer": patch
---

Fix the `degree` format of `CoordinateViewer` for negative coordinates.
A coordinate such as `-7.5` was shown as `8°30'0.00"(W)` instead of `7°30'0.00"(W)`.
