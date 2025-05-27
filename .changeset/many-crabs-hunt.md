---
"@open-pioneer/map": patch
---

The default attribution widget created for the map now has `role="region"` and an `aria-label` for improved screen reader support.

```html
<div
    style="pointer-events: auto;"
    class="ol-attribution ol-unselectable ol-control ol-uncollapsible"
    role="region"
    aria-label="Quellenangaben"
>
    <!-- Attributions -->
</div>
```
