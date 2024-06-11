// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageIntl } from "@open-pioneer/runtime";
import { ReactNode } from "react";
import { Geolocation } from "@open-pioneer/geolocation";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Printing } from "@open-pioneer/printing";
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { OverviewMap } from "@open-pioneer/overview-map";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Search, SearchSelectEvent } from "@open-pioneer/search";
import { PhotonGeocoder } from "../sources/PhotonGeocoderSearchSource";
import { HttpService } from "@open-pioneer/http";
import { Highlight, MapModel } from "@open-pioneer/map";
import { Geometry } from "ol/geom";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { Measurement } from "@open-pioneer/measurement";

export interface Demo {
    /** Unique id */
    id: string;

    /** Human readable (and translated) title */
    title: string;

    /** Human readable description */
    description: string;

    /** Main widget to display in the app. */
    mainWidget?: ReactNode;

    /**
     * Tools that are shown next to the zoom buttons on the map.
     */
    tools?: ReactNode;

    activate?: () => void;

    deactivate?: () => void;
}

export function createDemos(
    intl: PackageIntl,
    httpService: HttpService,
    mapModel: MapModel
): Demo[] {
    return [
        // todo TOC + Basemapswitcher + Legend
        {
            id: "coordinateViewer",
            title: intl.formatMessage({ id: "demos.coordinateViewer.title" }),
            description: intl.formatMessage({ id: "demos.coordinateViewer.description" }),
            mainWidget: <CoordinateViewer mapId={MAP_ID} />
        },
        {
            id: "scaleViewer",
            title: intl.formatMessage({ id: "demos.scaleViewer.title" }),
            description: intl.formatMessage({ id: "demos.scaleViewer.description" }),
            mainWidget: <ScaleViewer mapId={MAP_ID} />
        },
        {
            id: "scaleBar",
            title: intl.formatMessage({ id: "demos.scaleBar.title" }),
            description: intl.formatMessage({ id: "demos.scaleBar.description" }),
            tools: <ScaleBar mapId={MAP_ID} />
        },
        {
            id: "measurement",
            title: intl.formatMessage({ id: "demos.measurement.title" }),
            description: intl.formatMessage({ id: "demos.measurement.description" }),
            mainWidget: <Measurement mapId={MAP_ID} />
        },
        // todo Editing
        {
            id: "mapNavigation",
            title: intl.formatMessage({ id: "demos.mapNavigation.title" }),
            description: intl.formatMessage({ id: "demos.mapNavigation.description" }),
            tools: (
                <>
                    <ZoomIn mapId={MAP_ID} />
                    <ZoomOut mapId={MAP_ID} />
                    <InitialExtent mapId={MAP_ID} />
                </>
            )
        },
        {
            id: "geolocation",
            title: intl.formatMessage({ id: "demos.geolocation.title" }),
            description: intl.formatMessage({ id: "demos.geolocation.description" }),
            tools: <Geolocation mapId={MAP_ID} />
        },
        {
            id: "spatialBookmarks",
            title: intl.formatMessage({ id: "demos.spatialBookmarks.title" }),
            description: intl.formatMessage({ id: "demos.spatialBookmarks.description" }),
            mainWidget: <SpatialBookmarks mapId={MAP_ID} />
        },
        createOverviewMapDemo(intl),
        {
            id: "printing",
            title: intl.formatMessage({ id: "demos.printing.title" }),
            description: intl.formatMessage({ id: "demos.printing.description" }),
            mainWidget: <Printing mapId={MAP_ID} />
        },
        // todo Selection + Result List
        createSearchAndHighlightDemo(intl, httpService, mapModel)
    ];
}

function createOverviewMapDemo(intl: PackageIntl): Demo {
    const overviewMapLayer = new TileLayer({
        source: new OSM()
    });

    return {
        id: "overviewMap",
        title: intl.formatMessage({ id: "demos.overviewMap.title" }),
        description: intl.formatMessage({ id: "demos.overviewMap.description" }),
        mainWidget: <OverviewMap mapId={MAP_ID} olLayer={overviewMapLayer} />
    };
}

function createSearchAndHighlightDemo(
    intl: PackageIntl,
    httpService: HttpService,
    map: MapModel
): Demo {
    const photonSource = new PhotonGeocoder("Photon Geocoder", ["city", "street"], httpService);
    let highlight: Highlight | undefined = undefined;

    function onSearchResultSelected(event: SearchSelectEvent) {
        const geometry = event.result.geometry;
        if (!geometry) {
            return;
        }

        highlight = highlightAndZoom(map, [geometry], highlight);
    }

    function clearHighlight() {
        highlight?.destroy();
        highlight = undefined;
    }

    return {
        id: "searchAndHighlight",
        deactivate: clearHighlight,
        title: intl.formatMessage({ id: "demos.searchAndHighlight.title" }),
        description: intl.formatMessage({ id: "demos.searchAndHighlight.description" }),
        mainWidget: (
            <Search
                mapId={MAP_ID}
                sources={[photonSource]}
                onSelect={onSearchResultSelected}
                onClear={clearHighlight}
            />
        )
    };
}

function highlightAndZoom(
    map: MapModel,
    geometries: Geometry[],
    previousHighlight: Highlight | undefined
): Highlight {
    const viewport: HTMLElement = map.olMap.getViewport();

    clearPreviousHighlight(previousHighlight);
    return map.highlightAndZoom(geometries, {
        viewPadding:
            viewport && viewport.offsetWidth < 1000
                ? { top: 150, right: 75, bottom: 50, left: 75 }
                : { top: 150, right: 400, bottom: 50, left: 400 }
    });
}

function clearPreviousHighlight(highlight: Highlight | undefined) {
    highlight?.destroy();
}
