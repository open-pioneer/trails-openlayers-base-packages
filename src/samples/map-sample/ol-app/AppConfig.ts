// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { PackageIntl, Service, ServiceOptions } from "@open-pioneer/runtime";
import { OgcFeaturesSearchSourceFactory } from "@open-pioneer/ogc-features";
import { SearchSource } from "@open-pioneer/search";
import { PhotonGeocoder } from "./sources/searchSources";
import { proxy, ref } from "valtio";
import { SelectionSource } from "@open-pioneer/selection";
import { MapRegistry } from "@open-pioneer/map";
import { MAP_ID } from "./MapConfigProviderImpl";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OlBaseLayer from "ol/layer/Base";
import { VectorLayerSelectionSource } from "./sources/selectionSources";
import { Resource, createLogger } from "@open-pioneer/core";

const LOG = createLogger("ol-app:AppConfig");

declare module "valtio" {
    // Relax deep readonly, see https://github.com/pmndrs/valtio/issues/327
    export function useSnapshot<T extends object>(p: T): T;
}
import { HttpService } from "@open-pioneer/http";

interface References {
    ogcSearchSourceFactory: OgcFeaturesSearchSourceFactory;
    httpService: HttpService;
    mapRegistry: MapRegistry;
}

export interface AppState {
    searchSources: SearchSource[];
    selectionSources: SelectionSource[];
}

interface References {
    mapRegistry: MapRegistry;
}

const SELECTION_LAYER_IDS = ["ogc_kitas", "ogc_kataster"];

export class AppConfig implements Service {
    private _intl: PackageIntl;
    private _mapRegistry: MapRegistry;
    private _ogcSearchSourceFactory: OgcFeaturesSearchSourceFactory;
    private _httpService: HttpService;
    private _state: AppState;
    private _resources: Resource[] = [];

    constructor({ references, intl }: ServiceOptions<References>) {
        this._mapRegistry = references.mapRegistry;
        this._intl = intl;
        this._ogcSearchSourceFactory = references.ogcSearchSourceFactory;
        this._httpService = references.httpService;

        this._state = proxy<AppState>({
            searchSources: [],
            selectionSources: []
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
        // new OgcFeatureSearchSource("Feldblöcke", {
        //     baseUrl: "https://ogc-api.nrw.de/inspire-lc-fb/v1",
        //     collectionId: "landcoverunit",
        //     searchProperty: "flik"
        // }),
        // new OgcFeatureSearchSource("Weinberge", {
        //     baseUrl: "https://demo.ldproxy.net/vineyards",
        //     collectionId: "vineyards",
        //     searchProperty: "name"
        // }),
        // this.ogcSearchSourceFactory.createSearchSource({
        //     label: this.intl.formatMessage({ id: "searchSources.lika" }),
        //     baseUrl: "https://ogc-api.nrw.de/lika/v1",
        //     collectionId: "flurstueck",
        //     searchProperty: "flurstid",
        //     labelProperty: "objid"
        // }),
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
        const sources = [ref(ogcSource), ref(photonSource)];
        this._state.searchSources = sources;
    }

    /**
     * Initializes the application's selection sources.
     * Certain vector layers are automatically registered for selection.
     */
    private async initSelectionSources() {
        const intl = this._intl;
        const map = await this._mapRegistry.expectMapModel(MAP_ID);
        const opLayers = map.layers.getOperationalLayers({ sortByDisplayOrder: true });

        for (const opLayer of opLayers) {
            if (
                !opLayer ||
                !SELECTION_LAYER_IDS.includes(opLayer.id) ||
                !isVectorLayerWithVectorSource(opLayer.olLayer)
            ) {
                continue;
            }

            const layerSelectionSource = new VectorLayerSelectionSource(
                opLayer.olLayer as VectorLayer<VectorSource>,
                opLayer.title,
                intl.formatMessage({ id: "layerNotVisibleReason" })
            );
            const eventHandler = layerSelectionSource.on("changed:status", () => {
                if (layerSelectionSource.status.kind === "unavailable") map.removeHighlight();
            });
            this._resources.push(eventHandler, layerSelectionSource);
            this._state.selectionSources.unshift(ref(layerSelectionSource));
        }
    }
}

function isVectorLayerWithVectorSource(layer: OlBaseLayer) {
    return layer instanceof VectorLayer && layer.getSource() instanceof VectorSource;
}
