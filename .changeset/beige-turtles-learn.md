---
"@open-pioneer/coordinate-search": patch
"@open-pioneer/map-ui-components": patch
"@open-pioneer/spatial-bookmarks": patch
"@open-pioneer/map-navigation": patch
"@open-pioneer/geolocation": patch
"@open-pioneer/result-list": patch
"@open-pioneer/search": patch
"@open-pioneer/toc": patch
---

Ensure that icons and other decorative elements are hidden from the screen reader using the `aria-hidden="true"` attribute.

The easiest way to do that is to wrap icons into chakra's `<Icon />` component, for example:

```tsx
import { Icon } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";

<Icon>
    <FiX />
</Icon>;
```
