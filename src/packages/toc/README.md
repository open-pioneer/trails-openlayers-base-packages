# @open-pioneer/toc

This package provides a UI component that displays the map content to the user and allows them to control it.

## Usage

To integrate the TOC in your app, insert the following snippet and reference a map ID:

```tsx
<Toc mapId="map_id" />
```

### Basemaps

By default, the TOC shows the basemap switcher as an embedded element.

To hide the basemap switcher, set the `showBasemapSwitcher` property to `false`:

```tsx
<Toc mapId="map_id" showBasemapSwitcher={false} />
```

To configure the embedded basemap switcher, use the `basemapSwitcherProps` property:

```tsx
<Toc
    mapId="map_id"
    basemapSwitcherProps={{
        allowSelectingEmptyBasemap: true
    }}
/>
```

### Styling of individual list items

List items for individual operational layers receive the layer's `id` as an additional CSS class (`layer-${id}`).

For example, given a layer with the ID `test-geojson`, the TOC's list item for that layer is rendered as:

```html
<li class="toc-layer-list-entry layer-test-geojson ...">
    <!-- -->
</li>
```

> NOTE: Non-alphanumeric characters present in the layer's ID are removed from the class name. Whitespace is replaced with a single `-`.

> NOTE: List items are not guaranteed to be rendered as `li`. Only the CSS class name is guaranteed.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
