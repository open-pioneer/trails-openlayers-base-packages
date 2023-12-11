# @open-pioneer/ogc-features

This package provides functions to create an OpenLayers vector source and a search source to be used with OGC API Features service.

## Usage

### Vector source

This vector source should be used inside together with a vector layer.

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
         * Defaults to `5000`.
         */
        limit: 5000,

        /** The maximum number of concurrent requests. Defaults to `6`. */
        maxConcurrentRequests: 6,

        attributions:
            "<a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>",

        additionalOptions: {} // (Optional)
    })
});
```

The optional `limit` configures the concurrent execution of requests by using the `offset` URL property for pagination.
If the service returns a `numberMatched` property together with its results, it is used alongside the configured pageSize to calculate the optimal number of concurrent requests.
The number of concurrent requests is never higher than `maxConcurrentRequests`.

Additional options of the `VectorSource` (see [OpenLayers documentation](https://openlayers.org/en/latest/apidoc/module-ol_source_Vector-VectorSource.html)) can be given by the property
`additionalOptions`.

### Search source

This search source should be used to support a search on OGC API Features.

Just import the function with:

```js
import { OgcFeatureSearchSource } from "@open-pioneer/ogc-features";
```

and create a search instance:

```ts
new OgcFeatureSearchSource({
    label: this.intl.formatMessage({ id: "searchSources.miningPermissions" }),
    baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
    collectionId: "managementrestrictionorregulationzone",
    searchProperty: "thematicId",
    labelProperty: "name"
}),
```

Use the callback function `renderLabel` to create a custom label for the result. To overwrite the service URL, use the callback function `rewriteUrl`.

```ts
new OgcFeatureSearchSource({
    // ...
    renderLabel(feature) {
        const name = feature?.properties?.name;
        const id = feature?.id;
        if (typeof name === "string") {
            return name + " (" + id + ")";
        } else {
            return String(id);
        }
    },
    rewriteUrl(url) {
        url.searchParams.set("properties", "name");
        return url;
    }
    // ...
});
```

## License

Apache-2.0 (see `LICENSE` file)
