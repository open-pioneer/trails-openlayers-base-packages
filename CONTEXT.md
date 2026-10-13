# Trails OpenLayers base packages

The OpenLayers base packages of the Open Pioneer Trails client framework.
`@open-pioneer/map` wraps an OpenLayers map in a reactive map model with a layer tree, and the other packages provide the components
and services that map apps compose on top of it.

This document defines the words the project uses for its own concepts.
Where two words exist for the same thing, the preferred one is defined and the rejected ones are listed under _Avoid_.
Use the preferred term in code, in commit messages, in issues, and in documentation.
The framework's vocabulary (app, app package, Trails package, service, interface, reference, property, site) is
defined in `docs/Glossary.md` of https://github.com/open-pioneer/trails-starter and in the `CONTEXT.md` of
https://github.com/open-pioneer/trails-core-packages.
The definitions here agree with both and add the words that only matter for the map packages.

The _Avoid_ lists govern the names we choose for our own concepts.
They never govern a name a library gives us: OpenLayers' `Map`, `View`, `Layer`, `Source`, `Feature`, `Overlay` and
`Interaction`, Chakra's `Tooltip` and `Popover`, and React's `Component` keep the names their libraries gave them.
When both an OpenLayers object and our wrapper are in play, the OpenLayers one carries the `ol` prefix: `olMap`,
`olView`, `olLayer`, `olSource`.

## Language

### Map

**Map model**:
The object that represents one map in an app (`MapModel`).
It wraps the `olMap`, exposes the view state as reactive getters, and owns the layer collection, the highlights, the
overlays and the attributions.
_Avoid_: map instance, map wrapper, map state (as a noun for the object)

**Map id**:
The string that identifies a map within an app, such as `"main"`.
A map config provider declares it, `MapRegistry.getMapModel(mapId)` resolves it.
_Avoid_: map name, map key

**Map registry**:
The `map.MapRegistry` service that creates map models lazily from the registered map config providers and destroys
them when the app stops.
_Avoid_: map service, map manager

**Map config**:
The options a map is created from (`MapConfig`): initial view, projection, layers, base layers, topmost layers,
attribution switch and the `advanced` OpenLayers options.
_Avoid_: map options, map settings, map definition

**Map config provider**:
A service providing `map.MapConfigProvider` that returns the map config for one map id.
Apps that create their map directly through `MapRegistry.createMapModel()` have none.
_Avoid_: map provider, config service

**Layer factory**:
The `map.LayerFactory` service whose `create({ type, ... })` constructs layer instances.
It is the supported way to construct a layer; the public layer constructors are deprecated.
_Avoid_: layer builder, layer service

**Initial view**:
The configured start position of a map (`InitialViewConfig`), either an extent or a center with a zoom level.
The extent it results in is the map model's `initialExtent`, which `map-navigation` returns to.
_Avoid_: home extent, start view, default extent

**Map container**:
The `<MapContainer>` component that renders the map model into the DOM, sets the `olMap` target, applies the view
padding and hosts the map anchors.
There is at most one per map.
_Avoid_: map view (which is the OpenLayers `View`), map component, map component

**View padding**:
The space at the edges of the map that other UI covers (`MapPadding`), applied through the map container so that
zooming and centering respect the visible part of the map.
_Avoid_: map margin, inset

**Default map**:
The map model a `<DefaultMapProvider>` supplies to its children, so components need no `map` prop.
`useMapModelValue(props)` prefers the prop and falls back to the default map.
_Avoid_: current map, context map, active map

**Scale**:
The denominator of the map scale at the view center (`MapModel.scale`, `setScale()`), computed from the resolution
with the default DPI.
`scale-viewer`, `scale-setter` and `scale-bar` show it.
_Avoid_: zoom (which is the OpenLayers zoom level)

**Projection**:
The coordinate reference system of the map view, named by its EPSG code such as `"EPSG:25832"`.
`registerProjections()` adds proj4 definitions; `map` registers EPSG:25832 and EPSG:25833 on import.
_Avoid_: CRS, SRS, coordinate system (in identifiers)

### Layers

**Layer**:
An operational or base layer of the map model (`Layer`, the union of `SimpleLayer`, `WMSLayer`, `WMTSLayer` and
`GroupLayer`).
It always wraps an `olLayer` and is created through the layer factory.
_Avoid_: layer model, layer wrapper, layer object

**Sublayer**:
A child of a layer that has no `olLayer` of its own (`Sublayer`, today only `WMSSublayer`).
It shares the base properties of a layer, such as title, visibility and attributes.
_Avoid_: child layer (when the child is a sublayer), WMS layer name

**Any layer**:
A layer or a sublayer (`AnyLayer`).
Code that walks the whole tree uses this type; `isLayer()` and `isSublayer()` tell them apart.

**Group layer**:
A layer whose children are themselves layers (`GroupLayer`), each with its own `olLayer`.
_Avoid_: layer group, folder

**Base layer**:
A layer displayed below all operational layers, of which at most one is active at a time
(`MapConfig.baseLayers`, `LayerCollection.activateBaseLayer()`).
`LayerConfig.isBaseLayer` is the older way to declare one.
_Avoid_: basemap (except in the package name `basemap-switcher` and its component), background layer

