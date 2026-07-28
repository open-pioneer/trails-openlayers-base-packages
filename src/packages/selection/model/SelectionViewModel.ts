// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { computed, effect, linked, reactive, watchValue } from "@conterra/reactivity-core";
import {
    createLogger,
    destroyResources,
    isAbortError,
    Resource,
    shallowEqual,
    throwAbortError
} from "@open-pioneer/core";
import { MapModel, Overlay } from "@open-pioneer/map";
import { Extent } from "ol/extent";
import { Geometry } from "ol/geom";
import { sourceId } from "open-pioneer:source-info";
import { createElement } from "react";
import { SelectionResult, SelectionSource, SelectionSourceStatusObject } from "../api";
import { SelectionTooltipContent } from "../ui/SelectionTooltipContent";
import { ExtentSelection } from "./ExtentSelection";

const LOG = createLogger(sourceId);

const DEFAULT_MAX_RESULTS = 10000;

const ACTIVE_CLASS = "selection-active";
const INACTIVE_CLASS = "selection-inactive";

export interface Messages {
    active: string;
    inactive: string;
    noSource: string;
}

/**
 * Marker for a selection that has been cleared.
 * The cleared state (when the selected source has been "lost") should be sticky, a new source
 * should not be selected automatically.
 */
const CLEARED = Symbol("cleared");

export class SelectionViewModel {
    #map: MapModel;
    #messages: Messages;

    /** Limits the number of results from a source. */
    #maxResults: number;

    /** Called whenever results were obtained from a source. */
    #onComplete: (source: SelectionSource, results: SelectionResult[]) => void;

    /** Called whenever an error happens, to show a notification. */
    #onError: () => void;

    /** The set of available selection sources. */
    #sources = reactive<SelectionSource[]>([], { equal: shallowEqual });

