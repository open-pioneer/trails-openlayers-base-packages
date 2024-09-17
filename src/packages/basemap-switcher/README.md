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

## Alternative Usage as image basemap switcher

```jsx
<BasemapSwitcher mapId={MAP_ID} imageBasemapSwitcher={imageBasemapSwitcher}></BasemapSwitcher>
```

Change to the alternative imageBasemapSwitcher.
This basemap switcher can be used if the basemap configurations are well known and should be represented
with an user-friendly image. Instead of the layer title, an image and tooltip can be used to represent
the available choices. The Available choices have to be managed by yourself with the usage of
`BasemapOnMapSwitcherImageProps`.

```jsx
const [imageLabel, setImageLabel] = useState({
    image: firstImage, // The image that is shown on the front
    label: BASE_MAP_TOOLTIP, // The tooltip that should be shown on hover
    callBack: () => {} // The callback that should be called when the image is clicked. In most cases no needed for the front
} as ImageLabelSwitchObject);

const [currentSelection, setCurrentSelection] = useState<ImageLabelSwitchObject[]>([]);

useEffect(() => {
    switch (imageLabel.label) {
        case BASE_MAP_TOOLTIP: {
            setCurrentSelection([
                {
                    image: firstImage, // The image that should be shown on the front
                    label: BASE_MAP_TOOLTIP, // The tooltip that should be shown on hover
                    callBack: () => {} // The callback that should be executed when the image is clicked
                },
                {
                    image: secondImage,
                    label: EMPTY_MAP_TOOLTIP,
                    callBack: () => {
                        setImageLabel({
                            image: secondImage, // The image that should be shown on the front
                            label: EMPTY_MAP_TOOLTIP, // The tooltip that should be shown on hover
                            callBack: () => {} // The callback that should be executed when the image is clicked
                        });
                    }
                }
            ]);
            break;
        }
        case [...]
    }
},[imageLabel, map]);

const imageBasemapSwitcher = useMemo(() => {
    return {
        selectedImageLabel: imageLabel,
        choosableImageLabel: currentSelection
    };
}, [imageLabel, currentSelection]);

return (
    <BasemapSwitcher
        mapId={MAP_ID}
        imageBasemapSwitcher={imageBasemapSwitcher}
    ></BasemapSwitcher>
);
```

## License

Apache-2.0 (see `LICENSE` file)
