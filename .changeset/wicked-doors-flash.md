---
"@open-pioneer/toc": minor
---

Adds the optional functionality to collapse and expand groups in the TOC.
This option can be activated with the `collapsibleGroups` property (default is `false`).
If the property `initiallyCollapsed` is `true` all groups are collapsed by default when the TOC is rendered. This is helpful if the app has a large layer tree.
Additionally, a menu item to collapse all groups can be added to the Tools section by setting `toolsConfig.showCollapseAllGroups` to `true` (default is `true`).
This is only applicable if `collapsibleGroups` and `showTools` are both `true`.

```jsx
import { Toc } from "@open-pioneer/toc";

<Toc
    mapId={MAP_ID}
    showTools={true}
    collapsibleGroups={true} //groups are collapsible in TOC
    initiallyCollapsed={true} //groups are collapsed initially
    toolsConfig={{ showCollapseAllGroups: true }} //show 'collapse all' menu item in Tools
/>;
```
