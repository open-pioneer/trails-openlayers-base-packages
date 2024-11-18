---
"@open-pioneer/ogc-features": minor
"@open-pioneer/geolocation": minor
"@open-pioneer/measurement": minor
"@open-pioneer/selection": minor
"@open-pioneer/editing": minor
"@open-pioneer/map": minor
---

Update from OL 9 to OL 10

Adjusted OL typings:  
type of the property `vectorLayer` of the exported interface `VectorLayerSelectionSourceOptions` in the `@open-pioneer/selection` package is now `VectorLayer<VectorSource, Feature>` (instead of `VectorLayer<Feature`).
