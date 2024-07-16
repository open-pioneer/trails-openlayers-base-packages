---
"@open-pioneer/map": minor
---

Change how map anchors are positioned in the DOM.

Previously, map anchor divs were children of the OpenLayers map viewport:

```
.map-container
└── .ol-viewport
    └── .ol-overlaycontainer-stopevent
        └── .map-anchors
            └── .map-anchor
                └── ... children ...
```

The fact that map anchors were children of the map interfered with browser event handling, especially if the map anchor's content was interactive.
The workarounds to stop events from map-anchors to bubble into the map caused surprising behavior (e.g. https://github.com/open-pioneer/trails-openlayers-base-packages/issues/312).

Now, the DOM looks like this:

```
.map-container
├── .map-anchors
│   └── .map-anchor
│       └── ... children ...
└── .ol-viewport
```

Which means that the map-anchors are no longer children of the map.

You may have to update your custom styles if you relied on the previous DOM hierarchy.
