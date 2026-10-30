---
"@open-pioneer/feature-editing": patch
---

Document that the editor resets the geometry of the edited feature when editing ends.
A `FeatureWriter` that keeps features in a vector source should store a copy (`feature.clone()`) and update/reload the source.
