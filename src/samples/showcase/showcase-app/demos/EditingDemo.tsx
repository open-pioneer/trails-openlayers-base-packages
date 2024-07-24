// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Demo, DemoModel, SharedDemoOptions } from "./Demo";
import { Button, Flex } from "@open-pioneer/chakra-integration";
import { useIntl } from "open-pioneer:react-hooks";
import { EditingService } from "@open-pioneer/editing";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Layer, MapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import VectorLayer from "ol/layer/Vector";
import { FeatureLike } from "ol/Feature";
import { Select } from "ol/interaction";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import { Overlay } from "ol";
import { Resource } from "@open-pioneer/core";
import { ReactNode } from "react";
import { PackageIntl } from "@open-pioneer/runtime";
import { Reactive, reactive } from "@conterra/reactivity-core";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";

const EDIT_LAYER_ID: string = "krankenhaus";
let selectInteraction: Select | undefined;
let editUpdateSelectHandler: EventsKey | undefined;
let updateEditSelectTooltip: Tooltip | undefined;

// Represents a tooltip rendered on the OpenLayers map
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

export function createEditingDemo(options: SharedDemoOptions): Demo {
    return {
        id: "editing",
        title: options.intl.formatMessage({ id: "demos.editing.title" }),
        createModel() {
            return new DemoModelImpl(options);
        }
    };
}

class DemoModelImpl implements DemoModel {
    description: string;
    mainWidget: ReactNode;

    #mapModel: MapModel;
    #editingController: EditingController;

    constructor(options: SharedDemoOptions) {
        const { mapModel, intl, editingService, notificationService } = options;

        this.#mapModel = mapModel;

        this.description = intl.formatMessage({ id: "demos.editing.description" });
        this.#editingController = new EditingController(
            mapModel,
            editingService,
            notificationService,
            intl
        );

        this.mainWidget = <EditingButtons editingController={this.#editingController} />;

        this._setEditLayerVisible(true);
    }

    destroy() {
        this._setEditLayerVisible(false);
        this.#editingController.stopEditing();
    }

    _setEditLayerVisible(visible: boolean = true): void {
        const editLayer = this.#mapModel.layers.getLayerById(EDIT_LAYER_ID) as Layer;
        editLayer.setVisible(visible);
    }
}

class EditingController {
    #editingActive: Reactive<boolean>;
    #mapModel: MapModel;
    #editingService: EditingService;
    #notificationService: NotificationService;
    #intl: PackageIntl;

    constructor(
        mapModel: MapModel,
        editingService: EditingService,
        notificationService: NotificationService,
        intl: PackageIntl
    ) {
        this.#editingActive = reactive(false);
        this.#mapModel = mapModel;
        this.#editingService = editingService;
        this.#notificationService = notificationService;
        this.#intl = intl;
    }

    editingActive() {
        return this.#editingActive.value;
    }

