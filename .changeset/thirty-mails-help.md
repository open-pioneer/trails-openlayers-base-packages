---
"@open-pioneer/map": patch
---

The new component `DefaultMapProvider` allows you to configure the _default map_ for its children.
If `DefaultMapProvider` is used, you can omit the explicit `mapId` (or `map`) property on the individual UI components.

For many applications, `DefaultMapProvider` can be used to surround all (or most of) the application's UI.

Example:

```tsx
import { DefaultMapProvider } from "@open-pioneer/map";

<DefaultMapProvider mapId={MAP_ID}>
    {/* no need to repeat the map id in this subtree, unless you want to use a different one */}
    <MapContainer />
    <Toc />
    <ComplexChild />
</DefaultMapProvider>;
```
