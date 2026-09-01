// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    MapConfig,
    MapConfigProvider,
    MapConfigProviderOptions,
    SimpleLayer
} from "@open-pioneer/map";
import { applyStyle } from "ol-mapbox-style";
import TileLayer from "ol/layer/Tile";
import VectorTileLayer from "ol/layer/VectorTile";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import {
    BUSRADAR_LAYER_ID,
    BUSRADAR_LAYER_TITLE,
    createBusradarLayer
} from "./map/layers/busradarLayer";
import {
    BUSRADAR_ROUTE_LAYER_ID,
    BUSRADAR_ROUTE_LAYER_TITLE,
    createBusradarRouteLayer
} from "./map/layers/busradarRouteLayer";
import {
    createNearestStopsLinesLayer,
    createNearestStopsOriginLayer,
    NEAREST_STOPS_LINES_LAYER_ID,
    NEAREST_STOPS_LINES_LAYER_TITLE,
    NEAREST_STOPS_ORIGIN_LAYER_ID,
    NEAREST_STOPS_ORIGIN_LAYER_TITLE
} from "./map/layers/nearestStopsLayer";
import {
    createSelectedTransitStopsLayer,
    createTransitStopsLayer,
    SELECTED_TRANSIT_STOPS_LAYER_ID,
    SELECTED_TRANSIT_STOPS_LAYER_TITLE,
    TRANSIT_STOPS_LAYER_ID,
    TRANSIT_STOPS_LAYER_TITLE
} from "./map/layers/transitStopsLayer";

export const MAP_ID = "main";
export const BASEMAP_DE_WEB_VECTOR_LAYER_ID = "basemap-de-web-vector";
export const OPENSTREETMAP_LAYER_ID = "openstreetmap";

const BASEMAP_DE_WEB_VECTOR_STYLE =
    "https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json";
// Initial-/Home-Mittelpunkt in EPSG:3857 (Web Mercator), Münster und Umgebung als regionaler
// Startausschnitt. Bewusst in Projektionskoordinaten hinterlegt, da genau diese Zielwerte
// vorgegeben sind.
const HOME_CENTER_X = 849390.0;
const HOME_CENTER_Y = 6792246.75;
// Initialer/Home-Zoom. Fachlich aus dem gewünschten Maßstab hergeleitet: Maßstab ∝ 1/2^Zoom, und
// die zuvor beobachtete Startansicht (Zoom 16.10096 ↔ ca. 1:4902) ergibt für den Zielbereich
// 1:2933–1:3040: Zoom = 16.10096 + log2(4902 / Zielmaßstab) → 16.790 … 16.842. 16.816 trifft die
// Mitte (ca. 1:2986) und bleibt gegen die Breitengrad-/DPI-Toleranz sicher im Zielbereich.
const HOME_ZOOM = 17.016;

export class MainMapProvider implements MapConfigProvider {
    mapId = MAP_ID;

    async getMapConfig({ layerFactory }: MapConfigProviderOptions): Promise<MapConfig> {
        const basemapDeLayer = new VectorTileLayer({
            declutter: true,
            properties: { title: "basemap.de Web Vektor" }
        });
        await applyStyle(basemapDeLayer, BASEMAP_DE_WEB_VECTOR_STYLE);

        // Gemeinsame Source der Umkreissuche: Linien-Layer und Origin-Layer teilen sich exakt diese
        // eine Source. Feature-Aktualisierung und Cleanup laufen dadurch nur über einen Pfad
        // (renderNearestStops) – keine doppelten Features, keine mehrfachen Layer-Updates.
        const nearestStopsSource = new VectorSource();

        return {
            initialView: {
                kind: "position",
                // Münster und Umgebung als regionaler Startausschnitt (EPSG:3857).
                center: { x: HOME_CENTER_X, y: HOME_CENTER_Y },
                zoom: HOME_ZOOM
            },
            projection: "EPSG:3857",
            layers: [
                layerFactory.create({
                    type: SimpleLayer,
                    id: BASEMAP_DE_WEB_VECTOR_LAYER_ID,
                    title: "basemap.de Web Vektor",
                    olLayer: basemapDeLayer,
                    visible: false,
                    isBaseLayer: true
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: OPENSTREETMAP_LAYER_ID,
                    title: "OpenStreetMap",
                    olLayer: new TileLayer({
                        source: new OSM(),
                        properties: { title: "OpenStreetMap" }
                    }),
                    visible: true,
                    isBaseLayer: true
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: BUSRADAR_ROUTE_LAYER_ID,
                    title: BUSRADAR_ROUTE_LAYER_TITLE,
                    description:
                        "Interner Overlay-Layer für die Route der aktuell ausgewählten Busfahrt. Wird zur Laufzeit befüllt und liegt unter den Haltestellen- und Fahrzeug-Markern.",
                    olLayer: createBusradarRouteLayer(new VectorSource()),
                    visible: true,
                    isBaseLayer: false
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: NEAREST_STOPS_LINES_LAYER_ID,
                    title: NEAREST_STOPS_LINES_LAYER_TITLE,
                    description:
                        "Temporäres Overlay der Umkreissuche: gestrichelte Verbindungslinien zu den nächsten Haltestellen. Liegt unter den Haltestellen-, Bus- und Label-Layern. Teilt sich die Source mit dem Origin-Layer und wird zur Laufzeit befüllt/geleert.",
                    olLayer: createNearestStopsLinesLayer(nearestStopsSource),
                    visible: true,
                    isBaseLayer: false
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: TRANSIT_STOPS_LAYER_ID,
                    title: TRANSIT_STOPS_LAYER_TITLE,
                    description:
                        "Bushaltestellen der Stadtwerke Münster aus der Busradar-Haltestellen-API. Klick auf einen Steig lädt die nächsten Live-Abfahrten über Busradar.",
                    olLayer: createTransitStopsLayer(),
                    visible: false,
                    isBaseLayer: false
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: BUSRADAR_LAYER_ID,
                    title: BUSRADAR_LAYER_TITLE,
                    description:
                        "Live-Fahrzeugpositionen der Stadtwerke Münster über REST-Snapshot und WebSocket-Stream von con terra.",
                    olLayer: createBusradarLayer(),
                    visible: true,
                    isBaseLayer: false
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: SELECTED_TRANSIT_STOPS_LAYER_ID,
                    title: SELECTED_TRANSIT_STOPS_LAYER_TITLE,
                    description:
                        "Interner Overlay-Layer für die aktuell ausgewählte Haltestelle. Rendert nur den ausgewählten roten Marker oberhalb der Bus-Marker und Bus-Labels.",
                    olLayer: createSelectedTransitStopsLayer(),
                    visible: true,
                    isBaseLayer: false
                }),
                layerFactory.create({
                    type: SimpleLayer,
                    id: NEAREST_STOPS_ORIGIN_LAYER_ID,
                    title: NEAREST_STOPS_ORIGIN_LAYER_TITLE,
                    description:
                        "Temporäres Overlay der Umkreissuche: Marker an der angeklickten Position. Oberster Layer, damit der Ausgangspunkt über den Linien und allen Symbol-/Label-Layern sichtbar bleibt. Teilt sich die Source mit dem Linien-Layer.",
                    olLayer: createNearestStopsOriginLayer(nearestStopsSource),
                    visible: true,
                    isBaseLayer: false
                })
            ]
        };
    }
}
