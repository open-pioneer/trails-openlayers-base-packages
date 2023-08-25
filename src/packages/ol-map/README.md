# @open-pioneer/ol-map

This package provides a map container component to integrate an [OpenLayers](https://openlayers.org/) map into an open pioneer project.

## Usage

### Map container component

### Configuring the map

### Map registry service

### Register additional projections

Simple example to register a additional projection to the global [proj4js](https://github.com/proj4js/proj4js) definition set by there name (e.g. `"EPSG:4326"`) and projection definition (string defining the projection or an existing proj4 definition object).

```ts
import { registerProjections } from "@open-pioneer/ol-map";

registerProjections({
    "EPSG:25832":
        "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
    // ... more projections
});
```

Get the projection definition by access the epsg.io Website or search the global [proj4js](https://github.com/proj4js/proj4js) definition set with a valid name.

```ts
getProjectionDefinition("EPSG:3035");
```

## Notes

-   Always use new API to access the map initially
    -   Use `.olMap` (or `.olLayer`) when the raw instance is required
-   Use the model classes to manage:
    -   Map composition (access and configuration of layers, base layers)
    -   Layer visibility
    -   Custom layer metadata (`attributes`)
-   Use the raw ol instances for other features (e.g. opacity)

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
