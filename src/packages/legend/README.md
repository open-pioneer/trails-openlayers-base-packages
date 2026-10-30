# @open-pioneer/legend

This package provides a legend UI component that allows a user to see legend information for layers in the map.

The legend UI shows entries for layers that are currently visible in the map.

## Usage

To add the component to your app, insert the following snippet (with a reference to a map):

```jsx
<Legend map={map} />
```

### Configuring legend content for layers

For WMS and WMTS layers, the legend images (that are shown in the legend UI for the layer) are automatically
retrieved from the layer or sublayers.

However, for other layer types it is required to configure the legend content on the layer.
There are two options:

1. Configure a `Component` that is rendered as the legend for the layer.
2. Configure a URL to an image (`imageUrl`) that will be shown as a legend for the layer.
   If choosing this option, the layer's title will be shown above the legend image in the legend.

Examples:

```ts
//MapConfigProviderImpl.ts
import { CustomLegend } from "./CustomLegend"; // import react component to show as layer's legend
// ...

async getMapConfig({ layerFactory }): Promise<MapConfig> {
    return {
        // ...
        baseLayers: [
            layerFactory.create({
                type: SimpleLayer,
                id: "topplus_open",
                title: "TopPlus Open",
                visible: true,
                olLayer: createTopPlusOpenLayer("web"),
                attributes: {
                    "legend": {
                        imageUrl:
                            "https://sg.geodatenzentrum.de/wms_topplus_open?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=web"
                    }
                }
            }),
        ]
        layers: [
            layerFactory.create({
                type: SimpleLayer,
                title: "Kindertagesstätten",
                visible: true,
                olLayer: createKitasLayer(),
                attributes: {
                    "legend": {
                        Component: CustomLegend
                    }
                }
            }),
        ]
    }
}
```

It is also possible to configure a legend for WMS and WMTS.
If a configuration is done, it supersedes the automatic legend retrieval.

Showing legend entries is also supported for **sublayers** (configuration and automatic retrieval).
The legend content for sublayers is shown plain and without hierarchical structure in the Legend UI.

#### Internal layers

If a layer is marked as internal (layer's `internal` property is `true`) it will not be considered in the legend component.
Even if a legend is configured it will not be displayed.
The `internal` property also affects other components (e.g. Toc).

#### Controlling the legend entries with `listMode`

The `listMode` of the `legend` attribute controls whether a layer and its children are shown in the legend.
Valid values are:

- `"show"`: the layer's legend entry is displayed, and its child layers are considered as well.
- `"hide"`: neither the layer nor its child layers get a legend entry.
- `"hide-children"`: the layer's legend entry is displayed, but its child layers (e.g. sublayers or the layers of a group) are ignored.

If `listMode` is not set, internal layers are hidden, layers with a legend use `"hide-children"` and all other layers use `"show"`.
An explicit `listMode` has precedence over the layer's `internal` property: a layer with `listMode: "show"` is displayed even if it is internal.

```typescript
layerFactory.create({
    type: GroupLayer,
    title: "Group",
    attributes: {
        "legend": {
            imageUrl: "https://example.com/group-legend.png",
            listMode: "show" // show the group's legend and the legends of its child layers
        } satisfies LegendItemAttributes
    },
    layers: [
        // ...
    ]
});
```

### Showing legend for basemap

By default, the legend for the active basemap is not shown.
To show the legend for the active basemap, set the `showBaseLayers` prop to `true`:

```jsx
<Legend map={map} showBaseLayers={true} />
```

## License

Apache-2.0 (see `LICENSE` file)
