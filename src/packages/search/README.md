# @open-pioneer/search

This package provides a UI component to perform a search on given search sources.

The search results are presented as a grouped list, one group for each search source.
This list is sorted by the given order of search sources and the order of the search results inside is
defined by your implementation of the search source.

## Usage

To use the search component you have to import `Search` from `@open-pioneer/search`.
The mandatory properties of the `Search` component are `mapId` and `sources` (search source to be searched on):

```tsx
<Search mapId={MAP_ID} sources={searchsources} />
```

If you want to change the typing delay, add the optional property `searchTypingDelay` (in ms).
The default value is 100ms.

```tsx
<Search mapId={MAP_ID} sources={searchsources} searchTypingDelay={200} />
```

If you want to limit the maximum number of search results that should be displayed per search source (group), you can
configure the optional property `maxResultsPerGroup`.
The default value is 5.

```tsx
<Search mapId={MAP_ID} sources={searchsources} maxResultsPerGroup={10} />
```

### Implementing a search source

You have to provide the search sources that are used by the search component by implementing
the function `search` for each datasource:

````tsx
import { Search, SearchSource, SearchResult } from "@open-pioneer/search";
import { MAP_ID } from "./MapConfigProviderImpl";

const searchsources: SearchSource[] = [
    {
        /**
         * The label of this source.
         *
         * This will be displayed by the user interface when results from this search source are shown.
         */
        label: "My sample REST-Service",
        /**
         * Performs a search and return a list of search results.
         *
         * Implementations should return the results ordered by priority (best match first), if possible.
         *
         * The provided `AbortSignal` in `options.signal` is used to cancel outdated requests.
         *
         * NOTE: If your search source implements custom error handling (i.e. `try`/`catch`), it is good practice to forward
         * abort errors without modification. This will enable the Search widget to hide "errors" due to
         * cancellation.
         *
         * For example:
         *
         * ```js
         * import { isAbortError } from "@open-pioneer/core";
         *
         * class CustomSearchSource {
         *     async search(input, { signal }) {
         *         try {
         *             // If the search is cancelled by the UI, doRequest
         *             // will throw an AbortError. It might throw other errors
         *             // due to application errors, network problems etc.
         *             const result = await doCustomSearch(input, signal);
         *             // ... do something with result
         *         } catch (e) {
         *             if (isAbortError(e)) {
         *                 throw e; // rethrow original error
         *             }
         *             // Possibly use custom error codes or error classes for better error messages
         *             throw new Error("Custom search failed", { cause: e });
         *         }
         *     }
         * }
         * ```
         */
        search: (inputValue: string, options: SearchOptions): Promise<SearchResult[]> => {
            // implement
        }
    }
];

return (
    //...
    <Search mapId={MAP_ID} sources={searchsources} />
    //...
);
````

The configured maximum number of `maxResultsPerGroup` is passed as `maxResults` inside the option parameter
of the search function, so you are able to fetch no more results than necessary.

### Listening to events

If you want to listen to the events `onSelect` and `onClear`, you can provide optional callback functions to the component.
In case of the `onSelect` event, you can access the selected search result (and its search source)
from the parameter `SelectSearchEvent`.

```tsx
import { Search, SearchSelectEvent } from "@open-pioneer/search";
// ...
<Search
    mapId={MAP_ID}
    sources={datasources}
    onSelect={function (event: SearchSelectEvent): void {
        // do something
    }}
    onClear={function (): void {
        // do something
    }}
/>;
```

### Positioning the search bar

The search bar is not placed at a certain location by default; it will simply fill its parent.

To achieve a certain position in a parent node, the following snippet might be helpful:

```css
/* top center placement */
.search-top-center-placement {
    position: absolute;
    left: 50%;
    top: 0px;
    transform: translate(-50%, 0px);
    width: 500px;
    z-index: 1;
}
```

```jsx
<Box
    // ...
    className="search-top-center-placement"
>
    <Search /* ... */ />
</Box>
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
