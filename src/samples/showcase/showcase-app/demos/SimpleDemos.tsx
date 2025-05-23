// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Geolocation } from "@open-pioneer/geolocation";
import {
    HistoryBackward,
    HistoryForward,
    InitialExtent,
    ZoomIn,
    ZoomOut
} from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import { Printing } from "@open-pioneer/printing";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleSetter } from "@open-pioneer/scale-setter";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { Demo, SharedDemoOptions } from "./Demo";
import { OverviewMap } from "@open-pioneer/overview-map";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";

export function createCoordinateViewerDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "coordinateViewer",
        title: intl.formatMessage({ id: "demos.coordinateViewer.title" }),
        createModel() {
            return {
                description: intl.formatRichMessage({ id: "demos.coordinateViewer.description" }),
                mainWidget: <CoordinateViewer />
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
                description: intl.formatRichMessage({ id: "demos.geolocation.description" }),
                tools: <Geolocation />
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
                description: intl.formatRichMessage({ id: "demos.mapNavigation.description" }),
                tools: (
                    <>
                        <ZoomIn />
                        <ZoomOut />
                        <HistoryBackward />
                        <HistoryForward />
                        <InitialExtent />
                    </>
                )
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
                description: intl.formatRichMessage({ id: "demos.measurement.description" }),
                mainWidget: <Measurement />
            };
        }
    };
}

export function createOverviewMapDemo({ intl }: SharedDemoOptions): Demo {
    return {
        id: "overviewMap",
        title: intl.formatMessage({ id: "demos.overviewMap.title" }),
        createModel() {
            const overviewMapLayer = new TileLayer({
                source: new OSM()
            });

            return {
                description: intl.formatRichMessage({ id: "demos.overviewMap.description" }),
                mainWidget: <OverviewMap olLayer={overviewMapLayer} />,
                destroy() {
                    overviewMapLayer.dispose();
                }
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
                description: intl.formatRichMessage({ id: "demos.printing.description" }),
                mainWidget: <Printing />
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
                description: intl.formatRichMessage({ id: "demos.scaleBar.description" }),
                tools: <ScaleBar />
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
                description: intl.formatRichMessage({ id: "demos.scaleViewer.description" }),
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
                description: intl.formatRichMessage({ id: "demos.scaleSetter.description" }),
                mainWidget: <ScaleSetter />
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
                description: intl.formatRichMessage({ id: "demos.spatialBookmarks.description" }),
                mainWidget: <SpatialBookmarks />
            };
        }
    };
}
