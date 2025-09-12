// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    ReadonlyReactiveArray,
    ReadonlyReactiveMap,
    reactive,
    reactiveArray,
    reactiveMap,
    watch
} from "@conterra/reactivity-core";
import { Resource, createLogger } from "@open-pioneer/core";
import { HttpService } from "@open-pioneer/http";
import { LegendItemAttributes } from "@open-pioneer/legend";
import {
    BaseFeature,
    Highlight,
    LayerFactory,
    MapConfig,
    MapModel,
    MapRegistry,
    SimpleLayer,
    WMSLayer,
    WMTSLayer
} from "@open-pioneer/map";
import { OgcFeaturesVectorSourceFactory } from "@open-pioneer/ogc-features";
import { ResultColumn, ResultListInput } from "@open-pioneer/result-list";
import { type DECLARE_SERVICE_INTERFACE, Service, ServiceOptions } from "@open-pioneer/runtime";
import { SearchSource } from "@open-pioneer/search";
import { SelectionSource, VectorLayerSelectionSourceFactory } from "@open-pioneer/selection";
import { View } from "ol";
import Feature from "ol/Feature";
import GeoJSON from "ol/format/GeoJSON";
import { Geometry } from "ol/geom";
import OlBaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { OSM } from "ol/source";
import VectorSource from "ol/source/Vector";
import { Circle, Fill, Style } from "ol/style";
import { CustomLegendItem } from "./map/CustomLegendItems";
import { PhotonGeocoder } from "./sources/searchSources";

const LOG = createLogger("ol-app:AppModel");

interface References {
    vectorSourceFactory: OgcFeaturesVectorSourceFactory;
}

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
    layerFactory: LayerFactory;
}

function isInteraction(content: MainContentId): boolean {
    return content === "selection" || content === "measurement" || content.startsWith("editing-");
}

export class AppModel implements Service, AppState {
    declare [DECLARE_SERVICE_INTERFACE]: "ol-app.AppModel";

    private _mapRegistry: MapRegistry;
    private _layerFactory: LayerFactory;
    private _vectorSourceFactory: OgcFeaturesVectorSourceFactory;
    private _vectorSelectionSourceFactory: VectorLayerSelectionSourceFactory;
    private _httpService: HttpService;
    private _resources: Resource[] = [];

    private _map = reactive<MapModel>();

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
        this._layerFactory = references.layerFactory;
        this._vectorSelectionSourceFactory = references.vectorSelectionSourceFactory;
        this._vectorSourceFactory = references.vectorSourceFactory;
        this._httpService = references.httpService;

        this._mapRegistry
            .createMapModel("main", getMapConfig(this._layerFactory, this._vectorSourceFactory))
            .then((map) => {
                this._map.value = map;
                this.initSelectionSources(map).catch((error) => {
                    LOG.error("Failed to initialize selection sources", error);
                });
            })
            .catch((error) => LOG.error("Failed to initialize map", error));

