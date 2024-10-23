# @open-pioneer/basemap-switcher

This package provides a UI component that allows a user to switch between different base maps.

Unavailable basemaps are marked with an icon and will be deactivated for selection. If a basemap was configured as initially selected, it remains selected and there will not be any automatic fallback to another basemap.

## Usage

To add the component to your app, insert the following snippet with a reference to a map ID:

```jsx
<BasemapSwitcher mapId="map_id" />
```

To provide an option to deactivate all basemap layers, add the optional property `allowSelectingEmptyBasemap` (default: `false`).

```jsx
<BasemapSwitcher mapId="map_id" allowSelectingEmptyBasemap />
```

## Accessibility

The package provides only a `HTMLSelectElement`.
To be compliant with a11y guidelines (screen reader compatibility), a label must be added to the basemap switcher.
Therefore, use one of the following attempts:

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

Apache-2.0 (see `LICENSE` file)
