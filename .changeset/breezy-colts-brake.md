---
"@open-pioneer/map": patch
---

Fix an issue with "raw" map container children that are not wrapped in a map anchor.

Consider, for example, the following snippet:

```tsx
<MapContainer>
    {/* .custom-content does absolute positioning relative to map container */}
    <div className="custom-content">Hi</div>
</MapContainer>
```

Previously, the `div` was rendered relative to the map container div but did _not_ respect the map's view padding.
Now the `div` will move according to the map padding as well.
