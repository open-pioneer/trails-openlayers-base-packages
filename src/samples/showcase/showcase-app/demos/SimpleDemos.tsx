// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed } from "@conterra/reactivity-core";
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
import { FormattedRichMessage } from "@open-pioneer/react-utils";

export function createCoordinateViewerDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "coordinateViewer",
        title: computed(() =>
            currentIntl.value.formatMessage({ id: "demos.coordinateViewer.title" })
        ),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage
                        intl={currentIntl}
                        id="demos.coordinateViewer.description"
                    />
                ),
                mainWidget: <CoordinateViewer />
            };
        }
    };
}

export function createGeolocationDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "geolocation",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.geolocation.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.geolocation.description" />
                ),
                tools: <Geolocation />
            };
        }
    };
}

export function createMapNavigationDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "mapNavigation",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.mapNavigation.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.mapNavigation.description" />
                ),
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

export function createMeasurementDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "measurement",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.measurement.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.measurement.description" />
                ),
                mainWidget: <Measurement />
            };
        }
    };
}

export function createOverviewMapDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "overviewMap",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.overviewMap.title" })),
        createModel() {
            const overviewMapLayer = new TileLayer({
                source: new OSM()
            });

            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.overviewMap.description" />
                ),
                mainWidget: <OverviewMap olLayer={overviewMapLayer} />,
                destroy() {
                    overviewMapLayer.dispose();
                }
            };
        }
    };
}

export function createPrintingDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "printing",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.printing.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.printing.description" />
                ),
                mainWidget: <Printing />
            };
        }
    };
}

export function createScaleBarDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "scaleBar",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.scaleBar.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.scaleBar.description" />
                ),
                tools: <ScaleBar />
            };
        }
    };
}

export function createScaleViewerDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "scaleViewer",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.scaleViewer.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.scaleViewer.description" />
                ),
                mainWidget: <ScaleViewer />
            };
        }
    };
}

export function createScaleSetterDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "scaleSetter",
        title: computed(() => currentIntl.value.formatMessage({ id: "demos.scaleSetter.title" })),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage intl={currentIntl} id="demos.scaleSetter.description" />
                ),
                mainWidget: <ScaleSetter />
            };
        }
    };
}

export function createSpatialBookmarksDemo({ currentIntl }: SharedDemoOptions): Demo {
    return {
        id: "spatialBookmarks",
        title: computed(() =>
            currentIntl.value.formatMessage({ id: "demos.spatialBookmarks.title" })
        ),
        createModel() {
            return {
                description: (
                    <FormattedRichMessage
                        intl={currentIntl}
                        id="demos.spatialBookmarks.description"
                    />
                ),
                mainWidget: <SpatialBookmarks />
            };
        }
    };
}
