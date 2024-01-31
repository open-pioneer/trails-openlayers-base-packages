# ol-app

This sample application demonstrates most components developed in this repository.

## Organisation

The following diagram shows the most important files (or directories) of this sample and their use.

```
ol-app/
├── i18n/                       # Translation files
├── ui/                         # Contains UI components
├── AppModel.ts                 # Manages application-wide state
├── app.ts                      # Application entry point
└── MapConfigProviderImpl.ts    # Configures the map and its layers
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
It also orchestrates some UI-related state, such as the current map interaction (such as `measurement`)
and the visibility of certain components.

For this example, it was decided to create a file (and a React component) for many Open Pioneer Trails widgets (such es `Legend` or `Toc`).
These wrapper components typically configure the underlying widget's properties, set up application-specific event handling or add custom styles and content to integrate the widget into the application's look and feel.

## State management

Some of the React components in this application manage some simple local state (such as whether a tool is active or not).
Local state (`useState` / `useReducer`) is simple to keep track of and can also easily be forwarded to other components (as `props`).
This is convenient for simple use cases but will quickly stop scaling: passing state / props over multiple layers of the component hierarchy is cumbersome, especially if multiple components in different parts of the application depend on the same data.

The `AppModel` class is used to handle truly global data.
It provides a reactive store (`appModel.state`) by using the [Valtio](https://github.com/pmndrs/valtio) library.
Valtio implements a state management solution based on proxies that feels similar to Vue's reactivity system.
Because the AppModel is registered as a service, all React components in this package can use it to access global state:

```tsx
// ui/Search.tsx
export function SearchComponent() {
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const sources = useSnapshot(appModel.state).searchSources;
    // ...
}
```

In the example above, the `SearchComponent` will always use the current `searchSources` defined by the `AppModel`,
even if those sources are changed in an entirely different part of the application.

In general, the following approaches are recommended to manage your application's state.
When in doubt, prefer the simpler / less powerful alternative.

1. For local state or state that only concerns very few layers of components, use React's builtin `useState` / `useReducer`.
2. For state that is needed across many layers of UI components, consider using React's [Context](https://react.dev/learn/passing-data-deeply-with-context) (not shown in this example).
3. For state that is needed all around your application, create one (or more) services that manage your data using libraries such as [Zustand](https://github.com/pmndrs/zustand), [Jotai](https://github.com/pmndrs/jotai) or [Valtio](https://github.com/pmndrs/valtio). Keep in mind that not all data is local to the _User Interface_ and that it may also be required that "normal" JavaScript (outside of React) can interact with it.
4. If your application grows large, consider splitting parts of your business logic, user interface or state management into different packages with well-defined responsibilities (also not shown in this example to keep it simple).
