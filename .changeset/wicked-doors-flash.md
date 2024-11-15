---
"@open-pioneer/toc": minor
---

Adds the optional functionallity to collapse and expand groups in the TOC. This option can be activated with the `collapsibleGroups` property (default is `false`).  
Additionally, a menu item to collapse all groups can be added to the Tools section by setting `toolsConfig.showCollapseAllGroups` to `true` (default is `true`). This is only applicable if `collapsibleGroups` and `showTools` are both `true`.


  ```jsx
import { Toc } from "@open-pioneer/toc";
 
<Toc
    mapId={MAP_ID}
    showTools={true}
    collapsibleGroups={true} //groups are collapsible in TOC
    toolsConfig={{showCollapseAllGroups: true}} //show 'collapse all' menu item in Tools
/>
  ```
