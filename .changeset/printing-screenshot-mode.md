---
"@open-pioneer/printing": minor
---

Add the `mode` prop to the `Printing` component.

- `mode="page"` is the default: the user can control the output page format, scale, etc., with a preview rendered on the map.
- `mode="screenshot"` keeps the behavior of earlier versions: the entire map is printed as it is currently being displayed, with no additional options and no preview.

```tsx
<Printing map={map} mode="screenshot" />
```
