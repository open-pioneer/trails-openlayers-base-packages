// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, effect, reactive, watchValue } from "@conterra/reactivity-core";
import { createLogger, destroyResources, isAbortError, Resource } from "@open-pioneer/core";
import { MapModel } from "@open-pioneer/map";
import { Geometry } from "ol/geom";
import { SelectionResult, SelectionSource, SelectionSourceStatusObject } from "../api";
import { ExtentSelection } from "./ExtentSelection";
import { Extent } from "ol/extent";
import Overlay from "ol/Overlay";
import { unByKey } from "ol/Observable";

const LOG = createLogger("selection:SelectionViewModel");

const DEFAULT_MAX_RESULTS = 10000;

const ACTIVE_CLASS = "selection-active";
const INACTIVE_CLASS = "selection-inactive";

export interface Messages {
    active: string;
    inactive: string;
    noSource: string;
}

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
    #sources = reactive<SelectionSource[]>([]);

    /** The currently selected selection source (free choice within this.#sources). */
    #currentSource = reactive<SelectionSource>();
    #active = computed(() => {
        const source = this.#currentSource.value;
        return !!source && getSourceStatus(source).kind === "available";
    });
    #ariaMessage = computed(() => {
        if (!this.currentSource) {
            return this.#messages.noSource;
        }
        if (!this.isActive) {
            return this.#messages.inactive;
        }
        return this.#messages.active;
    });

    // For debugging
    // eslint-disable-next-line no-unused-private-class-members
    #currentSelection: ExtentSelection | undefined;

    // For debugging
    // eslint-disable-next-line no-unused-private-class-members
    #tooltip: Tooltip | undefined;

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
        destroyResources(this.#resources);
    }

    get sources(): SelectionSource[] {
        return this.#sources.value;
    }

    set sources(newSources: SelectionSource[]) {
        this.#sources.value = newSources;

        // Reset current source if necessary
        const oldSource = this.#currentSource.value;
        if (oldSource) {
            if (!newSources.includes(oldSource)) {
                // Reset to undefined if the current source is not in the list of sources
                this.#currentSource.value = undefined;
            }
        } else {
            this.#currentSource.value = newSources[0];
        }
    }

    get currentSource(): SelectionSource | undefined {
        return this.#currentSource.value;
    }

    set currentSource(source: SelectionSource | undefined) {
        if (this.#sources.value.length > 0) {
            if (!source) {
                throw new Error(
                    "Internal error: cannot select 'undefined' if there are sources present."
                );
            }
            if (!this.#sources.value.includes(source)) {
                throw new Error("Internal error: cannot select unknown selection source.");
            }
        } else {
            if (source) {
                throw new Error(
                    "Internal error: can only select 'undefined' if there are no sources present."
                );
            }
        }
        this.#currentSource.value = source;
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
                return () => selection.destroy();
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
        const disableContextMenu = (e: PointerEvent) => {
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
                    tooltip.setText(message);
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
        const source = this.#currentSource.value;
        if (!source) {
            return;
        }

        try {
            LOG.debug(`Starting selection on source '${source.label}'`);

            const extent = geometry.getExtent();
            if (!extent) {
                return undefined;
            }

            const results = await this.#selectFromSource(source, extent);
            LOG.debug(`Found ${results.length} results on source '${source.label}'`);
            this.#onComplete(source, results);
        } catch (e) {
            if (!isAbortError(e)) {
                LOG.error(`selection from source ${source.label} failed`, e);
                this.#onError();
            }
        }
    }

    async #selectFromSource(source: SelectionSource, extent: Extent) {
        const map = this.#map;
        const maxResults = this.#maxResults;
        let results = await source.select(
            { type: "extent", extent },
            {
                maxResults,
                map: map,
                mapProjection: map.projection,
                signal: new AbortController().signal // currently not used
            }
        );
        if (results.length > maxResults) {
            results = results.slice(0, maxResults);
        }
        return results;
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

/** Represents a tooltip rendered on the OpenLayers map. */
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
    setText(value: string): void;
}

function createHelpTooltip(map: MapModel): Tooltip {
    const olMap = map.olMap;
    const element = document.createElement("div");
    element.className = "selection-tooltip printing-hide";
    element.role = "tooltip";

    const content = document.createElement("span");
    element.appendChild(content);

    const overlay = new Overlay({
        element: element,
        offset: [15, 0],
        positioning: "center-left"
    });

    const pointHandler = olMap.on("pointermove", (evt) => {
        overlay.setPosition(evt.coordinate);
    });

    olMap.addOverlay(overlay);
    return {
        overlay,
        element,
        destroy() {
            olMap.removeOverlay(overlay);
            overlay.dispose();
            unByKey(pointHandler);
        },
        setText(value: string) {
            content.textContent = value;
        }
    };
}
