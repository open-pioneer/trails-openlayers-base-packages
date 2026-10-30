---
name: component
description: Write or change a mapping component such as the TOC, legend, search or a tool button. Use when adding a component or package, adding props, moving state into a view model, exposing a component API, reading layer attributes, drawing helper layers, or checking the UI and accessibility rules.
---

# Mapping components

Read `docs/guidelines/UI.md` and `docs/guidelines/A11y.md`; they are the review checklist for every component.
New packages start from `docs/templates/package-README.md`.

## Shape of a component

Props extend `CommonComponentProps` from `@open-pioneer/react-utils` and `MapModelProps` from `@open-pioneer/map`.
The component calls `useCommonComponentProps("<root-class>", props)` for its root element and `useMapModelValue(props)`
for the map.
Own CSS classes carry the package or component name as prefix (`toc-layer-item`, `measurement-tooltip`).
Chakra components over plain HTML, no fixed colors, fonts or sizes, `ToolButton` from `map-ui-components` for buttons
on the map, icons from `react-icons/lu` (Lucide) and then Tabler.
A component that wraps one element forwards `ref`.
`scale-viewer/ScaleViewer.tsx` is the smallest complete example.

Translated text comes from `useIntl()` with keys in both `i18n/en.yaml` and `i18n/de.yaml`; tooltips start with a
capital letter in both languages.
Headings go through `TitledSection` and `SectionHeading` from `react-utils`, never raw `h*` tags.

## Package layout

```
api.ts | api/   Public types: sources, events, the component API
model/          The view model and its helpers, no React
ui/             Components and the hook that creates the view model
index.ts        Re-exports the public surface
```

## View model

Components with more than trivial state keep it in a view model class outside React.
Its state is signals from `@conterra/reactivity-core` in private fields behind getters, its operations are methods,
and it implements `destroy()`.
The hook that creates it (`search/ui/useSearchViewModel.ts`, `toc/ui/useTocViewModel.ts`) constructs the instance
in a `useEffect` keyed on the map, stores it with `useState`, destroys it in the cleanup, and pushes changed props
into it through further effects; callbacks are wrapped with `useEffectEvent` so the instance survives prop changes.
React reads the view model with `useReactiveSnapshot()`; the oxlint `exhaustive-deps` rule checks its dependency
array.
Older components call the class a controller (`MeasurementController`, `GeolocationController`); new code says view
model.

A component that can be controlled from the outside hands a component API object (`SearchApi`, `TocApi`) to the app
through its `onReady` event and announces its teardown through `onDisposed`.

Long-running work (search, selection) takes an `AbortSignal`, and the view model cancels the previous operation before
starting the next.

### The TOC as reference

`TocViewModel` owns a tree of `TocLayerNode` objects, one per operational layer and sublayer, which `SyncedChildNodes`
keeps in sync with the map and reuses across changes so that expanded state survives.
Every layer gets a node, including internal layers and layers hidden through the list mode; `node.isShown` says
whether the UI presents it, `node.isVisible` whether the layer is visible in the map, and the two are unrelated.
A node's `issues` combine its own load and scale problems with those of descendants that are not shown, so a hidden
child's error surfaces on its parent.
`LayerItem` reads a node with `useReactiveSnapshot()`, calls `node.setVisible()` and `node.setExpanded()`, registers
its DOM element on the node for `TocItem.htmlElement`, and mounts nested lists lazily on the first expand.
`TocApi` exposes nodes as `TocItem` objects and omits the ones that are not shown.

## Talking to the map

- Read map state through the model's getters and signals, never through `olMap.getView()` listeners.
- Helper layers a component draws on are created with `layerFactory.create({ type: SimpleLayer, internal: true })`,
  added with `map.layers.addLayer(layer, { at: "topmost" })` and removed in `destroy()`.
  The factory comes from the `map.LayerFactory` UI reference in `build.config.mjs`.
- Pointing at features: `map.highlights.add()` returns a `Highlight` resource; destroy it when the component or the
  selection goes away.
- Help texts over the map are overlays whose content is a `TooltipBox` from `map-ui-components`, positioned with
  `follow-pointer`.
- Per-layer configuration lives in `layer.attributes` under a well-known key: `legend` for `LegendItemAttributes`,
  `toc` for `LayerTocAttributes`.
  Read it reactively, because apps update attributes at runtime.
- App-provided behavior is a source object (`SearchSource`, `SelectionSource`) with a label, an optional id and one
  async method that receives the map, the map projection and an `AbortSignal`.

## Services in a component package

A service interface lives in `api.ts` and extends `DeclaredService<"<short-name>.<Name>">`, where the short name is
the package name without the scope.
The class `<Name>Impl` has its own file, is exported from `services.ts` and is registered in `build.config.mjs` with
`provides: "<short-name>.<Name>"`.
Components reach a service with `useService()` from `open-pioneer:react-hooks`, which requires the interface under
`ui.references`.

## Finishing a change

- A new prop or behavior is documented in the package `README.md`, following the "to achieve X, set Y" style of the
  template.
- A new component gets a demo in `src/samples/showcase/showcase-app/demos/` and, when it is complex, its own sample
  under `src/samples/` linked from `src/index.html`.
- Every consumer-visible change gets a changeset.
- Run the package tests, `pnpm exec oxlint <path>` and `pnpm check-types`.
