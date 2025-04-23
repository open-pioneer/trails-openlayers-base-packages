// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Button, Flex } from "@open-pioneer/chakra-integration";
import { CoordinateInput, CoordinateSearch } from "@open-pioneer/coordinate-search";
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
import { NotificationService } from "@open-pioneer/notifier";
import { Printing } from "@open-pioneer/printing";
import { PackageIntl } from "@open-pioneer/runtime";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleSetter } from "@open-pioneer/scale-setter";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { SpatialBookmarks } from "@open-pioneer/spatial-bookmarks";
import { Coordinate } from "ol/coordinate";
import { Projection } from "ol/proj";
import { useState } from "react";
import { Demo, SharedDemoOptions } from "./Demo";

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

export function createCoordinateInputDemo({ intl, notificationService }: SharedDemoOptions): Demo {
    return {
        id: "coordinateInput",
        title: intl.formatMessage({ id: "demos.coordinateInput.title" }),
        createModel() {
            return {
                description: intl.formatRichMessage({ id: "demos.coordinateInput.description" }),
                mainWidget: (
                    <CoordinateInputComponent
                        notificationService={notificationService}
                        intl={intl}
                    />
                )
            };
        }
    };
}

function CoordinateInputComponent(props: {
    notificationService: NotificationService;
    intl: PackageIntl;
}) {
    const { notificationService, intl } = props;
    const [input, setInput] = useState<Coordinate | undefined>();
    function onCoordinateInput(coords: Coordinate, projection: Projection) {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage(
                { id: "demos.coordinateInput.entered" },
                { coordinates: coords.toString(), projection: projection.getCode() }
            ),
            displayDuration: 4000
        });
    }

    function onSearchCleared() {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage({ id: "demos.coordinateSearch.cleared" }),
            displayDuration: 4000
        });
        setInput(undefined);
    }

    return (
        <Flex direction={"column"} gap={10}>
            <CoordinateInput
                input={input}
                placeholder={intl.formatMessage({ id: "demos.coordinateInput.placeholder" })}
                onSelect={({ coords, projection }) => onCoordinateInput(coords, projection)}
                onClear={onSearchCleared}
                projections={[
                    {
                        label: "EPSG:25832",
                        value: "EPSG:25832"
                    },
                    {
                        label: "WGS 84",
                        value: "EPSG:4326"
                    },
                    {
                        label: "Web Mercator",
                        value: "EPSG:3857"
                    },
                    {
                        label: "EPSG:25833",
                        value: "EPSG:25833"
                    },
                    {
                        label: "EPSG:31466",
                        value: "EPSG:31466"
                    },
                    {
                        label: "EPSG:31467",
                        value: "EPSG:31467"
                    },
                    {
                        label: "EPSG:3035",
                        value: "EPSG:3035"
                    }
                ]}
            />
            <Button
                onClick={() => {
                    setInput([761166, 6692084]);
                }}
            >
                {intl.formatMessage({ id: "demos.coordinateInput.setInput" })}
            </Button>
        </Flex>
    );
}

export function createCoordinateSearchDemo({ intl, notificationService }: SharedDemoOptions): Demo {
    return {
        id: "coordinateSearch",
        title: intl.formatMessage({ id: "demos.coordinateSearch.title" }),
        createModel() {
            return {
                description: intl.formatRichMessage({ id: "demos.coordinateSearch.description" }),
                mainWidget: (
                    <CoordinateSearchComponent
                        notificationService={notificationService}
                        intl={intl}
                    />
                )
            };
        }
    };
}

function CoordinateSearchComponent(props: {
    notificationService: NotificationService;
    intl: PackageIntl;
}) {
    const { notificationService, intl } = props;
    function onCoordinateSearch(coords: Coordinate, projection: Projection) {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage(
                { id: "demos.coordinateSearch.entered" },
                { coordinates: coords.toString(), projection: projection.getCode() }
            ),
            displayDuration: 4000
        });
    }

    function onSearchCleared() {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage({ id: "demos.coordinateSearch.cleared" }),
            displayDuration: 4000
        });
    }

    return (
        <Flex direction={"column"} gap={10}>
            <CoordinateSearch
                onSelect={({ coords, projection }) => onCoordinateSearch(coords, projection)}
                onClear={onSearchCleared}
                projections={[
                    {
                        label: "EPSG:25832",
                        value: "EPSG:25832"
                    },
                    {
                        label: "WGS 84",
                        value: "EPSG:4326"
                    },
                    {
                        label: "Web Mercator",
                        value: "EPSG:3857"
                    },
                    {
                        label: "EPSG:25833",
                        value: "EPSG:25833"
                    },
                    {
                        label: "EPSG:31466",
                        value: "EPSG:31466"
                    },
                    {
                        label: "EPSG:31467",
                        value: "EPSG:31467"
                    },
                    {
                        label: "EPSG:3035",
                        value: "EPSG:3035"
                    }
                ]}
            />
        </Flex>
    );
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
