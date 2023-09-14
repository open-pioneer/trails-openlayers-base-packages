# @open-pioneer/basemap-switcher

This package provides a component that can be integrated in an app together with a map to switch between different basemaps.

## Usage

Example: Integration of a basemap switcher with a given map id:

```jsx
<BasemapSwitcher mapId="map_id" />
```

To add a label to the basemap switcher, use the optional property `label`.

```jsx
<BasemapSwitcher mapId="map_id" label="Grundkarte" />
```

To provide an option to deactivate all basemap layers, add the optional property `noneBasemap`.

```jsx
<BasemapSwitcher mapId="map_id" noneBasemap />
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
