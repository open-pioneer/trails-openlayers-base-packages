// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Geometry } from "ol/geom";
import type { Projection } from "ol/proj";
import type { Extent } from "ol/extent";
import type { Resource } from "@open-pioneer/core";
import { BaseFeature } from "@open-pioneer/map";
import { DeclaredService } from "@open-pioneer/runtime";
import VectorLayer from "ol/layer/Vector";
import Feature from "ol/Feature";
import VectorSource from "ol/source/Vector";

/**
 * The status of a selection source.
 *
 * This is used to indicate whether the source is ready for selection.
 */
export type SelectionSourceStatus = "available" | "unavailable" | SelectionSourceStatusObject;

/**
 * Advanced form of the {@link SelectionSourceStatus} that allows providing a reason why the source is not available.
 */
export type SelectionSourceStatusObject =
    | { kind: "available" }
    | {
          kind: "unavailable";

          /**
           * If the status of this source is unavailable, the reason for this can be stored here.
           *
           * This will be displayed by the user interface.
           *
           * If it is not defined, a default message will be displayed instead.
           */
          reason?: string;
      };

/**
 * Represents a result returned by a spatial selection.
 */
export interface SelectionResult extends BaseFeature {
    /**
     * Geometry of the selection result.
     * One should also specify the {@link projection}.
     */
    geometry: Geometry;
}

/** Options passed to a {@link SelectionSource} when triggering a select. */
export interface SelectionOptions {
    /**
     * The maximum number of selection results to request.
     * The selection component currently only supports a certain amount of results (indicated by this value).
     * If a source results more than `maxResults` results, additional results will be ignored.
     */
    maxResults: number;

    /**
     * The current projection of the map.
     * Useful to return the selection result's geometry in the suitable projection, should they differ.
     */
    mapProjection: Projection;

    /**
     * The signal can be used to detect cancellation.
     *
     * You can pass this signal to builtin functions like `fetch` that automatically
     * support cancellation.
     */
    signal: AbortSignal;
}

/**
 * The user has selected an extent.
 */
export interface ExtentSelection {
    type: "extent";
    extent: Extent;
}

/**
 * The selection made by the user.
 *
 * This is currently always `type: "extent"`, but additional selection kinds
 * may be added in the future.
 *
 * Selection sources should check the `type` and throw an error for unsupported
 * selection kinds in order to remain forwards compatible.
 */
export type SelectionKind = ExtentSelection;

/**
 * An object that allows spatial selection.
 *
 * Developers can create classes that implement this interface for different selection sources.
 */
export interface SelectionSource {
    /**
     * The label of this source.
     *
     * This will be displayed by the user interface during selection source selection.
     */
    readonly label: string;

    /**
     * The optional status of this source. If there is no status defined, it is assumed that the
     * source is always available.
     *
     * This will be displayed by the user interface.
     *
     * This value can be reactive; changes will be reflected in the UI.
     */
    readonly status?: SelectionSourceStatus;

    /**
     * Performs a selection and returns a list of selection results.
     *
     * Implementations should return the results ordered by priority (best match first), if possible.
     *
     * @param selectionKind The geometry with which to perform the spatial selection. Currently only
     * an extent is supported.
     * @param options see interface documentation {@link SelectionOptions}
     */
    select(selectionKind: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]>;
}

export interface VectorLayerSelectionSourceOptions {
    vectorLayer: VectorLayer<VectorSource, Feature>;
    label: string;
}

export interface VectorLayerSelectionSource extends Required<SelectionSource>, Resource {}

/**
 * A factory that creates {@link VectorLayerSelectionSource | selection sources} to be used on an
 * OpenLayers VectorLayer with an OpenLayers VectorSource (e.g. layer of the map).
 *
 * Use the interface name `"selection.VectorSelectionSourceFactory"` to obtain an instance of this factory.
 */
export interface VectorLayerSelectionSourceFactory
    extends DeclaredService<"selection.VectorSelectionSourceFactory"> {
    /**
     * Returns a new {@link VectorLayerSelectionSource} that operates on the given OpenLayers VectorLayer.
     */
    createSelectionSource(options: VectorLayerSelectionSourceOptions): VectorLayerSelectionSource;
}
