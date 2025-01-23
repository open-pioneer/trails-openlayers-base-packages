# @open-pioneer/toc

This package provides a UI component that displays the map content to the user and allows them to control it.

Unavailable operational layers are marked with an icon and will be deactivated for selection. If a layer was configured as initially visible, it remains visible.

## Usage

To integrate the TOC (table of contents) in your app, insert the following snippet and reference a map ID:

```tsx
<Toc mapId="map_id" />
```

### Tools

Additional tools are available for operational layers.
To show the toolset menu, set the `showTools` property to `true`.

```tsx
<Toc mapId="map_id" showTools={true} />
```

The default tools provided by the TOC are:

-   A button to hide all layers (sets `visibility` to false, enabled by default)
-   A button to collapse all groups (enabled by default if groups are collapsible)

These tools can be configured by using the `toolsConfig` property.

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

### Automatic parent layer visibility

When showing a layer via the TOC component (e.g. by clicking the checkbox next to its name), all parent layers of that layer will also be made visible by default.

This can be disabled by configuring `autoShowParents={false}` on the `TOC` component.

```jsx
// Default: true
<Toc autoShowParents={false} />
```

### Collapsible groups

The TOC renders the hierarchy of layers as a tree structure of nested lists ("groups").
Groups can be made collapsible through user action by setting the `collapsibleGroups` property to `true`.
If enabled, a toggle button appears next to parent nodes by which the user can expand or collapse the group.

```tsx
<Toc
    mapId={MAP_ID}
    collapsibleGroups={true}
    initiallyCollapsed={true} // Whether groups are collapsed by default. Defaults to false.
/>
```

## License

Apache-2.0 (see `LICENSE` file)
