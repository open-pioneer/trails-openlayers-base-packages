# @open-pioneer/search

This package provides a UI component to perform a search on given search sources.

The search results are presented as a grouped list, one group for each search source.
This list is sorted by the given order of search sources and the order of the search results inside is
defined by the implementation of the search source.

## Usage

To use the search in your app, insert the following snippet (and reference a map) and `sources` (sources to be searched on):

```tsx
<Search
    map={map}
    sources={searchsources}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

To change the typing delay, add the optional property `searchTypingDelay` (in ms).
The default value is 200ms.

```tsx
<Search map={map} sources={searchsources} searchTypingDelay={500} />
```

To limit the maximum number of search results to be displayed per search source (group), configure the optional property `maxResultsPerGroup`.
The default value is 5.

```tsx
<Search map={map} sources={searchsources} maxResultsPerGroup={10} />
```

To change the placeholder text of the search field, use the optional property `placeholder`:

```tsx
<Search sources={searchsources} placeholder="Search for cities" />
```

### Listening to events

To listen to the events `onSelect` and `onClear`, provide optional callback functions to the component.
In case of the `onSelect` event, you can access the selected search result (and its search source)
from the parameter `SelectSearchEvent`.

```tsx
import { Search, SearchSelectEvent } from "@open-pioneer/search";
// ...
<Search
    map={map}
    sources={datasources}
    onSelect={(event: SearchSelectEvent) => {
        // do something
    }}
    onClear={() => {
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

### Implementing a search source

To provide search sources that are used by the search component, implement the function `search` for each datasource:

```tsx
import { Search, SearchSource, SearchResult } from "@open-pioneer/search";
import { MAP_ID } from "./MapConfigProviderImpl";

class MySearchSource implements SearchSource {
    // The label of this source, used as a title for this source's results.
    label = "My sample REST-Service";

    // Attempts to retrieve results for the given input string. For more details,
    // see the API documentation of `SearchSource`.
    async search(inputValue: string, options: SearchOptions): Promise<SearchResult[]> {
        // implement
    }
}

const searchsources: SearchSource[] = [new MySearchSource()];

// In your JSX template:
<Search map={map} sources={searchsources} />;
```

The configured maximum number of `maxResultsPerGroup` is passed as `maxResults` inside the option parameter
of the search function, so you are able to fetch no more results than necessary.

## License

Apache-2.0 (see `LICENSE` file)
