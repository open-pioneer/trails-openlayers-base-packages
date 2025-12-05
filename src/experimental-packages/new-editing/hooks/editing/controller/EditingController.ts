// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { HighlightOptions, MapModel } from "@open-pioneer/map";
import type { Vector as VectorSource } from "ol/source";

import { CompositeInteraction } from "../base/CompositeInteraction";
import type { EditingInteraction } from "../base/EditingInteraction";

import {
    DrawingInteraction,
    type DrawingOptions,
    type DrawOptions
} from "../interactions/DrawingInteraction";

import {
    SelectionInteraction,
    type SelectionOptions,
    type SelectOptions
} from "../interactions/SelectionInteraction";

import {
    ModificationInteraction,
    type ModificationOptions,
    type ModifyOptions
} from "../interactions/ModificationInteraction";

import { DoubleClickInteraction } from "../interactions/DoubleClickInteraction";
import { HighlightingInteraction } from "../interactions/HighlightingInteraction";
import { KeyboardInteraction } from "../interactions/KeyboardInteraction";
import { SnappingInteraction, type SnapOptions } from "../interactions/SnappingInteraction";

import { EditingSession } from "./EditingSession";
import type { EditingState } from "../../../model/EditingState";

export class EditingController {
    constructor(private readonly mapModel: MapModel) {}

    startDrawingFeature({
        geometryType,
        drawOptions,
        completionHandler
    }: StartDrawingFeatureOptions): void {
        this.replaceInteraction(
            new DrawingInteraction(this.mapModel, {
                geometryType,
                tracker: this.editingSession,
                drawOptions: { ...drawOptions, ...this.interactionOptions.drawOptions },
                completionHandler
            }),
            new KeyboardInteraction(this.mapModel, {
                operator: this.editingSession
            }),
            new SnappingInteraction(this.mapModel, {
                snappingSources: this.snappingSources,
                snapOptions: this.interactionOptions.snapOptions
            }),
            new DoubleClickInteraction(this.mapModel)
        );
    }

    startSelectingFeature({ layers, completionHandler }: StartSelectingFeatureOptions): void {
        this.replaceInteraction(
            new SelectionInteraction(this.mapModel, {
                layers,
                selectOptions: this.interactionOptions.selectOptions,
                completionHandler
            })
        );
    }

    startModifyingFeature({ feature, drawLayer }: StartModifyingFeatureOptions): void {
        this.replaceInteraction(
            new ModificationInteraction(this.mapModel, {
                feature,
                drawLayer,
                modifyOptions: this.interactionOptions.modifyOptions
            }),
            new HighlightingInteraction(this.mapModel, {
                feature,
                highlightOptions: this.interactionOptions.highlightOptions
            }),
            new SnappingInteraction(this.mapModel, {
                snappingSources: this.snappingSources,
                snapOptions: this.interactionOptions.snapOptions
            })
        );
    }

    setSnappingSources(sources: VectorSource[] | undefined): void {
        this.snappingSources = sources ?? [];
    }

    setInteractionOptions(options: InteractionOptions): void {
        this.interactionOptions = options;
    }

    stopCurrentInteraction(): void {
        this.currentInteraction?.stop();
        this.currentInteraction = undefined;
    }

    get editingState(): EditingState {
        return this.editingSession;
    }

    private replaceInteraction(...interactions: EditingInteraction[]): void {
        this.currentInteraction?.stop();
        this.currentInteraction = new CompositeInteraction(interactions);
        this.currentInteraction.start();
    }

    private currentInteraction: EditingInteraction | undefined;
    private snappingSources: VectorSource[] = [];
    private interactionOptions: InteractionOptions = {};

    private readonly editingSession = new EditingSession();
}

export interface InteractionOptions {
    readonly drawOptions?: DrawOptions;
    readonly selectOptions?: SelectOptions;
    readonly modifyOptions?: ModifyOptions;
    readonly snapOptions?: SnapOptions;
    readonly highlightOptions?: HighlightOptions;
}

export type { DrawOptions, SelectOptions, ModifyOptions, SnapOptions, HighlightOptions };

type StartDrawingFeatureOptions = Required<Omit<DrawingOptions, "tracker">>;
type StartSelectingFeatureOptions = Pick<SelectionOptions, "layers" | "completionHandler">;
type StartModifyingFeatureOptions = Pick<ModificationOptions, "feature" | "drawLayer">;
