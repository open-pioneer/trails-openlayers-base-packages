// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LegendItemAttributes } from "@open-pioneer/legend";
import {
    GroupLayer,
    LayerFactory,
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    SimpleLayer,
    WMSLayer,
    WMTSLayer
} from "@open-pioneer/map";
import { OgcFeaturesVectorSourceFactory } from "@open-pioneer/ogc-features";
import { ServiceOptions } from "@open-pioneer/runtime";
import GeoJSON from "ol/format/GeoJSON";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector";
import { OSM } from "ol/source";
import VectorSource from "ol/source/Vector";
import { CustomLegendItem } from "./CustomLegendItems";

interface References {
    vectorSourceFactory: OgcFeaturesVectorSourceFactory;
}

export const MAP_ID = "main";

export class MapConfigProviderImpl implements MapConfigProvider {
    mapId = MAP_ID;
    private vectorSourceFactory: OgcFeaturesVectorSourceFactory;

    constructor(options: ServiceOptions<References>) {
        this.vectorSourceFactory = options.references.vectorSourceFactory;
    }

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 823091, y: 6724521 },
                zoom: 8
            },
            layers: [
                layerFactory.create({
                    type: SimpleLayer,
                    title: "OSM",
                    id: "osm",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                layerFactory.create({
                    type: WMTSLayer,
                    isBaseLayer: true,
                    title: "Orthofotos NRW",
                    url: "https://www.wmts.nrw.de/geobasis/wmts_nw_dop/1.0.0/WMTSCapabilities.xml",
                    name: "nw_dop",
                    matrixSet: "EPSG_3857_16",
                    sourceOptions: {
                        attributions: `Die Geobasisdaten des amtlichen Vermessungswesens werden als öffentliche Aufgabe gem. VermKatG NRW und gebührenfrei nach Open Data-Prinzipien über online-Verfahren bereitgestellt. Nutzungsbedingungen: siehe <a href="https://www.bezreg-koeln.nrw.de/system/files/media/document/file/lizenzbedingungen_geobasis_nrw.pdf"</a>`
                    }
                }),
                createAdminAreasLayer(layerFactory),
                createKitasLayer(layerFactory),
                createKrankenhausLayer(layerFactory, this.vectorSourceFactory)
            ]
        };
    }
}

function createKrankenhausLayer(
    layerFactory: LayerFactory,
    vectorSourceFactory: OgcFeaturesVectorSourceFactory
) {
    const baseURL = "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1";
    const collectionId = "governmentalservice";
    const source = vectorSourceFactory.createVectorSource({
        baseUrl: baseURL,
        collectionId: collectionId,
        limit: 1000,
        crs: "http://www.opengis.net/def/crs/EPSG/0/3857",
        attributions: `Land NRW (${new Date().getFullYear()}), <a href='https://www.govdata.de/dl-de/by-2-0'>Datenlizenz Deutschland - Namensnennung - Version 2.0</a>, <a href='https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1'>Datenquelle</a>`
    });

    const layer = new VectorLayer({
        source: source
    });

    return layerFactory.create({
        type: SimpleLayer,
        id: "krankenhaus",
        title: "Krankenhäuser-Demo-Dienst",
        visible: false,
        olLayer: layer,
        attributes: {
            collectionURL: baseURL + "/collections/" + collectionId
        }
    });
}

function createKitasLayer(layerFactory: LayerFactory) {
    const geojsonSource = new VectorSource({
        url: "https://ogc-api.nrw.de/inspire-us-kindergarten/v1/collections/governmentalservice/items?f=json&limit=10000",
        format: new GeoJSON(), //assign GeoJson parser
        attributions:
            '&copy; <a href="http://www.bkg.bund.de" target="_blank">Bundesamt f&uuml;r Kartographie und Geod&auml;sie</a> 2017, <a href="http://sg.geodatenzentrum.de/web_public/Datenquellen_TopPlus_Open.pdf" target="_blank">Datenquellen</a>'
    });

    const layer = new VectorLayer({
        source: geojsonSource
    });

    const pointLayerLegendProps: LegendItemAttributes = {
        Component: CustomLegendItem
    };

    return layerFactory.create({
        type: SimpleLayer,
        id: "ogc_kitas",
        title: "Kindertagesstätten",
        visible: true,
        olLayer: layer,
        attributes: {
            "legend": pointLayerLegendProps
        }
    });
}

function createAdminAreasLayer(layerFactory: LayerFactory) {
    return layerFactory.create({
        type: WMSLayer,
        title: "Verwaltungsgebiete",
        id: "verwaltungsgebiete",
        visible: false,
        minResolution: 300,
        maxResolution: 500,
        url: "https://www.wms.nrw.de/geobasis/wms_nw_dvg",
        attributes: {
            legend: {
                listMode: "show"
            } satisfies LegendItemAttributes
        },
        sourceOptions: {},
        sublayers: [
            {
                name: "nw_dvg_krs",
                title: "Kreise und kreisfreie Städte"
            }
        ]
    });
}
