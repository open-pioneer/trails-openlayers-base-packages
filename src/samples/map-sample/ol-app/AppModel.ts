// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource, createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { Highlight, MapModel, MapRegistry } from "@open-pioneer/map";
import { type DECLARE_SERVICE_INTERFACE, Service, ServiceOptions } from "@open-pioneer/runtime";
import { SearchSource } from "@open-pioneer/search";
import { SelectionSource, VectorLayerSelectionSourceFactory } from "@open-pioneer/selection";
import Feature from "ol/Feature";
import OlBaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { MAP_ID } from "./map/MapConfigProviderImpl";
import { PhotonGeocoder } from "./sources/searchSources";
import { ResultColumn, ResultListInput } from "@open-pioneer/result-list";
import { Geometry } from "ol/geom";
import {
    ReadonlyReactiveArray,
    ReadonlyReactiveMap,
    reactive,
    reactiveArray,
    reactiveMap,
    watch
} from "@conterra/reactivity-core";

const LOG = createLogger("ol-app:AppModel");

/**
 * Reactive state, rendered by the UI.
 */
export interface AppState {
    /**
     * The content of the main widget on the left side of the application.
     */
    readonly mainContent: readonly MainContentId[];

    /**
     * The sources currently used in the search component.
     */
    readonly searchSources: ReadonlyReactiveArray<SearchSource>;

    /**
     * The sources currently used in the selection component.
     */
    readonly selectionSources: ReadonlyReactiveArray<SelectionSource>;

    /**
     * Key: selection source, Value: Result list metadata.
     */
    readonly sourceMetadata: ReadonlyReactiveMap<unknown, ResultColumn[]>;

    /**
     * State for the result list.
     * This application can show only a single feature collection at a time.
     */
    readonly resultListState: Readonly<ResultListState>;
}

export interface ResultListState {
    /** Whether the result list is currently shown. */
    open: boolean;

    /** Incremented to reset result list state. */
    key: number;

    /** Input used for the result list component. */
    input: ResultListInput | undefined;
}

/**
 * The id of a widget that can be displayed by this app.
 */
export type MainContentId =
    | "toc"
    | "legend"
    | "printing"
    | "selection"
    | "measurement"
    | "editing-create"
    | "editing-update";

interface References {
    mapRegistry: MapRegistry;
}

interface References {
    vectorSelectionSourceFactory: VectorLayerSelectionSourceFactory;
    httpService: HttpService;
    mapRegistry: MapRegistry;
}

function isInteraction(content: MainContentId): boolean {
    return content === "selection" || content === "measurement" || content.startsWith("editing-");
}

export class AppModel implements Service, AppState {
    declare [DECLARE_SERVICE_INTERFACE]: "ol-app.AppModel";

    private _mapRegistry: MapRegistry;
    private _vectorSelectionSourceFactory: VectorLayerSelectionSourceFactory;
    private _httpService: HttpService;
    private _resources: Resource[] = [];

    // Highlight for search or selection results (they remove each other in this app).
    private _featureHighlight: Highlight | undefined = undefined;

    // Reactive state used by the UI
    private _mainContent = reactive<MainContentId[]>(["toc"]);
    private _searchSources = reactiveArray<SearchSource>();
    private _selectionSources = reactiveArray<SelectionSource>();
    private _sourceMetadata = reactiveMap<unknown, ResultColumn[]>();
    private _resultListState = reactive<ResultListState>({
        key: 0,
        open: false,
        input: undefined
    });

    constructor({ references }: ServiceOptions<References>) {
        this._mapRegistry = references.mapRegistry;
        this._vectorSelectionSourceFactory = references.vectorSelectionSourceFactory;
        this._httpService = references.httpService;

        this.initSearchSources();
        this.initSelectionSources().catch((error) => {
            LOG.error("Failed to initialize selection sources", error);
        });
    }

    destroy(): void {
        this.clearHighlight();
        this._resources.forEach((r) => r.destroy());
    }

    get mainContent(): readonly MainContentId[] {
        return this._mainContent.value;
    }

    get searchSources(): ReadonlyReactiveArray<SearchSource> {
        return this._searchSources;
    }

    get selectionSources(): ReadonlyReactiveArray<SelectionSource> {
        return this._selectionSources;
    }

    get sourceMetadata(): ReadonlyReactiveMap<unknown, ResultColumn[]> {
        return this._sourceMetadata;
    }

    get resultListState(): Readonly<ResultListState> {
        return this._resultListState.value;
    }

