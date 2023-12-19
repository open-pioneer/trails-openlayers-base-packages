// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { Geometry } from "ol/geom";
import type { Projection } from "ol/proj";
import type { Extent } from "ol/extent";
import type { EventSource } from "@open-pioneer/core";

/**
 * The status of a selection source.
 *
 * This is used to indicate whether the source is ready for selection.
 */
export type SelectionSourceStatus = "available" | "unavailable";

/**
 * Represents a result returned by a spatial selection.
 */
export interface SelectionResult {
    /**
     * Identifier for the result object.
     * Values used here should be unique within the context of the selection source that returns them.
     *
     * If your source cannot provide a useful id on its own, another strategy to generate unique ids is to
     * generate a [UUID](https://www.npmjs.com/package/uuid#uuidv4options-buffer-offset) instead.
     */
    id: number | string;

    /**
     * Geometry of the selection result.
     * One should also specify the {@link projection}.
     */
    geometry: Geometry;

    /**
     * The projection of the {@link geometry}.
     */
    projection?: string;

    /**
     * Arbitrary additional properties.
     */
    properties?: Readonly<Record<string, unknown>>;
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

/** Events emitted by the {@link SelectionSource}. */
export interface SelectionSourceEvents {
    "changed:status": void;
}

/** Optional base type for selection source: the event emitter interface is not required. */
export type SelectionSourceEventBase = EventSource<SelectionSourceEvents>;

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
 * This us currently always `type: "extent"`, but additional selection kinds
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
 *
 * The implementation of `SelectionSourceEventBase` is optional: it is only necessary if the status changes
 * during the lifetime of the selection source.
 * To implement events, you can write `class MySelectionSource extends EventEmitter<SelectionSourceEvents>`.
 *
 */
export interface SelectionSource extends Partial<SelectionSourceEventBase> {
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
     */
    readonly status?: SelectionSourceStatus;

    /**
     * If the status of this source is unavailable, the reason for this can be stored here.
     *
     * This will be displayed by the user interface.
     */
    // TODO: Maybe rename to just reason?
    readonly unavailableStatusReason?: string;

    /**
     * Performs a selection and returns a list of selection results.
     *
     * Implementations should return the results ordered by priority (best match first), if possible.
     *
     * @param selectionKind: The geometry with which to perform the spatial selection. Currently only
     * an extent is supported.
     */
    select(selection: SelectionKind, options: SelectionOptions): Promise<SelectionResult[]>;
}
