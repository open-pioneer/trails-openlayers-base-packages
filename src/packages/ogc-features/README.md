# @open-pioneer/ogc-features

This package provides a function to create an ol-VectorSource to be used with OGC-Feature-Layer.
This VectorSource should be used inside an ol-VectorLayer.

## Usage

Just import the function with:

```js
import { createVectorSource } from "@open-pioneer/ogc-features";
```

and use it inside a VectorLayer:

```ts
layer: new VectorLayer({
    source: createVectorSource({
        baseUrl: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1",
        collectionId: "governmentalservice",
        crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
        /**
         * The maximum number of features to fetch within a single request.
         * Corresponds to the `limit` parameter in the URL.
         *
         * When the `offset` strategy is used for feature fetching, the limit
         * is used for the page size.
         *
         * Default limit is 5000
         */
        limit: 5000,
        attributions:
            "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>", // attributions
        offsetRequestProps: {
            // (Optional)
            /** The maximum number of concurrent requests. Defaults to `6`. */
            maxNumberOfConcurrentReq: number,

            /** The (maximum) number of items to fetch at once. Defaults to `2500`. */
            pageSize: number
        },
        additionalOptions: {} // (Optional)
    })
});
```

The optional `offsetRequestProps` configure the concurrent execution of requests by using the
`offset`-URL-Property for pagination. If the service returns a `numberMatched`-Property, it is used
alongside the configured pageSize to calculate the optimal number of concurrent requests and
tries to use this. But it is never higher then the`maxNumberOfConcurrentReq` here.

Additional options of the `VectorSource` (see ol-documentation) can be given by the property
`additionalOptions`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
