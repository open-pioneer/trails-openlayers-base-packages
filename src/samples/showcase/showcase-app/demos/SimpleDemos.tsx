// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import { Printing } from "@open-pioneer/printing";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { MAP_ID } from "../MapConfigProviderImpl";
import { SharedDemoOptions } from "./Demo";

export function createCoordinateViewerDemo({ intl }: SharedDemoOptions) {
    return {
        id: "coordinateViewer",
        title: intl.formatMessage({ id: "demos.coordinateViewer.title" }),
        description: intl.formatMessage({ id: "demos.coordinateViewer.description" }),
        mainWidget: <CoordinateViewer mapId={MAP_ID} />
    };
}

export function createScaleViewerDemo({ intl }: SharedDemoOptions) {
    return {
        id: "scaleViewer",
        title: intl.formatMessage({ id: "demos.scaleViewer.title" }),
        description: intl.formatMessage({ id: "demos.scaleViewer.description" }),
        mainWidget: <ScaleViewer mapId={MAP_ID} />
    };
}

export function createScaleBarDemo({ intl }: SharedDemoOptions) {
    return {
        id: "scaleBar",
        title: intl.formatMessage({ id: "demos.scaleBar.title" }),
        description: intl.formatMessage({ id: "demos.scaleBar.description" }),
        tools: <ScaleBar mapId={MAP_ID} />
    };
}

export function createMeasurementDemo({ intl }: SharedDemoOptions) {
    return {
        id: "measurement",
        title: intl.formatMessage({ id: "demos.measurement.title" }),
        description: intl.formatMessage({ id: "demos.measurement.description" }),
        mainWidget: <Measurement mapId={MAP_ID} />
    };
}

export function createMapNavigationDemo({ intl }: SharedDemoOptions) {
    return {
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
    };
}

export function createGeolocationDemo({ intl }: SharedDemoOptions) {
    return {
        id: "geolocation",
        title: intl.formatMessage({ id: "demos.geolocation.title" }),
        description: intl.formatMessage({ id: "demos.geolocation.description" }),
        tools: <Geolocation mapId={MAP_ID} />
    };
}

export function createSpatialBookmarksDemo({ intl }: SharedDemoOptions) {
    return {
        id: "spatialBookmarks",
        title: intl.formatMessage({ id: "demos.spatialBookmarks.title" }),
        description: intl.formatMessage({ id: "demos.spatialBookmarks.description" }),
        mainWidget: <SpatialBookmarks mapId={MAP_ID} />
    };
}

export function createPrintingDemo({ intl }: SharedDemoOptions) {
    return {
        id: "printing",
        title: intl.formatMessage({ id: "demos.printing.title" }),
        description: intl.formatMessage({ id: "demos.printing.description" }),
        mainWidget: <Printing mapId={MAP_ID} />
    };
}