    startCreateWorkflow() {
        try {
            this.#editingActive.value = true;

            const layer = this.#mapModel.layers.getLayerById("krankenhaus") as Layer;
            const url = new URL(layer.attributes.collectionURL + "/items");

            const workflow = this.#editingService.createFeature(this.#mapModel, url);

            workflow
                .whenComplete()
                .then((featureData: Record<string, string> | undefined) => {
                    if (!featureData) {
                        return;
                    }

                    this.#notificationService.notify({
                        level: "info",
                        message: this.#intl.formatMessage(
                            {
                                id: "demos.editing.create.featureCreated"
                            },
                            { featureId: featureData.featureId }
                        )
                    });

                    const vectorLayer = layer?.olLayer as VectorLayer<FeatureLike>;
                    vectorLayer.getSource()?.refresh();
                })
                .catch((error: Error) => {
                    console.error(error);
                })
                .finally(() => {
                    this.#editingActive.value = false;
                });
        } catch (error) {
            console.error(error);
        }
    }

    startUpdateWorkflow() {
        try {
            this.#editingActive.value = true;

            updateEditSelectTooltip = this._createEditingSelectTooltip();

            const layer = this.#mapModel.layers.getLayerById("krankenhaus") as Layer;
            const vectorLayer = layer?.olLayer as VectorLayer<FeatureLike>;

            selectInteraction = new Select({
                layers: [vectorLayer]
            });

            this.#mapModel.olMap.addInteraction(selectInteraction);
            updateEditSelectTooltip.element.classList.remove("editing-tooltip-hidden");

            const url = new URL(layer.attributes.collectionURL + "/items");

            editUpdateSelectHandler = selectInteraction.on("select", (e) => {
                const selected = e.selected;
                const deselected = e.deselected;

                if (selected.length === 1 && deselected.length === 0) {
                    this._stopUpdateSelection();

                    const feature = selected[0];
                    if (!feature) {
                        throw Error("feature is undefined");
                    }

                    const workflow = this.#editingService.updateFeature(
                        this.#mapModel,
                        url,
                        feature
                    );

                    workflow
                        .whenComplete()
                        .then((featureData: Record<string, string> | undefined) => {
                            if (!featureData) {
                                return;
                            }

                            this.#notificationService.notify({
                                level: "info",
                                message: this.#intl.formatMessage(
                                    {
                                        id: "demos.editing.update.featureModified"
                                    },
                                    { featureId: featureData.featureId }
                                )
                            });

                            vectorLayer.getSource()?.refresh();
                        })
                        .catch((error: Error) => {
                            console.error(error);
                        })
                        .finally(() => {
                            this.#editingActive.value = false;
                        });
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    _createEditingSelectTooltip(): Tooltip {
        const element = document.createElement("div");
        element.className = "editing-tooltip editing-tooltip-hidden";
        element.textContent = this.#intl.formatMessage({
            id: "demos.editing.update.tooltip.select"
        });

        const overlay = new Overlay({
            element: element,
            offset: [15, 0],
            positioning: "center-left"
        });

        const olMap = this.#mapModel.olMap;
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

    _stopUpdateSelection() {
        selectInteraction && this.#mapModel.olMap.removeInteraction(selectInteraction);
        editUpdateSelectHandler && unByKey(editUpdateSelectHandler);
        updateEditSelectTooltip && updateEditSelectTooltip.destroy();

        selectInteraction = undefined;
        editUpdateSelectHandler = undefined;
        updateEditSelectTooltip = undefined;
    }

    stopEditing() {
        this.#editingService.stop(MAP_ID);
        if (this.#mapModel) this._stopUpdateSelection();
        this.#editingActive.value = false;
    }
}

interface EditingButtonProps {
    editingController: EditingController;
}

function EditingButtons({ editingController }: EditingButtonProps) {
    const intl = useIntl();
    const editingActive = useReactiveSnapshot(
        () => editingController.editingActive(),
        [editingController]
    );

    const infoText = editingActive
        ? intl.formatMessage({ id: "demos.editing.activeInfo" })
        : intl.formatMessage({ id: "demos.editing.inactiveInfo" });

    return (
        <>
            <Flex px={1} py={1}>
                <Button
                    mr={2}
                    isDisabled={editingActive}
                    onClick={() => {
                        editingController.startCreateWorkflow();
                    }}
                >
                    {intl.formatMessage({ id: "demos.editing.startCreateButton" })}
                </Button>
                <Button
                    mr={2}
                    isDisabled={editingActive}
                    onClick={() => {
                        editingController.startUpdateWorkflow();
                    }}
                >
                    {intl.formatMessage({ id: "demos.editing.startUpdateButton" })}
                </Button>
                <Button
                    isDisabled={!editingActive}
                    onClick={() => {
                        editingController.stopEditing();
                    }}
                >
                    {intl.formatMessage({ id: "demos.editing.stopButton" })}
                </Button>
            </Flex>
            <Flex px={1} py={1}>
                {infoText}
            </Flex>
        </>
    );
}
