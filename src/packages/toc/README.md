# @open-pioneer/toc

This package provides a UI component that displays the map content to the user and allows them to control it.

Unavailable operational layers are marked with an icon and will be deactivated for selection. If a layer was configured as initially visible, it remains visible.

## Usage

To integrate the TOC (table of contents) in your app, insert the following snippet (and reference a map):

```tsx
<Toc
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

### Tools

Additional tools are available for operational layers.
To show the toolset menu, set the `showTools` property to `true`.

```tsx
<Toc map={map} showTools={true} />
```

The default tools provided by the TOC are:

- A button to hide all layers (sets `visibility` to false, enabled by default)
- A button to collapse all groups (enabled by default if groups are collapsible)

These tools can be configured by using the `toolsConfig` property.

### Basemaps

By default, the TOC shows the basemap switcher as an embedded element.

To hide the basemap switcher, set the `showBasemapSwitcher` property to `false`:

```tsx
<Toc map={map} showBasemapSwitcher={false} />
```

To configure the embedded basemap switcher, use the `basemapSwitcherProps` property:

```tsx
<Toc
    map={map}
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
    map={map}
    collapsibleGroups={true}
    initiallyCollapsed={true} // Whether groups are collapsed by default. Defaults to false.
/>
```

### Hide certain layers in Toc

Layers that are marked as `internal` are not considered by the Toc.

```typescript
//internal layer will not be displayed in the Toc
const internalLayer = new SimpleLayer({
    id: "layer1",
    title: "layer 1",
    olLayer: myOlLayer,
    internal: true
});
```

The layer's `internal` state does also affect other UI widgets (e.g. Legend). If the layer should be hidden specifically in the Toc (but not in other widgets) the `listMode` attribute can be used to hide the layer item.

```typescript
//use listMode to hide the layer specifically in Toc
const hiddenLayer = new SimpleLayer({
    id: "layer1",
    title: "layer 1",
    olLayer: myOlLayer,
    attributes: {
        toc: {
            listMode: "hide"
        }
    }
});
```

Valid values for `listMode` are:

- `"show"` layer item is displayed in Toc
- `"hide"` layer item is not rendered in Toc
- `"hide-children"` layer item for the layer itself is displayed in Toc but no layer items for child layers (e.g. sublayers of a group) are rendered

The `listMode` does always have precedences over the layer's `internal` property. For example, if the `listMode` is `"show"` the layer item is displayed even if `internal` is `true`.

## License

Apache-2.0 (see `LICENSE` file)
