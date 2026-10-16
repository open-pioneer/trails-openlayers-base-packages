---
"@open-pioneer/feature-editing": patch
---

Make the select button available by default once a single editable layer is _effectively_ visible.
The availability was previously derived from the layer's individual visibility, which mishandled layers in invisible groups (see https://github.com/open-pioneer/trails-openlayers-base-packages/issues/708).
