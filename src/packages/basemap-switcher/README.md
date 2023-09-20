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

To provide an option to deactivate all basemap layers, add the optional property `allowSelectingEmptyBasemap`.

```jsx
<BasemapSwitcher mapId="map_id" allowSelectingEmptyBasemap />
```

## Accessibility

The package provides only a `HTMLSelectElement`. To be compliant with a11y guidelines (screen reader compatibility), wrap the `BasemapSwitcher` into a Chakra UI `FormControl` and set the `FormLabel` to a custom label.

Example:

```jsx
<FormControl>
    <FormLabel ps={1}>
        <Text as="b">{intl.formatMessage({ id: "basemapLabel" })}</Text>
    </FormLabel>
    <BasemapSwitcher mapId="map_id" allowSelectingEmptyBasemap></BasemapSwitcher>
</FormControl>
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
