# @open-pioneer/basemap-switcher

This package provides a basemap switcher component, which can be integrated besides a map to switch between the diffrent basemaps in the map.

## Usage

To integrate the basemap switcher in your app, insert the following snippet reference: a map ID.
You can also add a optional label for the basemap switcher with the following property: 'label'  
Additionally, you can provide configuration if you want to have an option for deactivation from all base layers with the prop 'noneBasemap':

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

It is possible to receive a reference to the underlying DOM node (div) of the BasemapSwitcher component using `useRef`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
