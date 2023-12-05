// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Geometry } from "ol/geom";
import { Projection } from "ol/proj";
import { Extent } from "ol/extent";
import { EventSource } from "@open-pioneer/core";

export type SelectionSourceStatus = "available" | "unavailable" | (string & {});

export interface SelectionResult {
    /* Identifier for the result object.
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
     * This property allows the source to fetch no more results than necessary.
     */
    maxResults: number;

    /**
     * The current projection of the map.
     * Useful to return the selection result's geometry in the suitable projection, should they differ.
     */
    mapProjection: Projection;
}

/** Events emitted by the {@link SelectionSource}. */
export interface SelectionSourceEvents {
    "changed:status": void;
}

/** Optional base type for selection source: the event emitter interface is not required. */
export type SelectionSourceEventBase = EventSource<SelectionSourceEvents>;

/**
 * An object that allows spatial selection.
 *
 * Developers can create classes that implement this interface for different selection sources.
 *
 * The implementation of `SelectionSourceEventBase` is optional: it is only necessary if the status changes
 * during the lifetime of the selection source.
 * To implement the event, you can write `class MySelectionSource extends EventEmitter<SelectionSourceEvents>`.
 *
 */
export interface SelectionSource extends Partial<SelectionSourceEventBase> {
    /**
     * The label of this source.
     *
     * This will be displayed by the user interface when TODO
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
     * Performs a selection and returns a list of selection results.
     *
     * Implementations should return the results ordered by priority (best match first), if possible.
     *
     * TODO: Reconsider name?
     * @param selectionKind: The geometry with which to perform the spatial selection. Currently only
     * an extent is supported.
     */
    select(selectionKind: Extent, options: SelectionOptions): Promise<SelectionResult[]>;
}
