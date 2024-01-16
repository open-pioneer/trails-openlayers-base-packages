// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Layer, MapRegistry, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { StyleLike } from "ol/style/Style";
import { Editing } from "./api";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { ServiceOptions } from "@open-pioneer/runtime";
import GeoJSON from "ol/format/GeoJSON";
import { Polygon } from "ol/geom";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
import { HttpService } from "@open-pioneer/http";

interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

export class EditingImpl implements Editing {
    private readonly _mapRegistry: MapRegistry;
    _httpService: HttpService;
    private activeLayer?: Layer;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._mapRegistry = serviceOptions.references.mapRegistry;
        this._httpService = serviceOptions.references.httpService;
    }

    async _initializeEditing(mapId: string) {
        // todo check if was initialized for map
        // if not:
        const map = await this._mapRegistry.expectMapModel(mapId);

        const olMap = map.olMap;
        this.activeLayer = undefined;

        // todo use pioneer tools to create layer? --> if yes, add specific id to layer (e.g. "editingDrawLayer_MAPID")
        // Create and add draw source and layer to map
        const drawSource = new VectorSource();
        const drawLayer = new VectorLayer({
            source: drawSource,
            // style: editingStyle, todo use default style and allow to set style using service properties
            zIndex: TOPMOST_LAYER_Z
        });
        olMap.addLayer(drawLayer);

        // Create draw interaction
        const drawInteraction = new Draw({
            source: drawSource,
            type: "Polygon"
        });

        // Add event listener
        const drawAbortListener = drawInteraction.on("drawabort", () => {});
        const drawEndListener = drawInteraction.on("drawend", (e) => {
            // todo use mapId to get correct layer --> get layer url
            const layerUrl =
                "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1/collections/governmentalservice/items";

            const feature = e.feature;
            console.log(feature);
            // todo use actual feature
            const geoJson = new GeoJSON({
                featureProjection: "EPSG:4326",
                dataProjection: "EPSG:4326" //map?.olMap.getView().getProjection() // todo is this correct and needed?
            });
            const geom = new Polygon(
                [
                    6.850718726572426, 51.29967131678409, 6.85358546685978, 51.29972391849959,
                    6.853501609969469, 51.30152106245272, 6.850634757893364, 51.30146845737751,
                    6.850718726572426, 51.29967131678409
                ],
                "XY",
                [10]
            );
            const geoJSONGeometry = geoJson.writeGeometryObject(geom, {
                rightHanded: true,
                decimals: 10
            });
            // todo set default properties when saving feature?
            saveCreatedFeature(this._httpService, layerUrl, geoJSONGeometry);
        });
        const errorListener = drawInteraction.on("error", () => {
            // Todo
        });

        // todo register esc listener if possible to do only for focussed map --> call method resetDrawing

        // store that editing has been intitialized for this map
        // e.g. JS map: "MAPID": DrawInteraction;
        return drawInteraction;
    }

    async startEditing(layer: Layer<{}>) {
        // todo: get map and mapID from layer

        // stopEditing before startEditing, if activeLayer is set
        if (this.activeLayer) {
            // todo in abhaengigkeit von mapID pruefen
            this.stopEditing();
        }

        const drawInteraction = await this._initializeEditing("main"); // todo mapId

        // Set active layer to configured layer
        this.activeLayer = layer; // todo in abhaenigekeit von mapId merken

        const map = await this._mapRegistry.getMapModel("main"); // todo remove
        map?.olMap.addInteraction(drawInteraction);
    }

    // todo oder layer als input, dann aber auch eine getActiveEditedLayerForMap methode einfuehren
    stopEditing(mapId: string): void {
        // Delete all features from draw source
        this.drawSource.clear();

        // Unset active layer
        this.activeLayer = undefined;

        this.olMap.removeInteraction(this.drawInteraction);
    }

    resetDrawing(mapId: string) {
        // Todo sicherheitsabfrage?
    }
}
