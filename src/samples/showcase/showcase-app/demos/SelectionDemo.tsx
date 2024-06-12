// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { reactive } from "@conterra/reactivity-core";
import { Layer, MapModel, SimpleLayer } from "@open-pioneer/map";
import {
    FormatOptions,
    ResultColumn,
    ResultList,
    ResultListInput,
    ResultListSelectionChangeEvent
} from "@open-pioneer/result-list";
import {
    Selection,
    SelectionCompleteEvent,
    VectorLayerSelectionSource
} from "@open-pioneer/selection";
import { VectorSelectionSourceFactory } from "@open-pioneer/selection/services";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { ReactNode } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Demo, DemoModel, SharedDemoOptions } from "./Demo";

interface ResultListState {
    /** Whether the result list is currently shown. */
    open: boolean;

    /** Incremented to reset result list state. */
    key: number;

    /** Input used for the result list component. */
    input: ResultListInput | undefined;
}

export function createSelectionDemo(options: SharedDemoOptions): Demo {
    return {
        id: "selectionResultList",
        title: options.intl.formatMessage({ id: "demos.selectionResultList.title" }),
        createModel() {
            return new DemoModelImpl(options);
        }
    };
}

class DemoModelImpl implements DemoModel {
    #mapModel: MapModel;
    #selectionSource: VectorLayerSelectionSource;
    #resultListState = reactive<ResultListState>({
        key: 0,
        input: undefined,
        open: false
    });

    description: string;
    mainWidget: ReactNode;

    constructor(options: SharedDemoOptions) {
        const { mapModel, vectorSelectionSourceFactory, intl } = options;

        this.#mapModel = mapModel;
        this.#selectionSource = initSelectionSource(mapModel, vectorSelectionSourceFactory);

        this.description = intl.formatMessage({ id: "demos.selectionResultList.description" });
        this.mainWidget = (
            <Selection
                mapId={MAP_ID}
                sources={[this.#selectionSource]}
                onSelectionComplete={this.#onSelectionComplete}
            />
        );

        const layer = mapModel.layers.getLayerById("krankenhaus") as Layer;
        layer.setVisible(true);
    }

    destroy() {
        this.#selectionSource.destroy();

        const layer = this.#mapModel.layers.getLayerById("krankenhaus") as Layer;
        layer.setVisible(false);
    }

    get listContainer() {
        const currentState = this.#resultListState.value;
        if (!currentState.open || !currentState.input) {
            return undefined;
        }

        return (
            <ResultList
                key={currentState.key}
                input={currentState.input}
                mapId={MAP_ID}
                onSelectionChange={this.#onResultListSelectionChange}
            />
        );
    }

    #onSelectionComplete = (event: SelectionCompleteEvent) => {
        const { results } = event;
        const formatOptions: FormatOptions = {
            numberOptions: {
                maximumFractionDigits: 3
            },
            dateOptions: {
                dateStyle: "medium",
                timeStyle: "medium",
                timeZone: "UTC"
            }
        };
        // todo add better column information (https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1/collections/governmentalservice/items?f=json)
        const columns: ResultColumn[] = [
            {
                propertyName: "thematicId",
                displayName: "ID",
                width: 120
            },
            {
                propertyName: "name",
                displayName: "Name"
            },
            {
                propertyName: "traeger",
                displayName: "Träger"
            }
        ];
        const input: ResultListInput = {
            columns: columns,
            data: results,
            formatOptions: formatOptions
        };

        const oldKey = this.#resultListState.value.key;
        this.#resultListState.value = {
            open: true,
            key: oldKey + 1,
            input: input
        };
    };

    #onResultListSelectionChange = (event: ResultListSelectionChangeEvent) => {
        console.log("Selected features: ", event.features);
    };
}

function initSelectionSource(
    mapModel: MapModel,
    vectorSelectionSourceFactory: VectorSelectionSourceFactory
) {
    const opLayer = mapModel.layers.getLayerById("krankenhaus") as SimpleLayer;

    const layerSelectionSource = vectorSelectionSourceFactory.createSelectionSource({
        vectorLayer: opLayer.olLayer as VectorLayer<VectorSource>,
        label: opLayer.title
    });

    return layerSelectionSource;
}
