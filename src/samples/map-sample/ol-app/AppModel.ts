// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource, createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { MapRegistry } from "@open-pioneer/map";
import { OgcFeaturesSearchSourceFactory } from "@open-pioneer/ogc-features";
import {
    type DECLARE_SERVICE_INTERFACE,
    PackageIntl,
    Service,
    ServiceOptions
} from "@open-pioneer/runtime";
import { SearchSource } from "@open-pioneer/search";
import { SelectionSource, VectorLayerSelectionSourceFactory } from "@open-pioneer/selection";
import OlBaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { proxy, ref } from "valtio";
import { proxyMap } from "valtio/utils";
import { MAP_ID } from "./MapConfigProviderImpl";
import { PhotonGeocoder } from "./sources/searchSources";
import { ResultColumn, ResultListInput } from "@open-pioneer/result-list";

const LOG = createLogger("ol-app:AppModel");

declare module "valtio" {
    // Relax deep readonly, see https://github.com/pmndrs/valtio/issues/327.
    // By default valtio makes everything readonly which causes some problems when functions
    // don't expect readonly data.
    export function useSnapshot<T extends object>(p: T): T;
}

/**
 * Reactive state, rendered by the UI.
 */
export interface AppState {
    /**
     * The sources currently used in the search component.
     */
    searchSources: SearchSource[];

    /**
     * The sources currently used in the selection component.
     */
    selectionSources: SelectionSource[];

    /**
     * Key: selection source, Value: Result list metadata.
     */
    sourceMetadata: Map<unknown, ResultColumn[]>;

    /**
     * The input currently displayed by the result list component (or nothing).
     */
    currentResultListInput: ResultListInput | undefined;
}

interface References {
    mapRegistry: MapRegistry;
}

interface References {
    ogcSearchSourceFactory: OgcFeaturesSearchSourceFactory;
    vectorSelectionSourceFactory: VectorLayerSelectionSourceFactory;
    httpService: HttpService;
    mapRegistry: MapRegistry;
}

export class AppModel implements Service {
    declare [DECLARE_SERVICE_INTERFACE]: "ol-app.AppModel";

    private _intl: PackageIntl;
    private _mapRegistry: MapRegistry;
    private _ogcSearchSourceFactory: OgcFeaturesSearchSourceFactory;
    private _vectorSelectionSourceFactory: VectorLayerSelectionSourceFactory;
    private _httpService: HttpService;
    private _state: AppState;
    private _resources: Resource[] = [];

    constructor({ references, intl }: ServiceOptions<References>) {
        this._mapRegistry = references.mapRegistry;
        this._intl = intl;
        this._ogcSearchSourceFactory = references.ogcSearchSourceFactory;
        this._vectorSelectionSourceFactory = references.vectorSelectionSourceFactory;
        this._httpService = references.httpService;

        this._state = proxy<AppState>({
            searchSources: [],
            selectionSources: [],
            sourceMetadata: proxyMap(),
            currentResultListInput: undefined
        });
        this.initSearchSources();
        this.initSelectionSources().catch((error) => {
            LOG.error("Failed to initialize selection sources", error);
        });
    }

    destroy(): void {
        this._resources.forEach((r) => r.destroy());
    }

    /**
     * Used by the UI to render the application state.
     *
     * In this case, we are using a simple "valtio" store.
     * Valtio implements a reactivity system similar to vue.
     *
     * Use valtio's `useSnapshot()` hook to read values from this state inside react components.
     *
     * NOTE: "complex" values must be wrapped into `ref` to prevent recursive watches.
     *
     * See also: https://valtio.pmnd.rs/
     */
    get state(): AppState {
        return this._state;
    }

    /**
     * Initializes the application's search sources.
     * These are used by the UI to configure the search widget.
     */
    private initSearchSources() {
        const flrstSource = this._ogcSearchSourceFactory.createSearchSource({
            label: this._intl.formatMessage({ id: "searchSources.lika" }),
            baseUrl: "https://ogc-api.nrw.de/lika/v1",
            collectionId: "flurstueck",
            searchProperty: "flurstid",
            labelProperty: "objid"
        });
        const ogcSource = this._ogcSearchSourceFactory.createSearchSource({
            label: this._intl.formatMessage({ id: "searchSources.miningPermissions" }),
            baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
            collectionId: "managementrestrictionorregulationzone",
            searchProperty: "thematicId",
            labelProperty: "name",
            renderLabel(feature) {
                const name = feature?.properties?.name;
                const id = feature?.id;
                if (typeof name === "string") {
                    return name + " (" + id + ")";
                } else {
                    return String(id);
                }
            },
            rewriteUrl(url) {
                url.searchParams.set("properties", "name"); // return `name` inside of `features[].properties` only
                return url;
            }
        });
        const photonSource = new PhotonGeocoder(
            "Photon Geocoder",
            ["city", "street"],
            this._httpService
        );
        this._state.searchSources = [ref(flrstSource), ref(ogcSource), ref(photonSource)];
    }

    /**
     * Initializes the application's selection sources.
     * Certain vector layers are automatically registered for selection.
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
                vectorLayer: opLayer.olLayer as VectorLayer<VectorSource>,
                label: opLayer.title
            });

            const eventHandler = layerSelectionSource.on("changed:status", () => {
                if (
                    layerSelectionSource.status !== "available" &&
                    (layerSelectionSource.status === "unavailable" ||
                        layerSelectionSource.status?.kind === "unavailable")
                ) {
                    map.removeHighlight();
                }
            });
            this._resources.push(eventHandler, layerSelectionSource);
            this._state.selectionSources.unshift(ref(layerSelectionSource));

            this._state.sourceMetadata.set(
                ref(layerSelectionSource),
                opLayer.attributes.resultListMetadata as ResultColumn[]
            );
        }
    }
}

function isVectorLayerWithVectorSource(layer: OlBaseLayer) {
    return layer instanceof VectorLayer && layer.getSource() instanceof VectorSource;
}
