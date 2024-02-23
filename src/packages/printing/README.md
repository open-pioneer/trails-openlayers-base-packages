# @open-pioneer/printing

This package provides a UI component to export the current map view as a printable file.

The UI contains an input field that allows the user to enter a title, a dropdown to switch between the printing file formats (`PDF`, `PNG`), and a button to trigger the export.
The map is printed as a DIN A4 size in landscape and the scale of the current map is preserved.

## Usage

To integrate the printing in your app, insert the following snippet and reference a map ID:

```tsx
<Printing mapId="map_id" />
```

## Elements

The printed map contains all map elements, visible layers, scale-bar and a title. If the user doesn't enter a title, the map is printed without title.
To prevent custom elements from showing in the printed map, a classname `printing-hide` can be added to their classnames.

## License

Apache-2.0 (see `LICENSE` file)
