# @open-pioneer/toc

This package provides a UI component that displays the map content to the user and allows them to control it.

Unavailable operational layers are marked with an icon and will be deactivated for selection. If a layer was configured as initially visible, it remains visible.

## Usage

To integrate the TOC (table of contents) in your app, insert the following snippet and reference a map ID:

```tsx
<Toc mapId="map_id" />
```

### Tools

Additional tools are available for the `operational layers`, e.g. to hide all layers with one click. To show the tool menu, set the `showTools` property to `true`:

```tsx
<Toc mapId="map_id" showTools={true} />
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

### Layer IDs as CSS classes on list items

List items for individual operational layers receive the layer's `id` as an additional CSS class (`layer-${id}`).

For example, given a layer with the ID `test-geojson`, the TOC's list item for that layer is rendered as:

```html
<li class="toc-layer-item layer-test-geojson ...">
    <!-- -->
</li>
```

> NOTE: Non-alphanumeric characters present in the layer's ID are removed from the class name. Whitespace is replaced with a single `-`.

> NOTE: List items are not guaranteed to be rendered as `li`. Only the CSS class name is guaranteed.

## License

Apache-2.0 (see `LICENSE` file)
