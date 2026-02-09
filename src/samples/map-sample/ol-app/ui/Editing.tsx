// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, HStack, Text } from "@chakra-ui/react";
import {
    Resource,
    createAbortError,
    createLogger,
    createManualPromise,
    isAbortError
} from "@open-pioneer/core";
import { EditingService, EditingWorkflow } from "@open-pioneer/editing";
import { Layer, MapModel, useMapModelValue } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { Feature, Overlay } from "ol";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";
import { EventsKey } from "ol/events";
import { Geometry } from "ol/geom";
import { Select } from "ol/interaction";
import { SelectEvent } from "ol/interaction/Select";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import { useEffect, useId, useState } from "react";
import { AppModel } from "../AppModel";

const LOG = createLogger(sourceId);

export type EditingKind = "create" | "update";

export function EditingComponent(props: { kind: EditingKind }) {
    const editingViewModel = useEditingViewModel(props.kind);
    const editingTitleId = useId();
    const intl = useIntl();
    return (
        <Box role="dialog" aria-labelledby={editingTitleId}>
            <TitledSection
                title={
                    <SectionHeading id={editingTitleId} size="md" mb={2}>
                        {intl.formatMessage({
                            id: "editing.title"
                        })}
                    </SectionHeading>
                }
            >
                <Box overflowY="auto" maxHeight={300}>
                    <Text textAlign="center">
                        {intl.formatMessage({
                            id: "editing.active"
                        })}
                    </Text>
                    <HStack mt={4} align="center" justify="center">
                        <Button
                            onClick={() => {
                                editingViewModel?.reset();
                            }}
                        >
                            {intl.formatMessage({
                                id: "editing.resetGeometry"
                            })}
                        </Button>
                        <Button
                            onClick={() => {
                                editingViewModel?.destroy();
                            }}
                        >
                            {intl.formatMessage({
                                id: "editing.abort"
                            })}
                        </Button>
                    </HStack>
                </Box>
            </TitledSection>
        </Box>
    );
}

function useEditingViewModel(kind: EditingKind): EditingViewModel | undefined {
    const notificationService = useService<NotificationService>("notifier.NotificationService");
    const editingService = useService<EditingService>("editing.EditingService");
    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");
    const map = useMapModelValue(); // uses default map configured in AppUI.tsx

    const [viewModel, setViewModel] = useState<EditingViewModel>();
    useEffect(() => {
        const vm = new EditingViewModel(
            notificationService,
            editingService,
            map,
            intl,
            appModel,
            kind
        );
        setViewModel(vm);
        return () => {
            vm.destroy();
            setViewModel(undefined);
        };
    }, [appModel, editingService, intl, map, notificationService, kind]);
    return viewModel;
}

interface EditingJob {
    reset(): void;
    destroy(): void;

    run(): Promise<void>;
}

/**
 * The view model manages a single update/create workflow.
 */
class EditingViewModel {
    private notificationService: NotificationService;
    private editingService: EditingService;
    private map: MapModel;
    private intl: PackageIntl;
    private appModel: AppModel;
    private kind: EditingKind;

    private job: EditingJob | undefined;

    constructor(
        notificationService: NotificationService,
        editingService: EditingService,
        map: MapModel,
        intl: PackageIntl,
        appModel: AppModel,
        kind: EditingKind
    ) {
        this.notificationService = notificationService;
        this.editingService = editingService;
        this.map = map;
        this.intl = intl;
        this.appModel = appModel;
        this.kind = kind;

        let job: EditingJob;
        switch (kind) {
            case "create":
                job = this.createJob();
                break;
            case "update":
                job = this.updateJob();
                break;
        }
        this.job = job;
        this.job
            .run()
            .catch((error) => {
                if (!isAbortError(error)) {
                    LOG.error("Edit operation failed", error);

                    this.notificationService.notify({
                        level: "error",
                        message: this.intl.formatMessage({
                            id: "editing.error"
                        })
                    });
                }
            })
            .finally(() => {
                this.destroy(); // Hide UI
            });
    }

    destroy() {
        this.job?.destroy();
        this.job = undefined;
        this.appModel.hideContent(`editing-${this.kind}`);
    }

    reset() {
        this.job?.reset();
    }