    /**
     * Show or hide the given main content element.
     *
     * The main area of this application can show multiple "normal" widgets
     * or exactly one interaction.
     */
    toggleMainContent(content: MainContentId) {
        const current = this._mainContent.value;
        if (current.includes(content)) {
            this._mainContent.value = current.filter((c) => c !== content);
            return;
        }

        let next;
        if (isInteraction(content)) {
            // Hide everything else. This also enforces a single active map interaction.
            next = [content];
            this.clearHighlight();
        } else {
            next = current.filter((c) => !isInteraction(c));
            next.push(content);
        }
        this._mainContent.value = next;
    }

    /**
     * Hides the content element with the given name.
     */
    hideContent(name: MainContentId) {
        this._mainContent.value = this._mainContent.value.filter((c) => c !== name);
    }

    /**
     * Resets all currently running interactions.
     */
    clearInteractions() {
        this._mainContent.value = this._mainContent.value.filter((c) => !isInteraction(c));
    }

    /**
     * Shows the result list with the given input.
     */
    setResultListInput(input: ResultListInput) {
        const oldState = this._resultListState.value;
        this._resultListState.value = {
            open: true,
            key: oldState.key + 1,
            input: input
        };
    }

    /**
     * Sets the visibility of the result list to the given value.
     */
    setResultListVisibility(visible: boolean) {
        this._resultListState.value = {
            ...this._resultListState.value,
            open: visible
        };
    }

    /**
     * Zooms and highlights to the given geometries.
     * Clears the existing highlight created by earlier calls to this method.
     */
    highlightAndZoom(map: MapModel, geometries: Geometry[]): void {
        const viewport: HTMLElement = map.olMap.getViewport();

        this.clearHighlight();
        this._featureHighlight = map.highlightAndZoom(geometries, {
            viewPadding:
                viewport && viewport.offsetWidth < 1000
                    ? { top: 150, right: 75, bottom: 50, left: 75 }
                    : { top: 150, right: 400, bottom: 50, left: 400 }
        });
    }

    /**
     * Zooms to the given geometries.
     */
    zoom(map: MapModel, geometries: Geometry[]): void {
        const viewport: HTMLElement = map.olMap.getViewport();

        map.zoom(geometries, {
            viewPadding:
                viewport && viewport.offsetWidth < 1000
                    ? { top: 150, right: 75, bottom: 50, left: 75 }
                    : { top: 150, right: 400, bottom: 50, left: 400 }
        });
    }

    /**
     * Removes any highlights created by this instance.
     */
    clearHighlight() {
        if (this._featureHighlight) {
            this._featureHighlight.destroy();
            this._featureHighlight = undefined;
        }
    }

    /**
     * Initializes the application's search sources.
     * These are used by the UI to configure the search widget.
     */
    private initSearchSources() {
        const photonSource = new PhotonGeocoder(
            "Photon Geocoder",
            ["city", "street"],
            this._httpService
        );
        this._searchSources.push(photonSource);
    }

    /**
     * Initializes the application's selection sources.
     * Certain vector layers are automatically registered for selection.
     *
     * The result list metadata is loaded into a table (`sourceMetadata`) by reading
     * the application specific `resultListMetadata` from the layers' attributes.
     */
    private async initSelectionSources() {
        const SELECTION_LAYER_IDS = ["ogc_kitas", "ogc_kataster"];
        const map = await this._mapRegistry.expectMapModel(MAP_ID);
        const opLayers = map.layers.getOperationalLayers({ sortByDisplayOrder: true });

        for (const opLayer of opLayers) {
            if (
                !SELECTION_LAYER_IDS.includes(opLayer.id) ||
                !isVectorLayerWithVectorSource(opLayer.olLayer)
            ) {
                continue;
            }

            const layerSelectionSource = this._vectorSelectionSourceFactory.createSelectionSource({
                vectorLayer: opLayer.olLayer as VectorLayer<Feature>,
                label: opLayer.title
            });

            const statusWatch = watch(
                () => [layerSelectionSource.status],
                ([newStatus]) => {
                    if (
                        newStatus !== "available" &&
                        (newStatus === "unavailable" || newStatus?.kind === "unavailable")
                    ) {
                        this.clearHighlight();
                    }
                }
            );

            this._resources.push(statusWatch, layerSelectionSource);
            this._selectionSources.unshift(layerSelectionSource);
            this._sourceMetadata.set(
                layerSelectionSource,
                opLayer.attributes.resultListMetadata as ResultColumn[]
            );
        }
    }
}

function isVectorLayerWithVectorSource(layer: OlBaseLayer) {
    return layer instanceof VectorLayer && layer.getSource() instanceof VectorSource;
}
