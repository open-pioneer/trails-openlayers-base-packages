---
"@open-pioneer/basemap-switcher": minor
"@open-pioneer/map": minor
"@open-pioneer/toc": minor
---

Adds optional properties to all `Layers`s to restrict the visibility of layers to a range of zoom levels or resolutions.
The visibility can be restricted either to a `minResolution` and `maxResolution` or to a `minZoom` and `maxZoom`. Using only a minimum or maximum limit is possible. Missing properties are considered as no limitation.

```js
layerFactory.create({
    type: WMTSLayer,
    isBaseLayer: true,
    title: "Basemap",
    name: "basemap",
    minZoom: 10,
    maxZoom: 16
});
```

The boolean property `visibleInScale` of a layer indicates the visibility of this layer depending on the current resolution of the map.

Restrictions of a `GroupLayer` are inherited to children layer. If no restrictions are configured for a child layer, its visibility limitations are equal to the parent `GroupLayer`. By configuring additional limits for the child layer, its visibility can be further restricted.

Layers that are not visible in the current resolution of the map are indicated with an icon and disabled text in the TOC and basemap switcher, but are still selectable by the user.

The basemap switcher now shows the icon indicator and disabled text of the selected option also in collapsed state, not only in the list of options.
