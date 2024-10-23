# @open-pioneer/image-basemap-switcher

This package provides a UI component that allows a user to switch between different base maps.

This is an alternative to the default basemap switcher. The default basemap switcher is a dropdown that lists all available basemaps.
The image basemap switcher is a switcher that shows images of the available basemaps. The images are clickable and can be used to switch between the basemaps.
If a basemap was configured as initially selected, it remains selected and there will not be any automatic fallback to another basemap.

## Usage

To add the component to your app, insert the following snippet with a reference to a map ID:

```jsx
<ImageBasemapSwitcher mapId="map_id" />
```

To provide an option to deactivate all basemap layers, add the optional property `allowSelectingEmptyBasemap` (default: `false`).

```jsx
<ImageBasemapSwitcher mapId="map_id" allowSelectingEmptyBasemap />
```

To use the image basemap switcher, you have to provide a mapping of the layer id to the image that should be shown.
This can be down as a map of the layer id to the `BaselayerImageBasemapSwitcherProps` object or directly in the attributes of the layer.
If none of both is provided, the default image and label will be shown.

```jsx
import myImage from "./assets/myImage.png";

layers: [
    new SimpleLayer({
        title: "OSM",
        isBaseLayer: true,
        olLayer: new TileLayer({
            source: new OSM()
        }),
        attributes: {
            imageBasemapSwitcher: {
                image: myImage,
                label: "OSM"
            }
        }
    })
];
```

alternatively you can provide a map of the layer id to the `BaselayerImageBasemapSwitcherProps` object.

```jsx
import myImage from "./assets/myImage.png";
const myMapping : Map<string, BaselayerImageBasemapSwitcherProps>  = new Map ([["myLayerId", {image: myImage, label: "myLabel"}]]);

<ImageBasemapSwitcher mapId="map_id" imageMap={myMapping} />
```

To exclude layers from the image basemap switcher, you can set the `excludeBasemapWithIdFilter` with the layer id of the layers that should be excluded.

```jsx
const myExcludeArray : string[] = ["myLayerIdToExclude"];
<ImageBasemapSwitcher mapId="map_id" excludeBasemapWithIdFilter={myExcludeArray} />
```

## License

Apache-2.0 (see `LICENSE` file)