    /**
     * The currently selected selection source (free choice within this.#sources).
     *
     * The state is linked to the set of sources:
     *
     * - while nothing has been selected yet, the first source is selected automatically
     * - if the current source is removed from the set of sources, the selection is cleared
     *
     * Once the selection has been cleared that way, it remains empty until a source is
     * selected explicitly again: later updates of the set of sources must not silently
     * re-enable the selection behind the user's back.
     */
    #currentSource = linked(
        () => this.#sources.value,
        (
            sources: SelectionSource[],
            previousSource: SelectionSource | typeof CLEARED | undefined
        ): SelectionSource | typeof CLEARED | undefined => {
            if (previousSource === CLEARED) {
                return CLEARED;
            }
            if (previousSource) {
                return sources.includes(previousSource) ? previousSource : CLEARED;
            }
            return sources[0];
        }
    );

    #active = computed(() => {
        const source = this.currentSource;
        return !!source && getSourceStatus(source).kind === "available";
    });

    #ariaMessage = computed(() => {
        const messages = this.#messages;
        if (!this.currentSource) {
            return messages.noSource;
        }
        if (!this.isActive) {
            return messages.inactive;
        }
        return messages.active;
    });

    // For debugging
    // oxlint-disable-next-line no-unused-private-class-members
    #currentSelection: ExtentSelection | undefined;

    // For debugging
    // oxlint-disable-next-line no-unused-private-class-members
    #tooltip: Overlay | undefined;

    /** The selection request that is currently running (if any). */
    #currentRequest: AbortController | undefined;

    /** Resources owned by this instance. */
    #resources: Resource[];

    constructor(options: {
        map: MapModel;
        messages: Messages;
        onComplete: (source: SelectionSource, results: SelectionResult[]) => void;
        onError: () => void;
        maxResults?: number;
    }) {
        this.#map = options.map;
        this.#messages = options.messages;
        this.#maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
        this.#onComplete = options.onComplete;
        this.#onError = options.onError;
        this.#resources = [this.#initSelection(), ...this.#initTooltip(), ...this.#initViewport()];
    }

    destroy() {
        this.#abortRequest();
        destroyResources(this.#resources);
    }

    get sources(): SelectionSource[] {
        return this.#sources.value;
    }

    set sources(newSources: SelectionSource[]) {
        this.#sources.value = newSources;
    }

    get currentSource(): SelectionSource | undefined {
        const source = this.#currentSource.value;
        return source === CLEARED ? undefined : source;
    }

    set currentSource(source: SelectionSource | undefined) {
        const sources = this.#sources.value;
        if (sources.length > 0) {
            if (!source) {
                throw new Error(
                    "Internal error: cannot select 'undefined' if there are sources present."
                );
            }
            if (!sources.includes(source)) {
                throw new Error("Internal error: cannot select unknown selection source.");
            }
            this.#currentSource.value = source;
        } else {
            if (source) {
                throw new Error(
                    "Internal error: can only select 'undefined' if there are no sources present."
                );
            }
            // Nothing can be selected; the current state is already empty.
        }
    }

    /** Returns true if the selection interaction is currently active. */
    get isActive(): boolean {
        return this.#active.value;
    }

    /** Aria message to represent the current state. Also serves as the tooltip text. */
    get ariaMessage(): string {
        return this.#ariaMessage.value;
    }

    /** Runs the selection while active. */
    #initSelection(): Resource {
        return watchValue(
            () => this.isActive,
            (isActive) => {
                if (!isActive) {
                    return;
                }

                const selection = (this.#currentSelection = new ExtentSelection(
                    this.#map,
                    (geometry) => this.#onGeometrySelected(geometry)
                ));
                return () => {
                    selection.destroy();
                    this.#abortRequest();
                };
            },
            {
                immediate: true
            }
        );
    }

    /**
     * Disables the viewport's context menu and marks the viewport
     * with css classes when selection is active or inactive.
     */
    #initViewport(): Resource[] {
        const viewport = this.#map.olMap.getViewport();
        const disableContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };
        viewport.addEventListener("contextmenu", disableContextMenu);

        return [
            {
                destroy() {
                    viewport.removeEventListener("contextmenu", disableContextMenu);
                }
            },
            effect(() => {
                const active = this.isActive;
                const className = active ? ACTIVE_CLASS : INACTIVE_CLASS;
                viewport.classList.add(className);
                return () => viewport.classList.remove(className);
            })
        ];
    }

    /**
     * Creates a tooltip that follows the cursor and updates the message depending on the current state.
     */
    #initTooltip(): Resource[] {
        const tooltip = (this.#tooltip = createHelpTooltip(this.#map));
        return [
            tooltip,
            watchValue(
                () => this.ariaMessage,
                (message) => {
                    // Aria message doubles as tooltip text at this time
                    const tooltipContent = createElement(SelectionTooltipContent, {
                        content: message
                    });
                    tooltip.setContent(tooltipContent);
                },
                { immediate: true }
            )
        ];
    }

    /**
     * Called after a successful selection on the map.
     * Triggers search on the currently selected selection source.
     */
    async #onGeometrySelected(geometry: Geometry) {
        const source = this.currentSource;
        if (!source) {
            return;
        }

        // Only the most recent selection is of interest; cancel the previous one (if any).
        const request = this.#startRequest();
        try {
            LOG.debug(`Starting selection on source '${source.label}'`);

            const extent = geometry.getExtent();
            const results = await this.#selectFromSource(source, extent, request.signal);
            if (request.signal.aborted) {
                // Superseded by another selection, or the widget is gone.
                throwAbortError();
            }

            LOG.debug(`Found ${results.length} results on source '${source.label}'`);
            this.#onComplete(source, results);
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error(`selection from source ${source.label} failed`, e);
                if (!request.signal.aborted) {
                    this.#onError();
                }
            }
        } finally {
            if (this.#currentRequest === request) {
                this.#currentRequest = undefined;
            }
        }
    }

    async #selectFromSource(source: SelectionSource, extent: Extent, signal: AbortSignal) {
        const map = this.#map;
        const maxResults = this.#maxResults;
        let results = await source.select(
            { type: "extent", extent },
            {
                maxResults,
                map: map,
                mapProjection: map.projection,
                signal
            }
        );
        if (results.length > maxResults) {
            results = results.slice(0, maxResults);
        }
        return results;
    }

    /** Starts a new selection request, cancelling the previous one (if any). */
    #startRequest(): AbortController {
        this.#abortRequest();
        return (this.#currentRequest = new AbortController());
    }

    /** Cancels the current selection request (if any); its results will be ignored. */
    #abortRequest(): void {
        this.#currentRequest?.abort();
        this.#currentRequest = undefined;
    }
}

/**
 * Normalizes the source's status into an object.
 */
export function getSourceStatus(source: SelectionSource): SelectionSourceStatusObject {
    const status = source.status;
    if (status == null) {
        return { kind: "available" };
    }
    if (typeof status == "string") {
        return { kind: status };
    }
    return status;
}

function createHelpTooltip(map: MapModel): Overlay {
    const overlay = map.overlays.add({
        position: "follow-pointer",
        offset: [15, 0],
        positioning: "center-left",
        ariaRole: "tooltip",
        className: "selection-tooltip printing-hide"
    });
    return overlay;
}
