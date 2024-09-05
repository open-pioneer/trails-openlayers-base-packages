// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import { Printing } from "@open-pioneer/printing";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { ScaleSetter } from "@open-pioneer/scale-setter";
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { Demo, SharedDemoOptions } from "./Demo";

export function createCoordinateViewerDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "coordinateViewer",
        title: intl.formatMessage({ id: "demos.coordinateViewer.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.coordinateViewer.description" }),
                mainWidget: <CoordinateViewer />
            };
        }
    };
}

export function createScaleViewerDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "scaleViewer",
        title: intl.formatMessage({ id: "demos.scaleViewer.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.scaleViewer.description" }),
                mainWidget: <ScaleViewer />
            };
        }
    };
}

export function createScaleSetterDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "scaleSetter",
        title: intl.formatMessage({ id: "demos.scaleSetter.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.scaleSetter.description" }),
                mainWidget: <ScaleSetter />
            };
        }
    };
}

export function createScaleBarDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "scaleBar",
        title: intl.formatMessage({ id: "demos.scaleBar.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.scaleBar.description" }),
                tools: <ScaleBar />
            };
        }
    };
}

export function createMeasurementDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "measurement",
        title: intl.formatMessage({ id: "demos.measurement.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.measurement.description" }),
                mainWidget: <Measurement />
            };
        }
    };
}

export function createMapNavigationDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "mapNavigation",
        title: intl.formatMessage({ id: "demos.mapNavigation.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.mapNavigation.description" }),
                tools: (
                    <>
                        <ZoomIn />
                        <ZoomOut />
                        <InitialExtent />
                    </>
                )
            };
        }
    };
}

export function createGeolocationDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "geolocation",
        title: intl.formatMessage({ id: "demos.geolocation.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.geolocation.description" }),
                tools: <Geolocation />
            };
        }
    };
}

export function createSpatialBookmarksDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "spatialBookmarks",
        title: intl.formatMessage({ id: "demos.spatialBookmarks.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.spatialBookmarks.description" }),
                mainWidget: <SpatialBookmarks />
            };
        }
    };
}

export function createPrintingDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "printing",
        title: intl.formatMessage({ id: "demos.printing.title" }),
        createModel() {
            return {
                description: intl.formatMessage({ id: "demos.printing.description" }),
                mainWidget: <Printing />
            };
        }
    };
}
