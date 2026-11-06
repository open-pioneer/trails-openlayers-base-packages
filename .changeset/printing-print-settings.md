---
"@open-pioneer/printing": minor
---

Extend the `Printing` component and the `PrintingService` with print settings and a preview of the printed area.

The `Printing` component now lets the user choose the page format (DIN A3, A4 or A5), the page orientation, the print resolution in dpi and the scale of the printed map.
While the component is shown, the area of the map that will be printed is highlighted on the map.
The options available to the user can be configured with the new props `pageFormats`, `pageOrientations`, `dpis`, `scales` and `fileFormats`.

`PrintingService.printMap()` supports the new options `scale`, `dpi`, `width` and `height` to print the map at a specific scale and page size.
These options require a `MapModel`.
