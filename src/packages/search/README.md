# @open-pioneer/search

This package provides a UI component to perform a search on given datasources.

## Usage

To use the search component you have to import `Search` from `@open-pioneer/search`.
The mandatory properties of the `Search` component are `mapId` and `sources` (datasources to be searched on).
You have to implement the function `search` for each datasource.

```tsx
import { Search, Datasource, Suggestion } from "@open-pioneer/search";
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
    <Box className="search-top-center-placement">
        <Search mapId={MAP_ID} sources={datasources} />
    </Box>
    //...
);
```

The results/suggestions are presented as a grouped list, one group for each datasource.
This list is sorted by the given order of datasources and the order of the items inside are
defined the implementation of the datasource.

The component is not placed anywhere by default, so you have to take care of this by yourself.
For example, you could wrap the component inside a `Box` element which is placed at a
specific `MapAnchor` or place the component by CSS inside the `MapContainer` using a class like the
following on the `Box` container element (it is predefined inside the package):

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

If you want to change the background color of the datasource headings, add the optional property
`groupHeadingBackgroundColor` as a CSS-background-color string.
The default is pulled from the theme "trails" (trails.100)

```tsx
<Search mapId={MAP_ID} sources={datasources} groupHeadingBackgroundColor="#d5e5ec" />
```

If you want to change the background color of a focussed search suggestion, add the optional property
`focussedItemBackgroundColor` as a CSS-background-color string.
The default is pulled from the theme "trails" (trails.50)

```tsx
<Search mapId={MAP_ID} sources={datasources} focussedItemBackgroundColor="#eaf2f5" />
```

If you want to change the typing delay, add the optional property `searchTypingDelay` (in ms).
The default value is 500ms.

```tsx
<Search mapId={MAP_ID} sources={datasources} searchTypingDelay={1000} />
```

If you want to see the default dropdown indicator of the component (combo box arrow), set the optional property
`showDropdownIndicator` to true. The default is false.

```tsx
<Search mapId={MAP_ID} sources={datasources} showDropdownIndicator={true} />
```

If you want to customize the CSS of the `Option`, `NoOptionsMessage`, or `LoadingMessage`, you can use their
class names: `search-option`, `search-no-match` or `search-loading-text`.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
