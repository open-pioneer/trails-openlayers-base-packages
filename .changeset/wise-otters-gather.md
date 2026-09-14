---
"@open-pioneer/map": minor
---

Export the scale and resolution algorithms from `@open-pioneer/map`:

- `getPointResolution()` returns the point resolution (_meters per pixel_) at a given point.
- `getScaleForPointResolution()` converts a point resolution into a scale denominator.
- `getResolutionForScale()` computes the view resolution (_projection units per pixel_) for a scale.
- `DEFAULT_DPI` is now part of the public API.

`MapModel` now has two new methods built on top of them: `getCenterPointResolution()` and `getViewResolutionForScale()`.
