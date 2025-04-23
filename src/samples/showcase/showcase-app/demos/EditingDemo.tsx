// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Reactive, reactive, watch } from "@conterra/reactivity-core";
import { Button, Flex } from "@open-pioneer/chakra-integration";
import { Resource } from "@open-pioneer/core";
import { EditingService, type EditingWorkflow } from "@open-pioneer/editing";
import { Layer, MapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { Overlay } from "ol";
import { EventsKey } from "ol/events";
import { FeatureLike } from "ol/Feature";
import { Select } from "ol/interaction";
import VectorLayer from "ol/layer/Vector";
import { unByKey } from "ol/Observable";
import VectorSource from "ol/source/Vector";
import { useIntl } from "open-pioneer:react-hooks";
import { ReactNode } from "react";
import { Demo, DemoModel, SharedDemoOptions } from "./Demo";

const EDIT_LAYER_ID: string = "krankenhaus";

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
    description: ReactNode;
    mainWidget: ReactNode;

    #mapModel: MapModel;
    #editingController: EditingController;

    constructor(options: SharedDemoOptions) {
        const { mapModel, intl, editingService, notificationService } = options;

        this.#mapModel = mapModel;

        this.description = intl.formatRichMessage({ id: "demos.editing.description" });
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

    #selectInteraction: Select | undefined;
    #editUpdateSelectHandler: EventsKey | undefined;
    #updateEditSelectTooltip: Tooltip | undefined;

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
        if (this.#editingActive.value) {
            return;
        }

        try {
            this.#editingActive.value = true;

            const layer = this.#mapModel.layers.getLayerById("krankenhaus") as Layer;
            const url = new URL(layer.attributes.collectionURL + "/items");
            const workflow = this.#editingService.createFeature(this.#mapModel, url);
            this._watchState(workflow);
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

                    const vectorLayer = layer?.olLayer as VectorLayer<
                        VectorSource<FeatureLike>,
                        FeatureLike
                    >;
                    vectorLayer.getSource()?.refresh();
                })
                .catch((error: Error) => {
                    console.error(error);
                })
                .finally(() => {
                    this.#editingActive.value = false;
                });
        } catch (error) {
            this.#editingActive.value = false;
            console.error(error);
        }
    }

    startUpdateWorkflow() {
        if (this.#editingActive.value) {
            return;
        }

        try {
            this.#editingActive.value = true;
            this.#updateEditSelectTooltip = this._createEditingSelectTooltip();

            const layer = this.#mapModel.layers.getLayerById("krankenhaus") as Layer;
            const vectorLayer = layer?.olLayer as VectorLayer<
                VectorSource<FeatureLike>,
                FeatureLike
            >;

            this.#selectInteraction = new Select({
                layers: [vectorLayer]
            });

            this.#mapModel.olMap.addInteraction(this.#selectInteraction);
            this.#updateEditSelectTooltip.element.classList.remove("editing-tooltip-hidden");

            this.#editUpdateSelectHandler = this.#selectInteraction.on("select", (e) => {
                const selected = e.selected;
                const deselected = e.deselected;
                if (selected.length !== 1 || deselected.length !== 0) {
                    return;
                }

                this._stopUpdateSelection();
                const feature = selected[0];
                if (!feature) {
                    throw Error("feature is undefined");
                }

                const url = new URL(layer.attributes.collectionURL + "/items");
                const workflow = this.#editingService.updateFeature(this.#mapModel, url, feature);
                this._watchState(workflow);
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
            });
        } catch (error) {
            this.#editingActive.value = false;
            console.error(error);
        }
    }

    _watchState(workflow: EditingWorkflow) {
        const watchStateHandle = watch(
            () => [workflow.getState()],
            (newState) => {
                if (newState[0] === "active:saving") {
                    this.#notificationService.notify({
                        level: "info",
                        message: this.#intl.formatMessage({
                            id: "demos.editing.update.savingStared"
                        })
                    });
                }
                if (newState[0] === "destroyed") {
                    watchStateHandle.destroy();
                    console.log("destroyed");
                }
            }
        );
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
        this.#selectInteraction && this.#mapModel.olMap.removeInteraction(this.#selectInteraction);
        this.#editUpdateSelectHandler && unByKey(this.#editUpdateSelectHandler);
        this.#updateEditSelectTooltip && this.#updateEditSelectTooltip.destroy();

        this.#selectInteraction = undefined;
        this.#editUpdateSelectHandler = undefined;
        this.#updateEditSelectTooltip = undefined;
    }

    stopEditing() {
        this.#editingService.stop(this.#mapModel);
        this._stopUpdateSelection();
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
