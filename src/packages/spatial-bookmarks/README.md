# @open-pioneer/spatial-bookmarks

This package provides a UI component that allows the user to store, manage, and easily navigate between different map extents by creating bookmarks. The bookmarks are stored locally in the browser's local storage.

The UI presents a list view that displays stored bookmarks and allows the user to easily interact with them. The widget contains an input field that allows the user to create a bookmark with the given name.
Users can also delete individual bookmarks directly from the list.

## Usage

To integrate the spatial bookmarks component in your app, insert the following snippet (and reference a map):

```tsx
<SpatialBookmarks
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

## License

Apache-2.0 (see `LICENSE` file)
