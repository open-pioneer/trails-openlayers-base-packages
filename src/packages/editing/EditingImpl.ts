// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger, Resource } from "@open-pioneer/core";
import { LayerBase, MapRegistry, TOPMOST_LAYER_Z } from "@open-pioneer/map";
import { PackageIntl } from "@open-pioneer/runtime";
import { Editing } from "./api";
import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { ServiceOptions } from "@open-pioneer/runtime";
import GeoJSON from "ol/format/GeoJSON";
import { unByKey } from "ol/Observable";
import Overlay from "ol/Overlay";
import { saveCreatedFeature } from "./SaveFeaturesHandler";
import { HttpService } from "@open-pioneer/http";
import OlMap from "ol/Map";
import { StyleLike } from "ol/style/Style";
import { EventsKey } from "ol/events";

const LOG = createLogger("editing:EditingImpl");

interface References {
    mapRegistry: MapRegistry;
    httpService: HttpService;
}

// Represents a tooltip rendered on the OpenLayers map
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

interface EditingInteraction {
    // Temporally layer
    drawLayer: VectorLayer<VectorSource>;
    // Layer to add geometries
    editingLayer?: LayerBase;
    interaction: Draw;
    olMap: OlMap;
    tooltip: Tooltip;
}

export class EditingImpl implements Editing {
    private readonly _mapRegistry: MapRegistry;
    private _httpService: HttpService;
    private _editingProcesses: Map<string, EditingInteraction>;
    private _polygonDrawStyle: StyleLike;
    private _intl: PackageIntl;
    private _interactionListener: Array<EventsKey>;
    private _mapListener: Array<Resource>;

    constructor(serviceOptions: ServiceOptions<References>) {
        this._mapRegistry = serviceOptions.references.mapRegistry;
        this._httpService = serviceOptions.references.httpService;
        this._editingProcesses = new Map();
        this._polygonDrawStyle = serviceOptions.properties.polygonDrawStyle as StyleLike;
        this._intl = serviceOptions.intl;
        this._interactionListener = [];
        this._mapListener = [];
    }

    destroy() {
        // Remove event listener on interaction and on map
        this._interactionListener.map((interaction) => {
            unByKey(interaction);
        });
        this._mapListener.map((map) => {
            map.destroy();
        });

        // Stop all processes
        const mapKeys = this._editingProcesses.keys();
        let k = 0;
        while (k < this._editingProcesses.size) {
            this.stop(mapKeys.next().value);
            k++;
        }

        const mapValues = this._editingProcesses.values();
        let i = 0;
        while (i < this._editingProcesses.size) {
            const value = mapValues.next().value;

            // Remove layer from olMap
            value.olMap.removeLayer(value.drawLayer);

            // Remove tooltip
            value.tooltip.destroy();

            // Remove event escape listener
            value.olMap.getTargetElement().removeEventListener("keydown", value.escapeHandler);

            i++;
        }

        this._editingProcesses.clear;
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

        const escapeHandler = (e: KeyboardEvent) => {
            if (e.code === "Escape" && e.target === olMap.getTargetElement()) {
                this.reset(mapId);
            }
        };

        // Add EventListener on focused map to abort actual interaction via `Escape`
        let mapContainer: HTMLElement | undefined = olMap.getTargetElement() ?? undefined;
        if (mapContainer) {
            mapContainer.addEventListener("keydown", escapeHandler, false);
        }

        const tooltip = this.createTooltip(olMap);

        this._interactionListener.push(
            drawInteraction.on("drawstart", () => {
                tooltip.element.textContent = this._intl.formatMessage({ id: "tooltip.continue" });
            })
        );

        this._interactionListener.push(
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
            })
        );

        // store that editing has been initialized for this map
        const editProcess = {
            drawLayer: drawLayer,
            interaction: drawInteraction,
            olMap: olMap,
            tooltip: tooltip,
            escapeHandler: escapeHandler
        };
        this._editingProcesses.set(mapId, editProcess);

        // update event handler when container changes
        this._mapListener.push(
            map.on("changed:container", () => {
                mapContainer?.removeEventListener("keydown", escapeHandler);

                mapContainer = olMap.getTargetElement() ?? undefined;
                if (mapContainer) {
                    mapContainer.addEventListener("keydown", escapeHandler, false);
                }
            })
        );

        return editProcess;
    }

    async start(layer: LayerBase<{}>) {
        const mapId = layer.map.id;
        let active = this._editingProcesses.get(mapId);

        // initialize editing interaction, if not initialized for the map
        if (!active) {
            active = await this._initializeEditing(mapId);
        }

        if (!active) {
            LOG.error("Initializing editing process failed");
            return;
        }

        // stop editing, if editing interaction is currently active
        if (active.editingLayer) {
            this.stop(mapId);
        }

        active.editingLayer = layer;
        active.tooltip.element.classList.remove("hidden");
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

        active.tooltip.element.classList.add("hidden");
        active.tooltip.element.textContent = this._intl.formatMessage({ id: "tooltip.begin" });
    }

    // TODO: sicherheitsabfrage, falls stopEditing ausgeführt wird, wenn Feature nicht zu Ende gezeichnet wurde
    reset(mapId: string) {
        const active = this._editingProcesses.get(mapId);

        // no reset possible/needed when editing is not active
        if (!active || !active.editingLayer) {
            return;
        }

        active.interaction.abortDrawing();

        active.tooltip.element.textContent = this._intl.formatMessage({ id: "tooltip.begin" });
    }

    private createTooltip(olMap: OlMap): Tooltip {
        const element = document.createElement("div");
        element.className = "editing-tooltip hidden";
        element.textContent = this._intl.formatMessage({ id: "tooltip.begin" });

        const overlay = new Overlay({
            element: element,
            offset: [15, 0],
            positioning: "center-left"
        });

        const pointerMove = olMap.on("pointermove", (evt) => {
            if (evt.dragging) {
                return;
            }

            overlay.setPosition(evt.coordinate);
        });

        olMap.addOverlay(overlay);

        return {
            overlay,
            element,
            destroy() {
                unByKey(pointerMove);
                olMap.removeOverlay(overlay);
            }
        };
    }
}
