// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { Geolocation } from "@open-pioneer/geolocation";
import { EditingService } from "@open-pioneer/editing";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton, useEvent } from "@open-pioneer/react-utils";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { TbPolygon, TbPolygonOff } from "react-icons/tb";

import {
    PiArrowUUpLeft,
    PiBookmarksSimpleBold,
    PiImagesLight,
    PiListLight,
    PiListMagnifyingGlassFill,
    PiMapTrifold,
    PiPrinterBold,
    PiPencil,
    PiPencilSlash,
    PiRulerLight,
    PiSelectionPlusBold
} from "react-icons/pi";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Layer, LayerBase, MapModel, useMapModel } from "@open-pioneer/map";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { useEffect } from "react";
import { NotificationService } from "@open-pioneer/notifier";
import { PackageIntl } from "@open-pioneer/runtime";
import { AppModel } from "../AppModel";
import { useSnapshot } from "valtio";

export interface ToolState {
    bookmarksActive: boolean;
    tocActive: boolean;
    legendActive: boolean;
    measurementActive: boolean;
    selectionActive: boolean;
    overviewMapActive: boolean;
    printingActive: boolean;
    editingCreateActive: boolean;
    editingUpdateActive: boolean;
}

export interface MapToolsProps {
    /**
     * Controls the `active` state of all tool buttons.
     */
    toolState: ToolState;

    /**
     * Called by the component when a tool button shall be toggled on or off.
     */
    onToolStateChange(toolStateName: keyof ToolState, newValue: boolean): void;
}

