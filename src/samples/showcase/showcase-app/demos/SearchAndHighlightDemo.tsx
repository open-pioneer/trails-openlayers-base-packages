// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, ReadonlyReactive } from "@conterra/reactivity-core";
import { HttpService } from "@open-pioneer/http";
import { Highlight, MapModel } from "@open-pioneer/map";
import { FormattedRichMessage } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { Search, SearchSelectEvent, SearchSource } from "@open-pioneer/search";
import { Geometry } from "ol/geom";
import { ReactNode } from "react";
import { PhotonGeocoder } from "../sources/PhotonGeocoderSearchSource";
import { Demo, DemoModel, SharedDemoOptions } from "./Demo";

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
            return new DemoModelImpl(mapModel, httpService, currentIntl);
        }
    };
}

class DemoModelImpl implements DemoModel {
    #searchSource: SearchSource;
    #mapModel: MapModel;
    #highlight: Highlight | undefined;

    description: ReactNode;
    mainWidget: ReactNode;

    constructor(
        mapModel: MapModel,
        httpService: HttpService,
        currentIntl: ReadonlyReactive<PackageIntl>
    ) {
        this.#searchSource = new PhotonGeocoder("Photon Geocoder", ["city", "street"], httpService);
        this.#mapModel = mapModel;

        this.description = (
            <FormattedRichMessage intl={currentIntl} id="demos.searchAndHighlight.description" />
        );
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
