// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@open-pioneer/chakra-integration";
import { Geolocation } from "@open-pioneer/geolocation";
import { EditingService } from "@open-pioneer/editing";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { ToolButton, useEvent } from "@open-pioneer/react-utils";
import { useIntl, useService } from "open-pioneer:react-hooks";
import {
    PiArrowUUpLeft,
    PiBookmarksSimpleBold,
    PiImagesLight,
    PiListLight,
    PiListMagnifyingGlassFill,
    PiMapTrifold,
    PiPencil,
    PiPencilSlash,
    PiRulerLight,
    PiSelectionPlusBold
} from "react-icons/pi";
import { MAP_ID } from "../MapConfigProviderImpl";
import { Layer, MapModel, useMapModel } from "@open-pioneer/map";
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
    editingActive: boolean;
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

    useEditingWorkflow(map, editingService, notificationService, intl, toolState, toggleToolState);

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
                    toolState.editingActive
                        ? intl.formatMessage({ id: "stopEditingTitle" })
                        : intl.formatMessage({ id: "startEditingTitle" })
                }
                icon={toolState.editingActive ? <PiPencilSlash /> : <PiPencil />}
                isActive={toolState.editingActive}
                onClick={() => toggleToolState("editingActive")}
            />
            <ToolButton
                label={intl.formatMessage({ id: "resetEditingTitle" })}
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

function useEditingWorkflow(
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
            if (map) {
                try {
                    const layer = map.layers.getLayerById("krankenhaus") as Layer;
                    const url = new URL(layer.attributes.collectionURL + "/items");
                    const workflow = editingService.start(map, url);

                    console.log(url);

                    workflow.on("active:drawing", () => {
                        console.log("start drawing feature");
                    });

                    workflow.on("active:saving", () => {
                        console.log("start saving feature");
                    });

                    workflow
                        .whenComplete()
                        .then((featureId: string | undefined) => {
                            if (featureId) {
                                // undefined -> no feature saved
                                notificationService.notify({
                                    level: "info",
                                    message: intl.formatMessage(
                                        {
                                            id: "editing.featureCreated"
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
                            toggleToolState("editingActive", false);
                        });
                } catch (error) {
                    console.log(error);
                }
            } else {
                throw Error("map is undefined");
            }
        }

        function stopEditingCreate() {
            editingService.stop(MAP_ID);
        }

        toolState.editingActive ? startEditingCreate() : stopEditingCreate();
    }, [map, editingService, notificationService, intl, toolState.editingActive, toggleToolState]);
}
