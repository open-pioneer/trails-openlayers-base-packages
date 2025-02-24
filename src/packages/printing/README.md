# @open-pioneer/printing

This package provides a UI component and an API to export the current map view as a printable file.

The UI allows users to enter a title, switch between the printing file formats, and trigger the export.

The supported file formats are PDF and PNG.
If file format is PNG, the current map canvas is exported as an image.
If file format is PDF, the map is printed as a DIN A4 landscape PDF file, preserving the current map scale and showing the current map center in the middle of the exported map image.

The package also provides a printing service that creates an image of the map as a canvas element or a data URL for a PNG image.

## Usage

### UI Component

To integrate the printing in your app, insert the following snippet and reference a map:

```tsx
<Printing
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

### Printing Service

To use the printing service, inject it as following:

```js
// build.config.mjs
import { defineBuildConfig } from "@open-pioneer/build-support";

export default defineBuildConfig({
    ui: {
        references: ["printing.PrintingService"]
    }
});
```

```tsx
const printingService = useService<PrintingService>("printing.PrintingService");

// Triggers printing and waits for the result.
const printResult = await printingService.printMap(map);

// An HTMLCanvasElement containing an image of the map
const canvas = printResult.getCanvas();

// For convenience, an image encoded as PNG (i.e. `data:image/png;base64,...`)
const dataURL = printResult.getPNGDataURL();
```

It is configurable whether to add an overlay element above the map or not.
The default overlay blocks user interactions while the map is printing.
The text content of the overlay can be overwritten by configuring a custom text.

Example:

```tsx
const printResult = await printingService.printMap(map, {
    blockUserInteraction: true,
    overlayText: "custom text"
});
```

### Printed elements

The printed map contains all map elements, visible layers, scale-bar and a title. If the user does not enter a title, the map is printed without title.
To prevent custom elements from showing in the printed map, add the CSS class name `printing-hide` to the elements.

### View padding

The printing widget and the printing service will by default respect the map's current view `padding` (see OpenLayers [View class](https://openlayers.org/en/latest/apidoc/module-ol_View-View.html)).
This means that padded regions (a border on every side) will _not_ be included in the printed result.

To ignore the view padding when printing the map, you can pass `viewPadding: "ignore"` to the printing service or the printing component.

## Known issues

-   Printing to PNG may not work on Safari / Chrome on iOS (see <https://github.com/open-pioneer/trails-openlayers-base-packages/issues/294>)

## License

Apache-2.0 (see `LICENSE` file)
