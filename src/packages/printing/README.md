# @open-pioneer/printing

This package provides a UI component to export the current map view as a printable file.

The UI allows users to enter a title, switch between the printing file formats, and trigger the export.

The supported file formats are PDF and PNG.
If file format is PNG, the current map canvas is exported as an image.
If file format is PDF, the map is printed as a DIN A4 landscape PDF file, preserving the current map scale and showing the current map center in the middle of the exported map image.

## Usage

To integrate the printing in your app, insert the following snippet and reference a map ID:

```tsx
<Printing mapId="map_id" />
```

## Elements

The printed map contains all map elements, visible layers, scale-bar and a title. If the user does not enter a title, the map is printed without title.
To prevent custom elements from showing in the printed map, add the classname `printing-hide` to the elements.

## License

Apache-2.0 (see `LICENSE` file)
