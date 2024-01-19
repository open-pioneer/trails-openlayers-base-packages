// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerBase, MapRegistry, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Editing } from "./api";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { ServiceOptions } from "@open-pioneer/runtime";
import GeoJSON from "ol/format/GeoJSON";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
import { HttpService } from "@open-pioneer/http";
import OlMap from "ol/Map";
import { StyleLike } from "ol/style/Style";

interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

interface EditingInteraction {
    // Temporally layer
    drawLayer: VectorLayer<VectorSource>;
    // Layer to add geometries
    editingLayer?: LayerBase;
    interaction: Draw;
    olMap: OlMap;
}

// TODO: Tooltip vom Messen abgucken
export class EditingImpl implements Editing {
    private readonly _mapRegistry: MapRegistry;
    private _httpService: HttpService;
    private _editingProcesses: Map<string, EditingInteraction>;
    private _polygonDrawStyle: StyleLike;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._mapRegistry = serviceOptions.references.mapRegistry;
        this._httpService = serviceOptions.references.httpService;
        this._editingProcesses = new Map();
        this._polygonDrawStyle = serviceOptions.properties.polygonDrawStyle as StyleLike;
    }

    async _initializeEditing(mapId: string) {
        const map = await this._mapRegistry.expectMapModel(mapId);
        const olMap = map.olMap;

        const drawSource = new VectorSource();
        const drawLayer = new VectorLayer({
            source: drawSource,
            zIndex: TOPMOST_LAYER_Z
        });
        olMap.addLayer(drawLayer);

        const drawInteraction = new Draw({
            source: drawSource,
            type: "Polygon",
            style: this._polygonDrawStyle
        });

        // Add EventListener on focused map to abort actual interaction via `Escape`
        const container: HTMLElement | undefined = olMap.getTargetElement() ?? undefined;
        if (container) {
            container.addEventListener(
                "keydown",
                (e: KeyboardEvent) => {
                    if (e.code === "Escape" && e.target === olMap.getTargetElement() && drawLayer) {
                        // TODO: Überprüfung active.editingLayer / drawLayer
                        this.reset(mapId);
                        console.log("Escape key");
                    }
                },
                false
            );
        }
        // this.emit("changed:container");
        // EventListener entfernen

        // ALternativ document / window.add Even --> constructor

        drawInteraction.on("drawend", (e) => {
            // todo use mapId to get correct layer --> get layer url
            const layerUrl =
                "https://ogc-api-test.nrw.de/inspire-us-krankenhaus/v1/collections/governmentalservice/items";

            const geometry = e.feature.getGeometry();
            if (!geometry) {
                console.log("no geometry available");
                // todo stop editing?
                return;
            }
            const geoJson = new GeoJSON({
                featureProjection: "EPSG:25832",
                dataProjection: "EPSG:25832" //map?.olMap.getView().getProjection() // todo is this correct and needed?
            });
            const geoJSONGeometry = geoJson.writeGeometryObject(geometry, {
                rightHanded: true,
                decimals: 10
            });
            // todo set default properties when saving feature?
            saveCreatedFeature(this._httpService, layerUrl, geoJSONGeometry);
            // todo stop editing (if request was successful)
        });

        // store that editing has been initialized for this map
        this._editingProcesses.set(mapId, {
            // TODO: Als Variable
            drawLayer: drawLayer,
            interaction: drawInteraction,
            olMap: olMap
        });

        return drawInteraction; // TODO: Rückgabe der aktuellen Interaktion?
    }

    async start(layer: LayerBase<{}>) {
        const mapId = layer.map.id;
        let active = this._editingProcesses.get(mapId);

        // initialize editing interaction, if not initialized for the map
        if (!active) {
            await this._initializeEditing(mapId);
            active = this._editingProcesses.get(mapId);
        }

        if (!active) {
            // TODO: Add error log message
            return;
        }

        // stop editing, if editing interaction is currently active
        if (active.editingLayer) {
            this.stop(mapId);
        }

        active.editingLayer = layer;
        this._editingProcesses.set(mapId, active);

        active.olMap.addInteraction(active.interaction);
    }

    // TODO: sicherheitsabfrage, falls stopEditing ausgeführt wird, wenn Feature nicht zu Ende gezeichnet wurde
    async stop(mapId: string) {
        const active = this._editingProcesses.get(mapId);

        if (!active) {
            return;
        }

        active.drawLayer.getSource()?.clear();

        active.editingLayer = undefined;
        this._editingProcesses.set(mapId, active);

        active.olMap.removeInteraction(active.interaction);
    }

    // TODO: sicherheitsabfrage, falls stopEditing ausgeführt wird, wenn Feature nicht zu Ende gezeichnet wurde
    reset(mapId: string) {
        const active = this._editingProcesses.get(mapId);

        if (!active) {
            return;
        }

        active.interaction.abortDrawing();
    }
}
