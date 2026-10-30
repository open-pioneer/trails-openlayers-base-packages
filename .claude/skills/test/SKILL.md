---
name: test
description: Write, run and fix the Vitest tests of this repository. Use when adding a test case, testing a component, a view model, a layer class or a service against a map, faking the map's size, waiting for the map or for reactive state, or updating a snapshot.
---

# Tests

Every test runs with Vitest in `happy-dom`, configured inline in `vite.config.ts` with `root: src`.
A test file is `<source-file-name>.test.ts` or `.tsx` next to its source; snapshots go to `__snapshots__/` beside it.
Run from the repository root: `pnpm exec vitest run src/packages/<package>/<File>.test.ts`, add `-t "name"` for one
case and `-u` to update snapshots.
`CI=1` rejects `.only`, and the pre-commit hook runs with it.

## The map in tests

OpenLayers runs in happy-dom with the shims from `src/testing/global-setup.ts` (`Worker`, `URL.createObjectURL`,
jsdom's `DOMParser`).
`vite.config.ts` inlines `@open-pioneer/*` and `ol/` for Vitest; a module resolution error in a test usually means
a new dependency needs the same treatment.
Importing `@open-pioneer/map-test-utils` replaces the `render` methods of `VectorLayer` and `TileLayer` with no-ops,
so nothing draws, and network access throws unless a test passes its own `fetch`.

- `setupMap(options)` from `@open-pioneer/map-test-utils` builds a real `MapRegistry` and `LayerFactory` with one map
  and returns `{ map, mapId, registry, layerFactory }`.
  Options: `layers`, `baseLayers`, `topmostLayers`, `extent` or `center`/`zoom`, `projection`, `fetch`, `advanced`,
  `noInitialView`, `mockMapRender`.
- A map in happy-dom never gets a size.
  `setupMap({ mockMapRender: true })`, or `mockMapRender(map)` later, renders it into a hidden div with a faked size,
  so the view initializes and `scale`, `center` and `zoomLevel` have values.
  `await waitForMapRender(map)` then waits for `whenDisplayed()` and the `.ol-viewport`.
- A component that renders a `<MapContainer>`: `render(...)` with `data-testid="base"` on the container and
  `await waitForMapMount("base")`.
- `createTestLayer(config)` gives a `SimpleLayer` with an empty tile layer, `createTestOlLayer()` the bare `olLayer`.
- WMS and WMTS tests feed capabilities XML from a `test-data/` directory through the `fetch` option; see
  `map/layers/WMSLayer.test.ts`.

## Pick the level

- **Plain unit test** for a function or class that takes values and returns values.
  `map/utils/geometry-utils.test.ts` and `map/layers/wms/getLegendUrl.test.ts` are the examples.
- **Model test** for a view model, a layer class or the map model itself, without React.
  Construct the subject with the map from `setupMap()`, drive it through its methods, and observe its getters or
  `watchValue()` from `@conterra/reactivity-core`.
  `search/model/SearchViewModel.test.ts`, `toc/model/TocViewModel.test.ts`, `map/model/MapModel.test.ts` and
  `map/layers/GroupLayer.test.ts` are the examples.
  A tree-shaped model is easiest to assert as an indented list in an inline snapshot, as `dumpTree()` in the TOC test
  does.
- **Service test** for a service class.
  Construct it with `createService(Impl, { references, properties, messages })` from
  `@open-pioneer/test-utils/services` and pass plain objects as references.
  `printing/PrintingServiceImpl.test.ts` and `ogc-features/vector-source/OgcFeaturesVectorSource.test.ts` are the
  examples.
- **Component test** for a mapping component.
  Render with `render` from `@testing-library/react` inside `<PackageContextProvider services={...} properties={...}
  locale={...}>` from `@open-pioneer/test-utils/react`, pass `map={map}` from `setupMap()`, and drive it with
  `userEvent` from `@testing-library/user-event`.
  `scale-viewer/ScaleViewer.test.tsx` is the smallest example, `toc/ui/Toc.test.tsx` and `search/ui/Search.test.tsx`
  the larger ones.

Pick the cheapest level that can fail for the reason you care about.
A component test that only checks state belongs in a model test.

## Names and layout

Name an `it()` case after the behavior, as a plain verb phrase: `"sets the initial extent if configured"`,
`"removes the highlight when the result list unmounts"`.
Many older cases start with "should"; leave those names as they are instead of renaming them.

Write top-level `it()` cases and use `describe()` only to group closely related cases.
Test cases come first, and the `setup()` or `renderMap()` helper that builds the subject goes to the bottom of the
file.
Destroy the map model or view model in `afterEach`, or in `onTestFinished()` inside the `setup()` helper so each
test's cleanup stays next to what it created, and call `vi.restoreAllMocks()` when the test spied on anything.

## Helpers

- `createIntl({ locale, messages })` from `@open-pioneer/test-utils/vanilla` gives a `PackageIntl` for code that
  formats messages outside React.
- `disableReactActWarnings()` from the private workspace package `test-utils` silences React's `act()` warnings for
  the current test only.
  Reach for it after trying to wrap the state change in `act()`.
- Shared fixtures of a package live next to its tests: `search/testSources.ts`, `selection/test-utils.ts`,
  `geolocation/test-utils.ts`, `coordinate-search/test-utils.ts`.
- `src/testing/global-setup.ts` already registers the jest-dom matchers (`toHaveStyle`, `toBeVisible`, ...).

## Waiting for async state

Reactive updates from `@conterra/reactivity-core`, OpenLayers events and React renders arrive asynchronously.

- A DOM element that will appear: `await screen.findByText(...)` or `await findByTestId(container, ...)`, which retry.
- A DOM element that will disappear: `await waitForElementToBeRemoved(element)`.
- A value with no DOM: `await vi.waitFor(() => { expect(model.loadState).toBe("loaded"); })`, or
  `await vi.waitUntil(() => value)` to capture the settled value.
- The map's view: `await waitForMapRender(map)` after `mockMapRender`, or `await waitForInitialExtent(map)`.
- A state change that React must observe: wrap the call in `act(() => { ... })`.
- Code that uses timers internally, such as the search typing delay: `vi.useFakeTimers()` with
  `vi.advanceTimersByTime()`, restored in `afterEach` with `vi.useRealTimers()`.
- A `computed()` or a `watch()` callback that has not run yet after a synchronous change: `await nextTick()` from
  `@conterra/reactivity-core` flushes the pending reactive updates.
  Other, less flaky methods should be preferred if available.

Never pause with `setTimeout`; a fixed delay is flaky and hides the real timing problem.

## Assertions

- Rendered markup or a serialized object: `toMatchInlineSnapshot()` for small values, `toMatchSnapshot()` for larger
  markup that lands in `__snapshots__/`.
  Review a snapshot diff before accepting it; the markup of a Chakra component changes with Chakra updates and a
  `-u` run accepts whatever is rendered.
- Layer order and composition: assert on `map.layers.getLayers().map(l => l.id)` or on the `olMap` layer array, not on
  both.
- An error a user should read: `await expect(promise).rejects.toThrow(/message/)`.
- A network call: pass a `vi.fn()` as the `fetch` option of `setupMap()` or as the `httpService` reference, and
  inspect the request it received; restore mocks in `afterEach`.
- Translated text: pass `messages` or `locale` to `PackageContextProvider` and assert the formatted string instead of
  message ids.
- Printing: canvas does not work in happy-dom, so spy on the `PrintJob` methods as `printing/*.test.ts` does.
  Those methods are TypeScript `private` instead of `#private` for that reason.

## Checks before you finish

Run the test file, then `pnpm exec oxlint <path>` and `pnpm check-types`.
Test files may use `!` and `any`, everything else in the lint config applies to them too, including the SPDX header.
