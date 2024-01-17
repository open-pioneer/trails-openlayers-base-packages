// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { LayerBase, MapRegistry, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { Editing } from "./api";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { ServiceOptions } from "@open-pioneer/runtime";
import GeoJSON from "ol/format/GeoJSON";
import { Polygon } from "ol/geom";
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

export class EditingImpl implements Editing {
    private readonly _mapRegistry: MapRegistry;
    _httpService: HttpService;
    private editingInteractions: Map<string, EditingInteraction>;
    private defaultStyle: StyleLike;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._mapRegistry = serviceOptions.references.mapRegistry;
        this._httpService = serviceOptions.references.httpService;
        this.editingInteractions = new Map();
        this.defaultStyle = serviceOptions.properties.defaultStyle as StyleLike;
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
            style: this.defaultStyle
        });

        // Add EventListener on focused map to abort actual interaction via `Escape`
        const container: HTMLElement | undefined = olMap.getTargetElement() ?? undefined;
        if (container) {
            container.addEventListener(
                "keydown",
                (e: KeyboardEvent) => {
                    if (e.code === "Escape" && e.target === olMap.getTargetElement()) {
                        this.reset(mapId);
                    }
                },
                false
            );
        }

        drawInteraction.on("drawend", (e) => {
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

        // store that editing has been initialized for this map
        this.editingInteractions.set(mapId, {
            drawLayer: drawLayer,
            interaction: drawInteraction,
            olMap: olMap
        });

        return drawInteraction;
    }

    async start(layer: LayerBase<{}>) {
        const mapId = layer.map.id;
        let active = this.editingInteractions.get(mapId);

        // initialize editing interaction, if not initialized for the map
        if (!active) {
            await this._initializeEditing(mapId);
            active = this.editingInteractions.get(mapId);
        }

        if (!active) {
            return;
        }

        // stop editing, if editing interaction is currently active
        if (active.editingLayer) {
            this.stop(mapId);
        }

        active.editingLayer = layer;
        this.editingInteractions.set(mapId, active);

        active.olMap.addInteraction(active.interaction);
    }

    // TODO: sicherheitsabfrage, falls stopEditing ausgeführt wird, wenn Feature nicht zu Ende gezeichnet wurde
    async stop(mapId: string) {
        const active = this.editingInteractions.get(mapId);

        if (!active) {
            return;
        }

        // TODO: Move into EventLister drawEnd
        // active.drawLayer.getSource()?.clear();

        active.editingLayer = undefined;
        this.editingInteractions.set(mapId, active);

        active.olMap.removeInteraction(active.interaction);
    }

    // TODO: sicherheitsabfrage, falls stopEditing ausgeführt wird, wenn Feature nicht zu Ende gezeichnet wurde
    reset(mapId: string) {
        const active = this.editingInteractions.get(mapId);

        if (!active) {
            return;
        }

        active.interaction.abortDrawing();
    }
}