    private createJob(): EditingJob {
        let workflow: EditingWorkflow | undefined;
        return {
            destroy() {
                workflow?.stop();
                workflow = undefined;
            },

            reset() {
                workflow?.reset();
            },

            run: async () => {
                const layer = this.findLayer();
                const url = new URL(layer.attributes.collectionURL + "/items");
                workflow = this.editingService.createFeature(this.map, url);

                const featureData = await workflow.whenComplete();
                workflow = undefined;

                if (!featureData) {
                    return;
                }

                this.notificationService.notify({
                    level: "info",
                    message: this.intl.formatMessage(
                        {
                            id: "editing.create.featureCreated"
                        },
                        { featureId: featureData.featureId }
                    )
                });

                const vectorLayer = layer?.olLayer as VectorLayer<VectorSource, Feature>;
                vectorLayer.getSource()?.refresh(); // trigger reload to show feature
            }
        };
    }

    private updateJob(): EditingJob {
        const map = this.map;

        const abortController = new AbortController();
        const signal = abortController.signal;
        let tooltip: Tooltip | undefined;
        let selectInteraction: Select | undefined;
        let workflow: EditingWorkflow | undefined;

        function stopSelect() {
            selectInteraction && map.olMap.removeInteraction(selectInteraction);
            selectInteraction && selectInteraction.dispose();
            tooltip && tooltip.destroy();
            abortController.abort();

            selectInteraction = undefined;
            tooltip = undefined;
        }

        return {
            destroy() {
                stopSelect();
                workflow?.stop();
                workflow = undefined;
            },

            reset() {
                workflow?.reset();
            },

            run: async () => {
                const layer = this.findLayer();
                const vectorLayer = layer.olLayer as VectorLayer<VectorSource, Feature>;
                const url = new URL(layer.attributes.collectionURL + "/items");

                selectInteraction = new Select({
                    layers: [vectorLayer]
                });
                map.olMap.addInteraction(selectInteraction);

                tooltip = createEditingTooltip(this.intl, map.olMap);
                tooltip.element.classList.remove("editing-tooltip-hidden");

                let feature: Feature<Geometry> | undefined;
                // eslint-disable-next-line no-constant-condition
                while (1) {
                    const { selected, deselected } = await waitForSelection(
                        selectInteraction,
                        signal
                    );
                    if (selected.length === 1 && deselected.length === 0) {
                        stopSelect();
                        feature = selected[0];
                        break;
                    }
                }

                if (!feature) {
                    throw Error("Feature is undefined");
                }

                workflow = this.editingService.updateFeature(map, url, feature);
                const featureData = await workflow.whenComplete();
                if (!featureData) {
                    return;
                }

                this.notificationService.notify({
                    level: "info",
                    message: this.intl.formatMessage(
                        {
                            id: "editing.update.featureModified"
                        },
                        { featureId: featureData.featureId }
                    )
                });

                vectorLayer.getSource()?.refresh(); // trigger reload to show feature
            }
        };
    }

    private findLayer() {
        const layer = this.map.layers.getLayerById("krankenhaus") as Layer | undefined;
        if (!layer) {
            throw new Error("Layer not found");
        }
        return layer;
    }
}

interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

function createEditingTooltip(intl: PackageIntl, olMap: OlMap): Tooltip {
    const element = document.createElement("div");
    element.className = "editing-tooltip editing-tooltip-hidden";
    element.textContent = intl.formatMessage({ id: "editing.update.tooltip.select" });

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

function waitForSelection(selection: Select, signal: AbortSignal): Promise<SelectEvent> {
    let eventKey: EventsKey | undefined;
    const { promise, resolve, reject } = createManualPromise<SelectEvent>();
    if (signal.aborted) {
        reject(createAbortError());
        return promise;
    }

    const rejectOnAbort = () => {
        eventKey && unByKey(eventKey);
        eventKey = undefined;
        reject(createAbortError());
    };

    signal.addEventListener("abort", rejectOnAbort);
    eventKey = selection.on("select", (e) => {
        signal.removeEventListener("abort", rejectOnAbort);
        eventKey && unByKey(eventKey);
        eventKey = undefined;
        resolve(e);
    });
    return promise;
}
