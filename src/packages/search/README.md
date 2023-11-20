# @open-pioneer/search

This package provides a UI component to perform a search on given datasources.

## Usage

To use the search component you have to import `Search` from `@open-pioneer/search`. The component is not
placed anywhere by default, so you have to take care of this by yourself.
For example, you could wrap the component inside a `Box` element which is placed at a
specific `MapAnchor` or placing the component by CSS inside the `MapContainer` using a class like the
following on the `Box` container element:

```css
.search-placement {
    position: absolute;
    left: 50%;
    top: 0px;
    transform: translate(-50%, 0px);
    width: 500px;
    z-index: 1;
}
```

The mandatory properties of the `Search` component are `mapId` and `sources` (datasources to be searched on).

```tsx
import { Search, Datasource, Suggestion } from "@open-pioneer/search-ui";
import { MAP_ID } from "./MapConfigProviderImpl";

const datasources: DataSource[] = [
    {
        /**
         * The label of the data source.
         *
         * This will be displayed by the user interface when results from this data source are shown.
         */
        label: "My example REST-Service",
        /**
         * Performs a search and returns a list of suggestions.
         *
         * Implementations should return the suggestions ordered by priority (best match first), if possible.
         *
         * The provided `AbortSignal` in `options.signal` is used to cancel outdated requests.
         */
        search: (inputValue: string, options: { signal: AbortSignal }): Promise<Suggestion[]> => {
            // to be implemented!
        }
    }
];

return (
    //...
    <Box className="search-placement">
        <Search mapId={MAP_ID} sources={datasources} />
    </Box>
    //...
);
```

If you want to listen to the events `onSelect` and `onClear`, you can provide optional callback functions to the component.
In case of the `onSelect` event, you can access the selected suggestion by the `SelectSearchEvent` event given as parameter.

```tsx
<Search
    mapId={MAP_ID}
    sources={datasources}
    onSelect={function (event: SelectSearchEvent): void {
        // do something
    }}
    onClear={function (): void {
        // do something
    }}
/>
```

If you want to change the background color of the datasource headings, add the optional property `groupHeadingBackgroundColor`
as a CSS-background-color string:

```tsx
<Search mapId={MAP_ID} sources={datasources} groupHeadingBackgroundColor="rgba(211,211,211,0.20)" />
```

If you want to change the typing delay, add the optional property `searchTypingDelay` (in ms)

```tsx
<Search mapId={MAP_ID} sources={datasources} searchTypingDelay={5000} />
```

If you want to see the default dropdown indicator of the component (combo box arrow), set the optional property

```tsx
<Search mapId={MAP_ID} sources={datasources} showDropdownIndicator={true} />
```

#### Implementation notes

The results/suggestions are presented as a grouped list, one group for each datasource. This list is sorted by the given
order of datasources and the order of the items inside are defined the implementation of the datasource.

Features are:

-   Substring matches of the search term are shown bold in the suggestion list.
-   Provides callback functions to handle events for selecting a suggestion or clearing the suggestion list (can be used
    for highlighting/zoom to results for example)
-   Supports a configurable typing delay before actually executing the search

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
