// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { equals as extentEquals } from "ol/extent";
import OlMap from "ol/Map";

let setupDone = false;

/** @internal */
export function patchOpenLayersClassesForTesting() {
    if (setupDone) {
        return;
    }

    // Test support: open layers relies on div.offsetHeight (and Width)
    // plus getComputedStyle(div), which do not work as expected in happy dom.
    // The following snippet fakes a size so tests can work with the map.
    OlMap.prototype.updateSize = function () {
        const target = this.getTargetElement();
        const height = 500;
        const width = 500;
        const size = target ? [width, height] : undefined;
        const oldSize = this.getSize();
        if (size && (!oldSize || !extentEquals(size, oldSize))) {
            this.setSize(size);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).updateViewportSize_();
        }
    };
    setupDone = true;
}
