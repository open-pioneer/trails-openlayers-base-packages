# @open-pioneer/basemap-switcher

This package provides a UI component that allows a user to switch between different base maps.

Unavailable basemaps are marked with an icon and will be deactivated for selection. If a basemap was configured as initially selected, it remains selected and there will not be any automatic fallback to another basemap.

## Usage

To add the component to your app, insert the following snippet:

```jsx
<BasemapSwitcher
    map={map}
/> /* instead of passing the map, the `DefaultMapProvider` can alternatively be used */
```

To provide an option to deactivate all basemap layers, add the optional property `allowSelectingEmptyBasemap` (default: `false`).

```jsx
<BasemapSwitcher map={map} allowSelectingEmptyBasemap />
```

## Accessibility

The package provides only a `HTMLSelectElement`.
To be compliant with a11y guidelines (screen reader compatibility), a label must be added to the basemap switcher.
Therefore, use one of the following attempts:

- Use the `aria-labelledby` property of the `BasemapSwitcher` to specify that an anywhere defined label (e.g. a heading shown above the control) is used as the basemap switcher's label.
- Use the `aria-label` property of the `BasemapSwitcher` to set a label for the screen reader that is not shown in the UI.

Example:

```jsx
<TitledSection
    title={
        <SectionHeading id={basemapsHeadingId} mb={2}>
            {intl.formatMessage({ id: "basemapLabel" })}
        </SectionHeading>
    }
>
    <BasemapSwitcher map={map} aria-labelledby={basemapsHeadingId} />
</TitledSection>
```

## License

Apache-2.0 (see `LICENSE` file)
