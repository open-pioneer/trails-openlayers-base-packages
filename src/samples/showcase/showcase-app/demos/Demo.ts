// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { HttpService } from "@open-pioneer/http";
import { MapModel } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { VectorSelectionSourceFactory } from "@open-pioneer/selection/services";
import { ReactNode } from "react";
// import {
//     createCoordinateViewerDemo,
//     createCoordinateInputDemo,
//     createCoordinateSearchDemo,
//     createGeolocationDemo,
//     createMapNavigationDemo,
//     createMeasurementDemo,
//     createPrintingDemo,
//     createScaleBarDemo,
//     createScaleSetterDemo,
//     createScaleViewerDemo,
//     createSpatialBookmarksDemo
// } from "./SimpleDemos";
import { createTocAndLegendDemo } from "./TocLegendDemo";
// import { createSelectionDemo } from "./SelectionDemo";
// import { createEditingDemo } from "./EditingDemo";
import { EditingService } from "@open-pioneer/editing";
import { NotificationService } from "@open-pioneer/notifier";
import {
    createCoordinateViewerDemo,
    createGeolocationDemo,
    createMapNavigationDemo,
    createMeasurementDemo,
    createOverviewMapDemo,
    createPrintingDemo,
    createScaleBarDemo,
    createScaleSetterDemo,
    createScaleViewerDemo,
    createSpatialBookmarksDemo
} from "./MigratedDemos";

export interface DemoInfo {
    /** Unique id */
    id: string;

    /** Human readable (and translated) title */
    title: string;
}

export interface Demo extends DemoInfo {
    /** Called by the application (and then rendered) when the demo is active. */
    createModel(): DemoModel;
}

export interface DemoModel {
    /** Human readable description */
    description: ReactNode;

    /** Main widget to display in the app. */
    mainWidget?: ReactNode;

    /** Mounted at the bottom of the map. */
    listContainer?: ReactNode;

    /**
     * Tools that are shown next to the zoom buttons on the map.
     */
    tools?: ReactNode;

    /** Cleanup any state used by the demo. Called when the demo is deselected in the application. */
    destroy?(): void;
}

export interface SharedDemoOptions {
    intl: PackageIntl;
    httpService: HttpService;
    mapModel: MapModel;
    vectorSelectionSourceFactory: VectorSelectionSourceFactory;
    editingService: EditingService;
    notificationService: NotificationService;
}

export function createDemos(options: SharedDemoOptions): Demo[] {
    return [
        // TODO
        createTocAndLegendDemo(options),
        createCoordinateViewerDemo(options),
        // createCoordinateInputDemo(options),
        // createCoordinateSearchDemo(options),
        createScaleViewerDemo(options),
        createScaleSetterDemo(options),
        createScaleBarDemo(options),
        createMeasurementDemo(options),
        // createEditingDemo(options),
        createMapNavigationDemo(options),
        createGeolocationDemo(options),
        createSpatialBookmarksDemo(options),
        createOverviewMapDemo(options),
        createPrintingDemo(options)
        // createSelectionDemo(options),
        // createSearchAndHighlightDemo(options)
    ];
}
