# @open-pioneer/basemap-switcher

This package provides a component that can be integrated in an app together with a map to switch between different basemaps.

## Usage

Example: Integration of a basemap switcher with a given map id:

```jsx
<BasemapSwitcher mapId="map_id" />
```

To provide an option to deactivate all basemap layers, add the optional property `allowSelectingEmptyBasemap`.

```jsx
<BasemapSwitcher mapId="map_id" allowSelectingEmptyBasemap />
```

## Accessibility

The package provides only a `HTMLSelectElement`. To be compliant with a11y guidelines (screen reader compatibility), a label must be added to the basemap switcher. Therefore, use one of the following attempts:

-   Wrap the `BasemapSwitcher` into a Chakra UI `FormControl` and set the `FormLabel` to a custom label.
-   Use the `aria-labelledby` property of the `BasemapSwitcher` to specify that an anywhere defined label is used as the basemap switcher's label.
-   Use the `aria-label` property of the `BasemapSwitcher` to set an label for the screen reader that is not shown in the UI.

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
