// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed } from "@conterra/reactivity-core";
import { Highlight, MapModel } from "@open-pioneer/map";
import { Search, SearchSelectEvent, SearchSource } from "@open-pioneer/search";
import { PhotonGeocoder } from "../sources/PhotonGeocoderSearchSource";
import { Demo, DemoModel, SharedDemoOptions } from "./Demo";
import { DemoDescription } from "./DemoDescription";
import { Geometry } from "ol/geom";
import { ReactNode } from "react";
import { HttpService } from "@open-pioneer/http";

export function createSearchAndHighlightDemo({
    currentIntl,
    httpService,
    mapModel
}: SharedDemoOptions): Demo {
    return {
        id: "searchAndHighlight",
        title: computed(() =>
            currentIntl.value.formatMessage({ id: "demos.searchAndHighlight.title" })
        ),
        createModel() {
            return new DemoModelImpl(mapModel, httpService);
        }
    };
}

class DemoModelImpl implements DemoModel {
    #searchSource: SearchSource;
    #mapModel: MapModel;
    #highlight: Highlight | undefined;

    description: ReactNode;
    mainWidget: ReactNode;

    constructor(mapModel: MapModel, httpService: HttpService) {
        this.#searchSource = new PhotonGeocoder("Photon Geocoder", ["city", "street"], httpService);
        this.#mapModel = mapModel;

        this.description = <DemoDescription messageId="demos.searchAndHighlight.description" />;
        this.mainWidget = (
            <Search
                sources={[this.#searchSource]}
                onSelect={this.#onSearchResultSelected}
                onClear={this.#clearHighlight}
            />
        );
    }

    destroy() {
        this.#clearHighlight();
    }

    #onSearchResultSelected = (event: SearchSelectEvent) => {
        const geometry = event.result.geometry;
        if (!geometry) {
            return;
        }

        this.#clearHighlight();
        this.#highlight = highlightAndZoom(this.#mapModel, [geometry]);
    };

    #clearHighlight = () => {
        this.#highlight?.destroy();
        this.#highlight = undefined;
    };
}

function highlightAndZoom(map: MapModel, geometries: Geometry[]): Highlight {
    const viewport: HTMLElement = map.olMap.getViewport();
    return map.highlights.addAndZoom(geometries, {
        viewPadding:
            viewport && viewport.offsetWidth < 1000
                ? { top: 150, right: 75, bottom: 50, left: 75 }
                : { top: 150, right: 400, bottom: 50, left: 400 }
    });
}
