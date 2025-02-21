# ol-app

This sample application combines multiple components of the OpenLayers Base Packages.
It can be used as a starting point for new applications.

## Organisation

The following diagram shows the most important files (or directories) of this sample and their use.

```
ol-app/
├── i18n/                       # Translation files
├── map/                        # Map related code
│   ├── CustomLegendItem.tsx    # Renders a custom legend item
│   └── MapConfigProvider.tsx   # Configures the map's content
├── sources/                    # Contains search source implementations
├── ui/                         # Contains UI components
├── AppModel.ts                 # Manages application-wide state
└── app.ts                      # Application entry point
```

For more information about the contents of `app.ts` and `i18n`, consult the [official documentation](https://github.com/open-pioneer/trails-starter/tree/main/docs).

## Map Configuration

The class `MapConfigProviderImpl` configures the main map (with id `"main"`) by implementing the `map` package's `MapConfigProvider`-API.

An instance of type `MapConfig` is created by that class to hold the map configuration.
With `MapConfig`, you can provide an initial view, the map's projection, its layers (including base layers) and more:

```ts
// MapConfigProviderImpl.ts
export class MapConfigProviderImpl implements MapConfigProvider {
    // Details omitted
    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 404747, y: 5757920 },
                zoom: 14
            },
            projection: "EPSG:25832",
            layers: [
                // ...
            ]
        };
    }
}
```

The map package supports any kind of OpenLayers layer (called `olLayer` by convention to disambiguate with our own `Layer` types).
All OpenLayers layer instances can be integrated by configuring a `SimpleLayer`:

```ts
new SimpleLayer({
    // Unique id
    id: "ogc_kataster",

    // Display title
    title: "Liegenschaftskatasterbezirke in NRW (viele Daten)",

    // OpenLayers instance
    olLayer: createKatasterLayer(this.vectorSourceFactory)
});
```

For some layer types (currently WMTS and WMS), additional support has been implemented in the map package.
The classes `WMSLayer` and `WMTSLayer` add additional features on top of OpenLayers (such as automatic fetching of service capabilities, automatic legends) that you wouldn't otherwise get when using the `SimpleLayer` class:

```ts
new WMSLayer({
    title: "Linfos",
    visible: true,
    url: "https://www.wms.nrw.de/umwelt/linfos",
    sublayers: [
        {
            name: "SonstigeSchutzgebiete",
            title: "SonstigeSchutzgebiete"
        },
        {
            name: "SCH_GSG",
            title: "SCH_GSG"
        }
    ]
});
```

For more detailed information about map configuration, see the README.md of the `map` package.

The configured map will ultimately be rendered by the UI, which leads over to the next topic:

```tsx
// ui/AppUI.tsx
<MapContainer mapId={MAP_ID} role="main" aria-label={intl.formatMessage({ id: "ariaLabel.map" })}>
    ...
</MapContainer>
```

## UI Components

The application's user interface is split into multiple modules in the `ui` directory.

The topmost React component is the `AppUI`: it defines the application's layout and combines the smaller components into a functional UI.

The `AppUI` implements a very simple layout mechanism.
It retrieves a list of currently opened widgets from the `AppModel` (these are simple string ids) and renders them into a single container (`MainContentComponent`).
The `AppModel` is in charge of managing the list of widgets:

- They can be toggled on or off.
- When an interaction (such as spatial selection) is enabled, all other widgets are hidden.

The logic for this approach is implemented in the `AppModel` (`toggleMainContent` and other related methods).

This example organizes its UI across different files (and React components); there is one file (and one React component) for every Open Pioneer Trails widget (such as `Legend` or `Toc`).
These wrapper components typically configure the underlying widget's properties, set up application-specific event handling or add custom styles and content to integrate the widget into the application's look and feel.

## State management

Some of the React components in this application manage some simple local state (for example, whether the interactions tool menu is currently visible).
Local state (`useState` / `useReducer`) is simple to keep track of and can also easily be forwarded to other components (via `props` or React context).
This is convenient for simple use cases but will quickly stop scaling: passing state / props over multiple layers of the component hierarchy is cumbersome, especially if multiple components in different parts of the application depend on the same data.

The `AppModel` class is used to handle shared data.
It provides access to reactive data structures by using features from the reactivity API ([Docs](https://github.com/conterra/reactivity/blob/main/packages/reactivity-core/README.md), [React bindings for Trails](https://github.com/open-pioneer/trails-core-packages/tree/main/src/packages/reactivity)).
Because the AppModel is registered as a service, all React components in this package can use it to access shared state.

Values that are relevant to the UI are exposed as read-only state which can be subscribed to by React components (see example below).
Note that these values can also be watched for changes from non-React code (e.g. business logic or services), because they are based on the reactivity API.

The `AppModel` also provides methods to modify the state.
These are designed to be called from the UI's event handlers (or any other place, really).
They will apply the requested changes to the reactive data, which in turn will trigger updates to the UI.

Readonly data in combination with methods were chosen because they make it easier to reason about when, and in what way, changes are made the application's state.
As an alternative, you can also make the state writable and modify it directly in your components.

**Example 1:** Subscribing to reactive data

```tsx
// ui/Search.tsx
export function SearchComponent() {
    const appModel = useService<AppModel>("ol-app.AppModel");
    const sources = useReactiveSnapshot(() => appModel.searchSources.getItems(), [appModel]);
    // ...
}
```

In the example above, the `SearchComponent` will always use the current `searchSources` defined by the `AppModel`,
even if those sources are changed by an entirely different part of the application.

**Example 2:** Modifying reactive data

```tsx
// ui/MapTools.tsx
export function MapTools() {
    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");

    // (1)
    const { isTocActive, isLegendActive, isPrintingActive } = useReactiveSnapshot(() => {
        return {
            isTocActive: appModel.mainContent.includes("toc"),
            isLegendActive: appModel.mainContent.includes("legend"),
            isPrintingActive: appModel.mainContent.includes("printing")
        };
    }, [appModel]);

    // Later:
    return (
        // ...
        <ToolButton
            label={intl.formatMessage({ id: "tocTitle" })}
            icon={<PiListLight />}
            isActive={isTocActive}
            onClick={() => appModel.toggleMainContent("toc")} // (2)
        />
    );
}
```

In the example above, the tool button rendered by the component will always reflect the current state of the widget, because `isTocActive` is derived from the app model's `mainContent` array (in **(1)**).
When the button is clicked (in **(2)**), the `toggleMainContent` method of the `AppModel` is called to change the state (which will in turn update the current value of `isTocActive` once the change has been made).

### Recommendations

In general, the following approaches are recommended to manage your application's state.
When in doubt, prefer the simpler / less powerful alternative.

1. For local state or state that only concerns very few layers of components, use React's builtin `useState` / `useReducer`.
2. For state that is needed across many layers of UI components, consider using React's [Context](https://react.dev/learn/passing-data-deeply-with-context) (not shown in this example), possibly combined with the reactivity API to pass complex objects down the component tree.
3. For state that is needed all around your application, create one (or more) services that manage your data using the reactivity API.
   Keep in mind that not all data is local to the _User Interface_ and that it may also be required that "normal" JavaScript (outside of React) can interact with it.
4. If your application grows large, consider splitting parts of your business logic, user interface or state management into different packages with well-defined responsibilities (also not shown in this example to keep it simple).
