---
name: map-package
description: Work inside the `map` package. Use when changing the map registry, the map model, the map config, a layer class or layer config, the layer collection, highlights, overlays, the map container or map anchors, or when a component needs a map API that does not exist yet.
---

# The map package

Read `src/packages/map/README.md` for the published behavior and `src/packages/map/internals.md` for the layer class
hierarchy before changing anything here.
Every other package depends on `map`, so a change here reaches every published app.

## Creation

A map starts as a `MapConfig`.
An app provides it through a service implementing `map.MapConfigProvider` (one per map id), or creates the map
directly with `MapRegistry.createMapModel(mapId, config)`.
`MapRegistry` (`MapRegistry.ts`) creates each model lazily on the first `getMapModel(mapId)`, remembers an in-progress
creation so concurrent callers share it, caches a construction error for configured maps, and destroys all maps when
the app stops.
`model/createMapModel.ts` turns the config into an `OlMap` and a `MapModel`.
It registers EPSG:25832 and EPSG:25833 in proj4 at import time, adds an OSM fallback layer when the config has no
layers at all, and warns when `LayerConfig.isBaseLayer` and `MapConfig.baseLayers` disagree.

## Map model

`MapModel` (`model/MapModel.ts`) exposes `center`, `zoomLevel`, `scale`, `resolution`, `rotation`, `loading` and
`container` as getters over signals that mirror the OpenLayers view through `synchronized()`.
It owns four sub-objects: `layers` (`LayerCollection`), `highlights` (`Highlights`), `overlays` (`Overlays`) and the
attributions (`MapAttributions`).
`whenDisplayed()` resolves once the map has a target and a size; view state read before that is undefined, and the
initial extent is applied only then.
The symbol `DISPLAY_STATUS` exposes that state to the package without publishing it.

`LayerCollection` (`model/LayerCollection.ts`) keeps base, operational and topmost layers in three ordered reactive
lists, indexes every layer and sublayer by id, and rewrites the OpenLayers layer array from the lists whenever they
change.
`addLayer(layer, { at })` places a layer at the top, bottom, above or below a reference, or among the base or topmost
layers.

## Layers

`AbstractLayerBase` (`layers/AbstractLayerBase.ts`) is the base of layers and sublayers: id, title, description,
`internal`, reactive `attributes`, the parent and the owning map.
`AbstractLayer` (`layers/AbstractLayer.ts`) adds the `olLayer`, visibility, resolution and zoom limits read from
OpenLayers through `synchronized()`, and `loadState`, which combines the OpenLayers source state, the optional health
check and the metadata request (WMS and WMTS capabilities) in `combineLoadInfos()`.
The concrete classes are `SimpleLayer`, `WMSLayer`, `WMTSLayer`, `GroupLayer` and `WMSSublayer`.

Layers are built through the `LayerFactory` service, which passes the `HttpService` as `LayerDependencies` and the
`INTERNAL_CONSTRUCTOR_TAG`.
The public constructors still work for compatibility and print a deprecation warning through `deprecated()`; a layer
built that way gets its dependencies from the map once attached.
Every layer class ends with the `if (false)` block that checks it against `LayerConstructor`; keep it when adding one.

The collaboration between `MapModel`, `LayerCollection` and the layer classes runs through symbol-keyed methods from
`layers/shared/internals.ts` (`ATTACH_TO_MAP`, `DETACH_FROM_MAP`, `SET_VISIBLE`, `GET_DEPS`, `SET_LEGEND`, ...).
This keeps them callable within the package and out of the published API, so a new internal hook gets a symbol there,
never a public method.

A new layer type needs: a config interface extending `LayerConfig`, a class extending `AbstractLayer` with `type`,
`legend`, `layers` and `sublayers` getters, an entry in the unions of `layers/unions.ts`, exports in `index.ts`, a
section in `internals.md`, README documentation and a changeset.

## Container and anchors

`MapContainer` (`ui/MapContainer.tsx`) sets the `OlMap` target and the keyboard event target, and renders a sibling
div `.map-anchors` that hosts the `MapAnchor` portals and the `OverlaysRenderer`, so UI on the map does not interfere
with map events.
There is at most one container per map; a second one logs an error and does nothing.
View padding is written to the view and to CSS variables (`--map-padding-*`), which `ui/styles.css` uses to shrink
the `.map-anchors` host to the unpadded area; `computeMapAnchorStyles()` only positions an anchor within that host.

`useMapModelValue(props)` returns the `map` prop or the `DefaultMapProvider` context and throws without either.
`useMapModel(mapId)` is the older async lookup through the registry and stays for compatibility.

## Checks

Run the tests of the files you changed, then `pnpm exec oxlint <path>` and `pnpm check-types`.
Changes to the published surface update `README.md` and get a changeset; changes to the layer classes update
`internals.md`.
