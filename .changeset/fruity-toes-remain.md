---
"@open-pioneer/feature-editing": minor
"@open-pioneer/measurement": minor
"@open-pioneer/selection": minor
"@open-pioneer/editing": minor
---

Rework the tooltips rendered on the map: help tooltips now look like chakra's tooltips, and the measurement tooltips (active and finished measurements) are also derived from chakra's tooltip styles.

The built-in styles of these tooltips are no longer shipped as plain css, chakra style props are used instead.
The existing css classes (`editing-tooltip`, `measurement-tooltip`, `measurement-active-tooltip`, `measurement-finished-tooltip`, `selection-tooltip`) remain on the overlay's element.
