---
"@open-pioneer/map": minor
---

Add new `children` property to all layers.
This property makes it possible to handle any layer children in a generic fashion, regardless of the layer's actual type.

`layer.children` is either an alias of `layer.sublayers` (if the layer has sublayers), `layer.layers` (if it's a `GroupLayer`) or undefined, if the layer does not have any children.
