---
"@open-pioneer/coordinate-viewer": minor
---

add optional property for display coordinate projection

example (show WGS84 coordinates on display):

```jsx
<CoordinateViewer mapId={MAP_ID} precision={2} displayProjectionCode="EPSG:4326" />
```
