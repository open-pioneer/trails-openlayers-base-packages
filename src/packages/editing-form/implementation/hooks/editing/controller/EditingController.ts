// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { MapModel } from "@open-pioneer/map";
import type { Vector as VectorSource } from "ol/source";

import { DrawingInteraction, type DrawingParameters } from "../interactions/DrawingInteraction";

import {
    SelectionInteraction,
    type SelectionParameters
} from "../interactions/SelectionInteraction";

import {
    ModificationInteraction,
    type ModificationParameters
} from "../interactions/ModificationInteraction";

import { DoubleClickInteraction } from "../interactions/DoubleClickInteraction";
import { HighlightingInteraction } from "../interactions/HighlightingInteraction";
import { KeyboardInteraction } from "../interactions/KeyboardInteraction";
import { SnappingInteraction } from "../interactions/SnappingInteraction";

import { DrawingSession } from "./DrawingSession";
import type { DrawingState } from "../../../../api/model/DrawingState";
import type { InteractionOptions } from "../../../../api/model/InteractionOptions";
import { BaseInteraction } from "../interactions/BaseInteraction";

export class EditingController {
    constructor(private readonly mapModel: MapModel) {}

    startDrawingFeature({
        geometryType,
        drawingOptions,
        completionHandler
    }: StartDrawingFeatureOptions): void {
        this.replaceInteractions(
            new DrawingInteraction(this.mapModel, {
                geometryType,
                tracker: this.drawingSession,
                drawingOptions: { ...this.interactionOptions.drawingOptions, ...drawingOptions },
                completionHandler
            }),
            new KeyboardInteraction(this.mapModel, {
                actions: this.drawingSession
            }),
            new SnappingInteraction(this.mapModel, {
                snappingSources: this.snappingSources,
                snappingOptions: this.interactionOptions.snappingOptions
            }),
            new DoubleClickInteraction(this.mapModel)
        );
    }

    startSelectingFeature({ layers, completionHandler }: StartSelectingFeatureOptions): void {
        this.replaceInteractions(
            new SelectionInteraction(this.mapModel, {
                layers,
                selectionOptions: this.interactionOptions.selectionOptions,
                completionHandler
            })
        );
    }

    startModifyingFeature({ feature, drawLayer }: StartModifyingFeatureOptions): void {
        this.replaceInteractions(
            new ModificationInteraction(this.mapModel, {
                feature,
                drawLayer,
                modificationOptions: this.interactionOptions.modificationOptions
            }),
            new HighlightingInteraction(this.mapModel, {
                feature,
                highlightOptions: this.interactionOptions.highlightingOptions
            }),
            new SnappingInteraction(this.mapModel, {
                snappingSources: this.snappingSources,
                snappingOptions: this.interactionOptions.snappingOptions
            })
        );
    }

    setSnappingSources(sources: VectorSource[] | undefined): void {
        this.snappingSources = sources ?? [];
    }

    setInteractionOptions(options: InteractionOptions): void {
        this.interactionOptions = options;
    }

    stopCurrentInteractions(): void {
        this.currentInteractions.forEach((interaction) => {
            interaction.stop();
        });
        this.currentInteractions = [];
    }

    get drawingState(): DrawingState {
        return this.drawingSession;
    }

    private replaceInteractions(...interactions: BaseInteraction<unknown, unknown>[]): void {
        this.stopCurrentInteractions();
        this.currentInteractions = interactions;
        this.currentInteractions.forEach((interaction) => {
            interaction.start();
        });
    }

    private currentInteraction: EditingInteraction | undefined;
    private snappingSources: VectorSource[] = [];
    private interactionOptions: InteractionOptions = {};

    private readonly drawingSession = new DrawingSession();
}

type StartDrawingFeatureOptions = Required<Omit<DrawingParameters, "tracker">>;
type StartSelectingFeatureOptions = Pick<SelectionParameters, "layers" | "completionHandler">;
type StartModifyingFeatureOptions = Pick<ModificationParameters, "feature" | "drawLayer">;
