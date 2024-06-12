// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapConfig, MapConfigProvider, SimpleLayer, WMSLayer, WMTSLayer } from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile.js";
import { OSM } from "ol/source";
import { OgcFeaturesVectorSourceFactory } from "@open-pioneer/ogc-features";
import VectorLayer from "ol/layer/Vector";
import { ServiceOptions } from "@open-pioneer/runtime";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { LegendItemAttributes } from "@open-pioneer/legend";
import { CustomLegendItem } from "ol-map/CustomLegendItems";

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

    async getMapConfig(): Promise<MapConfig> {
        return {
            initialView: {
                kind: "position",
                center: { x: 823091, y: 6724521 },
                zoom: 8
            },
            layers: [
                new SimpleLayer({
                    title: "OSM",
                    id: "osm",
                    isBaseLayer: true,
                    olLayer: new TileLayer({
                        source: new OSM()
                    })
                }),
                new WMTSLayer({
                    isBaseLayer: true,
                    title: "Orthofotos NRW",
                    url: "https://www.wmts.nrw.de/geobasis/wmts_nw_dop/1.0.0/WMTSCapabilities.xml",
                    name: "nw_dop",
                    matrixSet: "EPSG_3857_16",
                    sourceOptions: {
                        attributions: `Die Geobasisdaten des amtlichen Vermessungswesens werden als öffentliche Aufgabe gem. VermKatG NRW und gebührenfrei nach Open Data-Prinzipien über online-Verfahren bereitgestellt. Nutzungsbedingungen: siehe <a href="https://www.bezreg-koeln.nrw.de/system/files/media/document/file/lizenzbedingungen_geobasis_nrw.pdf"</a>`
                    }
                }),
                createAdminAreasLayer(),
                createKitasLayer(),
                createKrankenhausLayer(this.vectorSourceFactory)
            ]
        };
    }
}

function createKrankenhausLayer(vectorSourceFactory: OgcFeaturesVectorSourceFactory) {
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

    return new SimpleLayer({
        id: "krankenhaus",
        title: "Krankenhäuser-Demo-Dienst",
        visible: false,
        olLayer: layer,
        attributes: {
            collectionURL: baseURL + "/collections/" + collectionId
        }
    });
}

function createKitasLayer() {
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

    return new SimpleLayer({
        id: "ogc_kitas",
        title: "Kindertagesstätten",
        visible: true,
        olLayer: layer,
        attributes: {
            "legend": pointLayerLegendProps
        }
    });
}

function createAdminAreasLayer() {
    return new WMSLayer({
        title: "Verwaltungsgebiete",
        id: "verwaltungsgebiete",
        visible: false,
        url: "https://www.wms.nrw.de/geobasis/wms_nw_dvg",
        sublayers: [
            {
                name: "nw_dvg_krs",
                title: "Kreise und kreisfreie Städte"
            }
        ]
    });
}
