# @open-pioneer/ogc-features

This package provides a function to create an ol-VectorSource to be used with OGC-Feature-Layer.
This VectorSource should be used inside an ol-VectorLayer.

## Usage

Just import the function with:

```js
import { createVectorSource } from "@open-pioneer/ogc-features";
```

and use it inside a VectorLayer:

```js
layer: new VectorLayer({
    source: createVectorSource({
        baseUrl: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1",
        collectionId: "governmentalservice",
        crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions:
            "Datenlizenz Deutschland - Namensnennung - Version 2.0 <a href='https://www.govdata.de/dl-de/by-2-0'>https://www.govdata.de/dl-de/by-2-0</a>", // attributions
        offsetRequestProps: {
            // (Optional)
            maxNumberOfConcurrentReq: 6,
            offsetDelta: 2500,
            startOffset: 0
        },
        additionalOptions: {} // (Optional)
    })
});
```

The optional `OffsetRequestProps` configure the concurrent execution of requests by using the
`offset`-URL-Property. With the default-values 6 concurrent requests are executed to get
features with the `offset`(and `limit`) parameters: 0, 2500, 5000, 7500, 10000, and 12500.

Additional options of the `VectorSource` (see ol-documentation) can be given by the property
`additionalOptions`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
