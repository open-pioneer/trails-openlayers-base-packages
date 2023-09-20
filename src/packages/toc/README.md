# @open-pioneer/toc

This package provides a table of content for an open layers map.

## Usage

To integrate the toc in your app, insert the following snippet and reference a map id:

```tsx
<Toc mapId={MAP_ID} />
```

## Configuration

### Embedded basemap switcher

By default, the TOC shows the basemap switcher as an embedded element.

The basemap switcher can be hidden by setting the `hideBasemapSwitcher` property. Example:

```tsx
<Toc mapId={MAP_ID} hideBasemapSwitcher></Toc>
```

It is also possible to configure the embedded basemap switcher using the `basemapSwitcherProps` property. Example:

```tsx
<Toc
    mapId={MAP_ID}
    basemapSwitcherProps={{
        allowSelectingEmptyBasemap: true
    }}
></Toc>
```

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
