# @open-pioneer/ogc-feature-api-layer

This package provides a function to create an ol-VectorSource to be used with OGC-Feature-Layer.
This VectorSource should be used inside an ol-VectorLayer.

## Usage

Just import the function with:

```js
import { createVectorSource } from "@open-pioneer/ogc-feature-api-layer";
```

and use it inside a VectorLayer:

```js
layer: new VectorLayer({
    source: createVectorSource(
        "https://ogc-api.nrw.de/lika/v1", // ogcFeatureApiBaseUrl
        "katasterbezirk", // collectionId
        "http://www.opengis.net/def/crs/EPSG/0/25832", // crs
        "Katasterbezirk" // attributions
    )
});
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
