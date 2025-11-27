// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive } from "@conterra/reactivity-core";
import { AnyLayer } from "@open-pioneer/map";
import { TocModel } from "./TocModel";
import { ExpandItemOptions, TocItem } from "./types";

export class TocItemImpl implements TocItem {
    #htmlElement = reactive<HTMLElement | undefined>();
    #expanded: Reactive<boolean>;
    #layer: AnyLayer;
    #tocModel: TocModel;

    constructor(layer: AnyLayer, tocModel: TocModel, expanded: boolean) {
        this.#expanded = reactive(expanded);
        this.#layer = layer;
        this.#tocModel = tocModel;
    }

    get id() {
        return this.layerId;
    }

    get layerId() {
        return this.#layer.id;
    }

    get isExpanded() {
        return this.#expanded.value;
    }

    get htmlElement() {
        return this.#htmlElement.value;
    }

    setExpanded(expanded: boolean, options?: ExpandItemOptions): void {
        this.#expanded.value = expanded;
        let bubble = options?.bubble;
        //by default bubble if expand is true
        if (bubble === undefined) {
            bubble = expanded;
        }

        if (bubble) {
            const parentLayer = this.#layer.parent;
            if (parentLayer) {
                this.#tocModel.getItemByLayerId(parentLayer.id)?.setExpanded(expanded, options);
            }
        }
    }

    //private setter, not exposed in TocItem interface
    setHtmlElement(element: HTMLElement | undefined) {
        this.#htmlElement.value = element;
    }
}