**Operational layer**:
A top-level layer that is neither a base layer nor a topmost layer (`LayerCollection.getOperationalLayers()`).
_Avoid_: content layer, data layer, overlay layer

**Topmost layer**:
A layer displayed above all operational layers (`MapConfig.topmostLayers`, `addLayer(layer, { at: "topmost" })`).
Highlights and the helper layers of components live there.
_Avoid_: top layer, overlay (which is a DOM element over the map)

**Layer collection**:
The `MapModel.layers` object that holds the base, operational and topmost layers in order, indexes layers by id and
syncs the OpenLayers layer order.
_Avoid_: layer list, layer store, layer tree (which is the nested structure of groups and sublayers)

**Layer attributes**:
The arbitrary, reactive key-value record on every layer (`layer.attributes`, `updateAttributes()`,
`deleteAttribute()`).
Components read their configuration from well-known keys: `legend` for `LegendItemAttributes`, `toc` for
`LayerTocAttributes`.
_Avoid_: layer properties (which are OpenLayers properties), metadata, custom data

**Internal layer**:
A layer with `internal: true`, which the TOC, the legend and `getLayers()` skip by default.
Components mark the helper layers they draw on this way.
_Avoid_: hidden layer (which is an invisible layer), system layer, technical layer

**Load state**:
The combined availability of a layer (`LayerLoadState`: `not-loaded`, `loading`, `loaded`, `error`), computed from
the OpenLayers source state, the health check and the metadata request.
_Avoid_: layer status, health (as a noun for the combined state)

**Visible in scale**:
Whether the current view resolution lies within a layer's resolution and zoom limits (`layer.visibleInScale`).
The TOC greys out layers that are not.
_Avoid_: in range, scale-dependent visibility (as a noun)

### Map content

**Highlight**:
Geometries drawn on the map to point them out (`MapModel.highlights.add()`, `highlightAndZoom()`), returned as a
`Highlight` resource that is removed with `destroy()`.
_Avoid_: selection (which is the result of a selection source), marker, focus

**Display target**:
What `zoom()` and `highlight()` accept: a `BaseFeature` or an OpenLayers `Geometry` (`DisplayTarget`).

**Base feature**:
The common shape of a feature that passes between packages (`BaseFeature`): id, optional geometry with projection,
properties and style.
Search results, selection results and result list rows are base features.
_Avoid_: item, record, entity, OL feature (which is `ol/Feature`)

**Overlay**:
A positioned React element over the map (`MapModel.overlays.add()`, `Overlay`), rendered by the map container and
backed by an OpenLayers `Overlay`.
Its position is a coordinate or `follow-pointer`.
_Avoid_: popup, tooltip (which is the Chakra-styled content, see below), marker

**Attribution item**:
One attribution text shown for the map's sources (`AttributionItem`, `MapModel.attributionItems`).
Apps that disable the default attribution control render these themselves.
_Avoid_: credits, copyright (in identifiers)

### Components

**Component**:
A React component exported by a package for use in an app, such as `Toc`, `Legend`, `Search` or `ZoomIn`.
Its props extend `CommonComponentProps` and (usually) `MapModelProps`, and its root element carries the package or component
name as CSS class.
_Avoid_: widget, control (which is an OpenLayers `Control`), plugin, tool (except in `ToolButton`)

**Map anchor**:
A `<MapAnchor>` inside the map container that places its children at a predefined or manual position over the map.
_Avoid_: map control position, corner, slot

**Tool button**:
The `ToolButton` from `map-ui-components`, an icon button with a translated label and tooltip, used for all buttons
placed on the map.
_Avoid_: icon button (for our buttons), action button

**View model**:
The class that holds the state and the operations of a component outside React (`SearchViewModel`,
`SelectionViewModel`, `SpatialBookmarksViewModel`, `TocViewModel`).
The component creates it per map, updates it from props and destroys it on unmount.
Some older components call theirs a controller (`MeasurementController`, `GeolocationController`,
`PrintingController`); use view model for new code.
_Avoid_: store, state manager, service (which is a Trails service), hook (which is the React function that creates it)
**Source**:
An app-provided object a component queries: a `SearchSource` for `search`, a `SelectionSource` for `selection`.
Each has a label, an optional id and one async method that takes an `AbortSignal` and the map.
_Avoid_: provider, backend, adapter, datasource (as one word)

**List mode**:
Whether the TOC or the legend shows a layer, hides it, or shows it without its children (`ListMode`: `show`,
`hide`, `hide-children`), read from the layer attributes.
_Avoid_: display mode, visibility (which is the layer's own visibility)

### Repository

**Sample**:
A directory under `src/samples/<name>/` holding a site and the app package it loads.
`showcase` demonstrates every component, `map-sample` is the reference app, and the `test-*` samples exercise one feature
each.
_Avoid_: example, demo app, test app, playground

**Demo**:
One entry in the showcase's demo picker (`Demo`, `DemoModel`), implemented under `src/samples/showcase/showcase-app/demos/`.
A new component gets a demo there.

**Changeset**:
A file under `.changeset/` describing a consumer-visible change to one or more published packages.
Because all `@open-pioneer/*` packages are in one fixed group, a release bumps every package to the same version.
