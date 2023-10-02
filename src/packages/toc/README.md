# @open-pioneer/toc

This package provides a table of content for an open layers map.

## Usage

To integrate the toc in your app, insert the following snippet and reference a map id:

```tsx
<Toc mapId="map_id" />
```

## Configuration

### Embedded basemap switcher

By default, the TOC shows the basemap switcher as an embedded element.

The basemap switcher can be hidden by setting the `showBasemapSwitcher` property to `false`. Example:

```tsx
<Toc mapId="map_id" showBasemapSwitcher={false} />
```

It is also possible to configure the embedded basemap switcher using the `basemapSwitcherProps` property. Example:

```tsx
<Toc
    mapId="map_id"
    basemapSwitcherProps={{
        allowSelectingEmptyBasemap: true
    }}
/>
```

## Extensibility

### Layer ids as CSS classes on list items

List items for individual operational layers receive the layer's `id` as an additional CSS class (`layer-${id}`).

For example, given a layer with the id `test-geojson`, the toc's list item for that layer will be rendered as:

```html
<li class="layer-list-entry layer-test-geojson ...">
    <!-- -->
</li>
```

> NOTE: Non-alphanumeric characters present in the layer's id are removed from the class name. Whitespace is replaced with a single `-`.

> NOTE: List items are not guaranteed to be rendered as `li`. Only the CSS class name is guaranteed.

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
