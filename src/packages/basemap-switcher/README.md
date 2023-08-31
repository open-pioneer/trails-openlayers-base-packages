# @open-pioneer/basemap-switcher

This package provides a basemap switcher component, which can be integrated besides a map to switch between different basemaps.

## Usage

Example: Simple integration of a basemap switcher with a given map id:

```jsx
<BasemapSwitcher mapId="map_id"></BasemapSwitcher>
```

You can also add a label for the basemap switcher with an optional property `label`.

Add a `noneBasemap` configuration, if you want to provide an option to deactivate all basemap layers at all with the optional property `noneBasemap`.

Example: Integration of a basemap switcher with optional properties:

```js
const noneBasemap = {
    id: "noBasemap",
    label: "kein Hintergrund",
    selected: false
};
```

```jsx
<BasemapSwitcher mapId="map_id" label="Grundkarte" noneBasemap={noneBasemap}></BasemapSwitcher>
```

### Customizing

The basemap switcher component can receive the `className` prop (optional string) that can be used to add additional the css classes of the component.

It is possible to receive a reference to the underlying DOM node (div) of the basemap switcher component using `useRef`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
