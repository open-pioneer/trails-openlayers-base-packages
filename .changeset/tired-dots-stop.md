---
"@open-pioneer/map": major
---

**Breaking**: Remove support for `mapId` in all React components.

To configure the map for a component (for example: `Legend`), either pass the `map`
as an explicit parameter or use the `DefaultMapProvider`:

```ts
// Explicit API
<Legend map={map} />

// All children of the DefaultMapProvider can use the configured map
<DefaultMapProvider map={map}>
    <MapContainer />
    <Legend />
    <SomeOtherComponent />
</DefaultMapProvider>;
```

Support for `mapId` was removed in [PR #486](https://github.com/open-pioneer/trails-openlayers-base-packages/pull/486).
