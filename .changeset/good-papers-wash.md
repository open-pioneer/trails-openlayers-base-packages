---
"@open-pioneer/toc": minor
---

Introduce Toc API

The Toc API allows programmatic access to the Toc. Currently, the Toc API allows accessing the individual Toc Items.  
Toc Items can be expanded/collapsed and provide access to the corresponding DOM element.

```tsx
import { Toc, TocApi, TocReadyEvent } from "@open-pioneer/toc";
import { Button } from "@chakra-ui/react";

const tocAPIRef = useRef<TocApi>(undefined);

//assign api ref once Toc is initialized
function tocReadyHandler(e: TocReadyEvent) {
    tocAPIRef.current = e.api;
}

//reset api ref when Toc is unmounted
function tocDisposedHandler() {
    tocAPIRef.current = undefined;
}

//expand or collapse group layer with the Toc API
function toggleTocItem(layerId: string) {
    if (tocAPIRef.current) {
        const layerItem = tocAPIRef.current.getItemByLayerId(layerId);
        console.log("Current html element", layerItem?.htmlElement); //access DOM element
        const newState = !layerItem?.isExpanded;
        layerItem?.setExpanded(newState);
    }
}

//get api object from ready event
<Toc
    onReady={(e) => tocReadyHandler(e)}
    onDisposed={() => tocDisposedHandler()}
/>

<Button onClick={() => toggleTocItem("myGroupLayer")}>toggle group layer</Button>
```