        this.initSearchSources();
    }

    destroy(): void {
        this.clearHighlight();
        this._resources.forEach((r) => r.destroy());
    }

    get map(): MapModel | undefined {
        return this._map.value;
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
    private async initSelectionSources(map: MapModel) {
        const SELECTION_LAYER_IDS = ["ogc_kitas", "ogc_kataster"];
        const opLayers = map.layers.getOperationalLayers({ sortByDisplayOrder: true });

        for (const opLayer of opLayers) {
            if (
                !SELECTION_LAYER_IDS.includes(opLayer.id) ||
                !isVectorLayerWithVectorSource(opLayer.olLayer)
            ) {
                continue;
            }

            const layerSelectionSource = this._vectorSelectionSourceFactory.createSelectionSource({
                vectorLayer: opLayer.olLayer as VectorLayer<VectorSource, Feature>,
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

function getMapConfig(
    layerFactory: LayerFactory,
    vectorSourceFactory: OgcFeaturesVectorSourceFactory
): MapConfig {
    return {
        advanced: {
            view: new View({
                center: [404747, 5757920],
                zoom: 13,
                constrainResolution: true,
                projection: "EPSG:25832"
            })
        },
        layers: [
            ...createBaseLayers(layerFactory),
            createStrassenLayer(layerFactory),
            createKrankenhausLayer(layerFactory, vectorSourceFactory),
            createSchulenLayer(layerFactory),
            createKitasLayer(layerFactory)
        ]
    };
}

function createBaseLayers(layerFactory: LayerFactory) {
    return [
        layerFactory.create({
            type: WMTSLayer,
            isBaseLayer: true,
            title: "Topplus grau",
            url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
            name: "topplus_grau",
            matrixSet: "EPSG_25832_14",
            visible: false,
            sourceOptions: {
                attributions: `Kartendarstellung und Präsentationsgraphiken: &copy; Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a title="Datenquellen öffnen" aria-label="Datenquellen öffnen" href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html " target="_blank">Datenquellen</a>`
            }
        }),
        layerFactory.create({
            type: WMTSLayer,
            isBaseLayer: true,
            title: "Topplus farbig",
            url: "https://www.wmts.nrw.de/topplus_open/1.0.0/WMTSCapabilities.xml",
            name: "topplus_col",
            matrixSet: "EPSG_25832_14",
            visible: true,
            sourceOptions: {
                attributions: `Kartendarstellung und Präsentationsgraphiken: &copy; Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a title="Datenquellen öffnen" aria-label="Datenquellen öffnen" href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html " target="_blank">Datenquellen</a>`
            }
        }),
        layerFactory.create({
            type: SimpleLayer,
            title: "OpenStreetMaps",
            visible: false,
            isBaseLayer: true,
            olLayer: new TileLayer({
                source: new OSM()
            })
        })
    ];
}

function createKrankenhausLayer(
    layerFactory: LayerFactory,
    vectorSourceFactory: OgcFeaturesVectorSourceFactory
) {
    const baseURL = "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1";
    const collectionId = "governmentalservice";
    const source = vectorSourceFactory.createVectorSource({
        strategy: "next",
        baseUrl: baseURL,
        collectionId: collectionId,
        limit: 1000,
        crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
        attributions: `Land NRW (${new Date().getFullYear()}), <a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>, <a href='https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1'>Datenquelle</a>`
    });

    const layer = new VectorLayer({
        source: source
    });

    return layerFactory.create({
        type: SimpleLayer,
        id: "krankenhaus",
        title: "Krankenhäuser",
        visible: false,
        olLayer: layer,
        attributes: {
            collectionURL: baseURL + "/collections/" + collectionId
        }
    });
}

function createSchulenLayer(layerFactory: LayerFactory) {
    return layerFactory.create({
        type: WMSLayer,
        title: "Schulstandorte",
        description: `Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.Der vorliegende Datenbestand / Dienst zu den Schulstandorten in NRW stammt aus der Schuldatenbank. Die Informationen werden von den Schulträgern bzw. Schulen selbst eingetragen und aktuell gehalten. Die Daten werden tagesaktuell bereitgestellt und enthalten alle grundlegenden Informationen zu Schulen wie Schulnummer, Schulbezeichnung und Adresse.`,
        visible: true,
        url: "https://www.wms.nrw.de/wms/wms_nw_inspire-schulen",
        sublayers: [
            {
                name: "US.education",
                title: "INSPIRE - WMS Schulstandorte NRW",
                attributes: {
                    "legend": {}
                }
            }
        ],
        sourceOptions: {
            ratio: 1
        }
    });
}

function createStrassenLayer(layerFactory: LayerFactory) {
    return layerFactory.create({
        type: WMSLayer,
        title: "Straßennetz Landesbetrieb Straßenbau NRW",
        url: "https://www.wms.nrw.de/wms/strassen_nrw_wms",
        visible: true,
        sublayers: [
            {
                name: "1",
                title: "Verwaltungen",
                attributes: {
                    "legend": {
                        imageUrl: "https://www.wms.nrw.de/legends/wms/strassen_nrw_wms/1.png"
                    }
                }
            },
            {
                name: "4",
                title: "Abschnitte und Äste"
            },
            {
                name: "6",
                title: "Unfälle"
            }
        ]
    });
}

function createKitasLayer(layerFactory: LayerFactory) {
    const pointLayerLegendProps: LegendItemAttributes = {
        Component: CustomLegendItem
    };

    const geojsonSource = new VectorSource({
        url: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1/collections/governmentalservice/items?f=json&limit=10000",
        format: new GeoJSON(), //assign GeoJson parser
        attributions:
            '&copy; <a href="http://www.bkg.bund.de" target="_blank">Bundesamt f&uuml;r Kartographie und Geod&auml;sie</a> 2017, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    });

    const vectorLayer = new VectorLayer({
        source: geojsonSource,
        style: new Style({
            image: new Circle({
                fill: new Fill({ color: "blue" }),
                radius: 4
            })
        })
    });

    return layerFactory.create({
        type: SimpleLayer,
        id: "ogc_kitas",
        title: "Kindertagesstätten",
        visible: true,
        olLayer: vectorLayer,
        attributes: {
            // Standard property interpreted by the legend component.
            "legend": pointLayerLegendProps,

            // Custom attribute used in this application.
            // This is interpreted by this application when opening the  results in the result list.
            "resultListMetadata": [
                {
                    id: "id",
                    displayName: "ID",
                    width: 100,
                    getPropertyValue(feature: BaseFeature) {
                        return feature.id;
                    }
                },
                {
                    propertyName: "pointOfContact.address.postCode",
                    displayName: "PLZ",
                    width: 120
                },
                {
                    propertyName: "name",
                    displayName: "Name"
                },
                {
                    propertyName: "inspireId",
                    displayName: "inspireID"
                },
                {
                    displayName: "Gefördert",
                    width: 160,
                    getPropertyValue(feature: BaseFeature) {
                        switch (feature.properties?.gefoerdert) {
                            case "ja":
                                return true;
                            case "nein":
                                return false;
                            default:
                                return feature.properties?.gefoerdert;
                        }
                    }
                }
            ]
        }
    });
}

function isVectorLayerWithVectorSource(layer: OlBaseLayer) {
    return layer instanceof VectorLayer && layer.getSource() instanceof VectorSource;
}
