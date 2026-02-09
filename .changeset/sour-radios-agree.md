---
"@open-pioneer/map": minor
---

Add Overlays API to the Map Package.

An overlay is an UI element that is displayed over the map. Overlays are tied to coordinates on the map and not to a position on the screen. The rendered content of an overlay is a ReactNode. Therefore, it can be simple text content or a complex React component.

The new Overlays API should be preferred over the raw OpenLayers overlays.

Example:

```tsx
import { Box } from "@chakra-ui/react";
import { MapModel } from "@open-pioneer/map";


const map: MapModel = ... //the map model

//add overlay to map and get overlay instance
const myOverlay = map.overlays.addOverlay({
    content: <MyOverlayContent innerText="Initial Content!"></MyOverlayContent>, //initially rendered content
    tag: "my-overlay", //custom identifier
    position: [7.6, 52.0], //coordinates in map projection
    className: "overlay-css-class",
    positioning: "bottom-center"
    //mode: "followPointer" //overlay would automatically follow pointer movement (default "setPosition")
});

//get all current overlays
let currentOverlaysList = map.overlays.getOverlays();
console.log(currentOverlaysList.length) //prints 1

myOverlay.setPosition([7.75, 52.25]); //manually change position in mode "setPosition"
myOverlay.setContent(<MyOverlayContent innerText="New Content!"></MyOverlayContent>); //render new content

//remove and destroy overlay
//destroyed overlays cannot be reused.
myOverlay.destroy();

currentOverlaysList = map.overlays.getOverlays();
console.log(currentOverlaysList.length) //prints 0

...

//React component that is rendered as overlay content
function MyOverlayContent(props: { innerText: string }) {
    const { innerText } = props;

    return <Box as="span">{innerText}</Box>;
}

```
