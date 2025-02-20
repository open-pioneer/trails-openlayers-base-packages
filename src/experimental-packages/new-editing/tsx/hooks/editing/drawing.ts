// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { DoubleClickZoom, Draw } from "ol/interaction";
import { Vector as VectorLayer, type Layer } from "ol/layer";
import { unByKey } from "ol/Observable";
import { Vector as VectorSource } from "ol/source";

import type { Feature, Map } from "ol";
import type { Type as GeometryType } from "ol/geom/Geometry";

import { startSnapping, type StartSnappingOptions } from "./snapping";
import { addKeyboardListener, removeKeyboardListener } from "./keyboard";
import type {
    EditingActionHandler,
    EditingActions,
    EditingTracker
} from "../actions/useEditingActions";
import type { DrawOptions } from "../../model/FeatureTemplate";

export function startDrawingFeature(options: StartDrawingFeatureOptions): CleanUpAction {
    const removeDrawInteraction = addDrawInteraction(options);
    const removeKeyboardShortcuts = addKeyboardShortcuts(options);
    const stopSnapping = startSnapping(options);

    return () => {
        removeDrawInteraction();
        removeKeyboardShortcuts();
        stopSnapping();
    };
}

function addDrawInteraction({
    map,
    geometryType,
    drawOptions,
    tracker,
    actionHandler,
    completionHandler
}: StartDrawingFeatureOptions): CleanUpAction {
    const source = new VectorSource();
    const drawLayer = new VectorLayer({ source });
    const draw = new Draw({ source, type: geometryType, ...drawOptions });

    const eventsKeys = [
        draw.on("drawstart", ({ feature }) => tracker.trackCapabilities(feature)),
        draw.on("drawabort", () => tracker.untrackCapabilities()),
        draw.once("drawend", ({ feature }) => completionHandler(feature, drawLayer))
    ];

    actionHandler.onFinishDrawing = () => draw.finishDrawing();
    actionHandler.onAbortDrawing = () => draw.abortDrawing();
    actionHandler.onUndo = () => draw.removeLastPoint();
    actionHandler.onRedo = (coordinate) => draw.appendCoordinates([coordinate]);

    map.addLayer(drawLayer);
    map.addInteraction(draw);

    const wasEnabled = setDoubleClickZoomEnabled(map, false);

    return () => {
        unByKey(eventsKeys);
        tracker.untrackCapabilities();

        actionHandler.onFinishDrawing = undefined;
        actionHandler.onAbortDrawing = undefined;
        actionHandler.onUndo = undefined;
        actionHandler.onRedo = undefined;

        map.removeInteraction(draw);
        map.removeLayer(drawLayer);

        setDoubleClickZoomEnabled(map, wasEnabled ?? true);
    };
}

function addKeyboardShortcuts({ actions }: StartDrawingFeatureOptions): CleanUpAction {
    const keyboardListener = addKeyboardListener([
        { key: "Enter", action: actions.finishDrawing },
        { key: "Escape", action: actions.abortDrawing },
        { key: "Z", ctrlKey: true, action: actions.undo },
        { key: "Z", ctrlKey: true, shiftKey: true, action: actions.redo },
        { key: "Y", ctrlKey: true, action: actions.redo }
    ]);

    return () => {
        removeKeyboardListener(keyboardListener);
    };
}

// A double-click is used to finish drawing a feature. Hence, allow for disabling the double-click
// zoom interaction, which would otherwise be triggered along with it.
function setDoubleClickZoomEnabled(map: Map, enabled: boolean): boolean | undefined {
    const doubleClickZoom = map
        .getInteractions()
        .getArray()
        .find((interaction) => interaction instanceof DoubleClickZoom);
    const isEnabled = doubleClickZoom?.getActive();
    doubleClickZoom?.setActive(enabled);
    return isEnabled;
}

interface StartDrawingFeatureOptions extends StartSnappingOptions {
    readonly map: Map;
    readonly geometryType: GeometryType;
    readonly drawOptions: DrawOptions | undefined;
    readonly actions: EditingActions;
    readonly tracker: EditingTracker;
    readonly actionHandler: EditingActionHandler;
    readonly completionHandler: CompletionHandler;
}

type CompletionHandler = (feature: Feature, drawLayer: Layer) => void;
type CleanUpAction = () => void;