export function MapTools(props: MapToolsProps) {
    const { toolState, onToolStateChange } = props;
    const intl = useIntl();
    const appModel = useService<unknown>("ol-app.AppModel") as AppModel;
    const resultListState = useSnapshot(appModel.state).resultListState;
    const resultListOpen = resultListState.open;
    const { map } = useMapModel(MAP_ID);
    const editingService = useService<EditingService>("editing.EditingService");
    const notificationService = useService<NotificationService>("notifier.NotificationService");

    const toggleToolState = useEvent((name: keyof ToolState, newValue?: boolean) => {
        onToolStateChange(name, newValue ?? !toolState[name]);
    });

    useEditingCreateWorkflow(
        map,
        editingService,
        notificationService,
        intl,
        toolState,
        toggleToolState
    );

    useEditingUpdateWorkflow(
        map,
        editingService,
        notificationService,
        intl,
        toolState,
        toggleToolState
    );

    return (
        <Flex
            role="toolbar"
            aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
            direction="column"
            gap={1}
            padding={1}
        >
            <ToolButton
                label={
                    toolState.editingCreateActive
                        ? intl.formatMessage({ id: "editing.stopTitle" })
                        : intl.formatMessage({ id: "editing.create.startTitle" })
                }
                icon={toolState.editingCreateActive ? <TbPolygonOff /> : <TbPolygon />}
                isActive={toolState.editingCreateActive}
                onClick={() => toggleToolState("editingCreateActive")}
            />
            <ToolButton
                label={
                    toolState.editingUpdateActive
                        ? intl.formatMessage({ id: "editing.stopTitle" })
                        : intl.formatMessage({ id: "editing.update.startTitle" })
                }
                icon={toolState.editingUpdateActive ? <PiPencilSlash /> : <PiPencil />}
                isActive={toolState.editingUpdateActive}
                onClick={() => toggleToolState("editingUpdateActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "editing.resetTitle" })}
                icon={<PiArrowUUpLeft />}
                onClick={() => editingService.reset(MAP_ID)}
            />

            {resultListState.input && (
                <ToolButton
                    label={intl.formatMessage({ id: "resultListTitle" })}
                    icon={<PiListMagnifyingGlassFill />}
                    isActive={resultListState.open}
                    onClick={() => appModel.setResultListVisibility(!resultListOpen)}
                />
            )}
            <ToolButton
                label={intl.formatMessage({ id: "printingTitle" })}
                icon={<PiPrinterBold />}
                isActive={toolState.printingActive}
                onClick={() => toggleToolState("printingActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "spatialBookmarkTitle" })}
                icon={<PiBookmarksSimpleBold />}
                isActive={toolState.bookmarksActive}
                onClick={() => toggleToolState("bookmarksActive")}
            />
            <Geolocation mapId={MAP_ID}></Geolocation>
            <ToolButton
                label={intl.formatMessage({ id: "tocTitle" })}
                icon={<PiListLight />}
                isActive={toolState.tocActive}
                onClick={() => toggleToolState("tocActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "legendTitle" })}
                icon={<PiImagesLight />}
                isActive={toolState.legendActive}
                onClick={() => toggleToolState("legendActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "measurementTitle" })}
                icon={<PiRulerLight />}
                isActive={toolState.measurementActive}
                onClick={() => toggleToolState("measurementActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "selectionTitle" })}
                icon={<PiSelectionPlusBold />}
                isActive={toolState.selectionActive}
                onClick={() => toggleToolState("selectionActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "overviewMapTitle" })}
                icon={<PiMapTrifold />}
                isActive={toolState.overviewMapActive}
                onClick={() => toggleToolState("overviewMapActive")}
            />
            <InitialExtent mapId={MAP_ID} />
            <ZoomIn mapId={MAP_ID} />
            <ZoomOut mapId={MAP_ID} />
        </Flex>
    );
}

function useEditingCreateWorkflow(
    map: MapModel | undefined,
    editingService: EditingService,
    notificationService: NotificationService,
    intl: PackageIntl,
    toolState: ToolState,
    toggleToolState: (name: keyof ToolState, newValue?: boolean | undefined) => void
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        function startEditingCreate() {
            if (!map) {
                throw Error("map is undefined");
            }

            try {
                const layer = map.layers.getLayerById("krankenhaus") as Layer;
                const url = new URL(layer.attributes.collectionURL + "/items");
                const workflow = editingService.create(map, url, layer);

                workflow
                    .whenComplete()
                    .then((featureId: string | undefined) => {
                        if (!featureId) {
                            return;
                        }

                        notificationService.notify({
                            level: "info",
                            message: intl.formatMessage(
                                {
                                    id: "editing.create.featureCreated"
                                },
                                { featureId: featureId }
                            ),
                            displayDuration: 4000
                        });

                        const vectorLayer = layer?.olLayer as VectorLayer<VectorSource>;
                        vectorLayer.getSource()?.refresh();
                    })
                    .catch((error: Error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        toggleToolState("editingCreateActive", false);
                    });
            } catch (error) {
                console.error(error);
            }
        }

        function stopEditingCreate() {
            editingService.stop(MAP_ID);
        }

        toolState.editingCreateActive ? startEditingCreate() : stopEditingCreate();
    }, [
        map,
        editingService,
        notificationService,
        intl,
        toolState.editingCreateActive,
        toggleToolState
    ]);
}

function useEditingUpdateWorkflow(
    map: MapModel | undefined,
    editingService: EditingService,
    notificationService: NotificationService,
    intl: PackageIntl,
    toolState: ToolState,
    toggleToolState: (name: keyof ToolState, newValue?: boolean | undefined) => void
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        function startEditingUpdate() {
            if (!map) {
                throw Error("map is undefined");
            }

            try {
                const layer = map.layers.getLayerById("krankenhaus") as Layer;
                const url = new URL(layer.attributes.collectionURL + "/items");
                const workflow = editingService.update(map, url, layer);

                workflow
                    .whenComplete()
                    .then((featureId: string | undefined) => {
                        if (featureId) {
                            // undefined -> no feature saved
                            notificationService.notify({
                                level: "info",
                                message: intl.formatMessage(
                                    {
                                        id: "editing.update.featureModified"
                                    },
                                    { featureId: featureId }
                                ),
                                displayDuration: 4000
                            });
                        }
                        const vectorLayer = layer?.olLayer as VectorLayer<VectorSource>;
                        vectorLayer.getSource()?.refresh();
                    })
                    .catch((error: Error) => {
                        console.log(error);
                    })
                    .finally(() => {
                        toggleToolState("editingUpdateActive", false);
                    });
            } catch (error) {
                console.log(error);
            }
        }

        function stopEditingUpdate() {
            editingService.stop(MAP_ID);
        }

        toolState.editingUpdateActive ? startEditingUpdate() : stopEditingUpdate();
    }, [
        map,
        editingService,
        notificationService,
        intl,
        toolState.editingUpdateActive,
        toggleToolState
    ]);
}
