// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageIntl } from "@open-pioneer/runtime";
import OlMap, { FrameState } from "ol/Map";
import Attribution from "ol/control/Attribution";
import { sanitizeHtml } from "../utils/sanitize";
import { computed, reactive } from "@conterra/reactivity-core";
import { AttributionItem } from "./MapModel";

export class MapAttributions {
    #olMap: OlMap;

    /**
     * When default rendering of attributions is active, we simply display this control on the map (otherwise: hidden).
     *
     * The control is always active (even if invisible) because we re-use its rendering code to extract the attribution items.
     * There is no real API to extract the attributions from OpenLayers, and we don't want to re-implement that logic right now.
     * We will see if that approach remains stable.
     */
    #control: Attribution;

    #attributionStrings = reactive<string[]>([], { equal: shallowEqual });

    // Attribution strings wrapped in objects, for forward compat.
    #attributionItems = computed<AttributionItem[]>(() =>
        this.#attributionStrings.value.map((attribution) => ({
            text: attribution
        }))
    );

    constructor(options: {
        olMap: OlMap;
        /** false: not rendered */
        showControl: boolean;
        intl: PackageIntl;
    }) {
        this.#olMap = options.olMap;

        const control = (this.#control = new Attribution({
            collapsible: false,
            target: options.showControl ? undefined : createDummyTargetNode()
        }));
        interceptAttributions(
            control,
            // Called by the attributions widgets as a side effect.
            // NOTE: this is currently called very often (~ every map render).
            (attributions) => {
                this.#attributionStrings.value = attributions;
            }
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = (control as any).element as HTMLElement | undefined;
        if (element) {
            element.role = "region";
            element.ariaLabel = options.intl.formatMessage({ id: "attribution.label" });
        }

        this.#olMap.addControl(control);
    }

    destroy() {
        this.#olMap.removeControl(this.#control);
        this.#control.dispose();
    }

    get attributionItems(): AttributionItem[] {
        return this.#attributionItems.value;
    }
}

// Overrides the OpenLayers widget to sanitize HTML attributions and to intercept the computed array of strings.
// Note that this depends on OpenLayers internals that may change between versions.
function interceptAttributions(attr: Attribution, onUpdate: (attributions: string[]) => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-function-type
    const originalCollectSourceAttributions = (attr as any).collectSourceAttributions_ as Function;
    if (!originalCollectSourceAttributions) {
        throw new Error("Internal error: failed to override attributions widget");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (attr as any).collectSourceAttributions_ = (frameState: FrameState) => {
        const rawAttributions = originalCollectSourceAttributions.call(
            attr,
            frameState
        ) as string[];
        if (!Array.isArray(rawAttributions)) {
            throw new Error("Internal error: unexpected attributions result (should be an array)");
        }
        const sanitizedAttributions = rawAttributions.map((a) => sanitizeHtml(a));
        onUpdate(sanitizedAttributions);
        return sanitizedAttributions;
    };
}

function createDummyTargetNode() {
    const node = document.createElement("div");
    node.style.display = "none";
    node.className = "map-attribution-dummy-target";
    return node;
}

// TODO: generic shallowEqual, deepEqual helpers @open-pioneer/core
function shallowEqual<T>(a: T[], b: T[]) {
    return a.length === b.length && a.every((v, i) => v == b[i]);
}
