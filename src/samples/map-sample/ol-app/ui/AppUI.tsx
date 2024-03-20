// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Container, Divider, Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { Layer, MapAnchor, MapContainer, MapModel, useMapModel } from "@open-pioneer/map";
import { NotificationService, Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { ReactNode, useEffect, useState } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";
import { SpatialBookmarksComponent } from "./Bookmarks";
import { PrintingComponent } from "./Printing";
import { LegendComponent } from "./Legend";
import { MapTools, ToolState } from "./MapTools";
import { MeasurementComponent } from "./Measurement";
import { OverviewMapComponent } from "./OverviewMap";
import { ResultListComponent } from "./ResultList";
import { SearchComponent } from "./Search";
import { SelectionComponent } from "./Selection";
import { TocComponent } from "./Toc";
import { AppModel } from "../AppModel";
import { useSnapshot } from "valtio";
import { EditingService, EditingWorkflow } from "@open-pioneer/editing";
import { PackageIntl } from "@open-pioneer/runtime";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Select } from "ol/interaction";
import { Resource } from "@open-pioneer/core";
import { Overlay } from "ol";
import OlMap from "ol/Map";
import { unByKey } from "ol/Observable";

type InteractionType =
    | "measurement"
    | "selection"
    | "editing:create"
    | "editing:update"
    | undefined;

type IndependentToolState = Omit<
    ToolState,
    | "measurementActive"
    | "selectionActive"
    | "editingCreateActive"
    | "editingUpdateActive"
    | "resultListActive"
>;

const DEFAULT_TOOL_STATE: IndependentToolState = {
    bookmarksActive: false,
    legendActive: true,
    overviewMapActive: true,
    tocActive: true,
    printingActive: false
};

// Represents a tooltip rendered on the OpenLayers map
interface Tooltip extends Resource {
    overlay: Overlay;
    element: HTMLDivElement;
}

/**
 * The main application layout.
 * Renders the map and all associated components.
 */
export function AppUI() {
    const editingService = useService<EditingService>("editing.EditingService");
    const notificationService = useService<NotificationService>("notifier.NotificationService");
    const { map } = useMapModel(MAP_ID);

    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");

    // The current interaction. Only one interaction can be active at a time.
    const [currentInteractionType, setCurrentInteractionType] = useState<InteractionType>();

    // The active state of tools and their widgets (e.g. toc).
    const [currentToolState, setCurrentToolState] = useState(DEFAULT_TOOL_STATE);
    const toolState: ToolState = {
        ...currentToolState,
        editingCreateActive: currentInteractionType === "editing:create",
        editingUpdateActive: currentInteractionType === "editing:update",
        measurementActive: currentInteractionType === "measurement",
        selectionActive: currentInteractionType === "selection"
    };

    // Called when a map tool is toggled on or off.
    // Most tools can be active independently of each other, but those that control interactions
    // must be handled separately.
    const changeToolState = (toolStateName: keyof ToolState, newValue: boolean) => {
        // Enforce mutually exclusive interaction
        if (
            toolStateName === "selectionActive" ||
            toolStateName === "measurementActive" ||
            toolStateName === "editingCreateActive" ||
            toolStateName === "editingUpdateActive"
        ) {
            let interactionType: InteractionType;
            switch (toolStateName) {
                case "editingCreateActive":
                    interactionType = "editing:create";
                    break;
                case "editingUpdateActive":
                    interactionType = "editing:update";
                    break;
                case "measurementActive":
                    interactionType = "measurement";
                    break;
                case "selectionActive":
                    interactionType = "selection";
                    break;
            }
            if (interactionType !== currentInteractionType && newValue) {
                // A new interaction type was toggled on
                setCurrentInteractionType(interactionType);
                appModel.clearPreviousHighlight();
            } else if (interactionType === currentInteractionType && !newValue) {
                // The current interaction type was toggled off
                setCurrentInteractionType(undefined);
                appModel.clearPreviousHighlight();
            }
        } else {
            setCurrentToolState({
                ...currentToolState,
                [toolStateName]: newValue
            });
        }
    };

    const resultListState = useSnapshot(appModel.state).resultListState;
    const showResultList = resultListState.input && resultListState.open;

    const containerComponents = [
        toolState.tocActive && (
            <TocComponent
                key="toc"
                maxHeight={toolState.legendActive || currentInteractionType ? "300px" : "75vh"}
            />
        ),
        toolState.legendActive && <LegendComponent key="legend" />,
        currentInteractionType === "selection" ? (
            <SelectionComponent key="selection" />
        ) : currentInteractionType === "measurement" ? (
            <MeasurementComponent key="measurement" />
        ) : undefined
    ];

    // Todo: Error during toggle create / update -> Button isn't toggled!
    useEditingCreateWorkflow(
        map,
        editingService,
        notificationService,
        intl,
        toolState,
        changeToolState
    );

    useEditingUpdateWorkflow(
        map,
        editingService,
        notificationService,
        intl,
        toolState,
        changeToolState
    );

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Notifier position="top-right" />

            <TitledSection
                title={
                    <Box
                        role="region"
                        aria-label={intl.formatMessage({ id: "ariaLabel.header" })}
                        textAlign="center"
                        py={1}
                    >
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Default Sample
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer
                        mapId={MAP_ID}
                        role="main"
                        aria-label={intl.formatMessage({ id: "ariaLabel.map" })}
                        /* Note: matches the height of the result list component */
                        viewPadding={showResultList ? { bottom: 400 } : undefined}
                    >
                        <Container centerContent>
                            <SearchComponent />
                        </Container>
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            <ComponentContainer>{containerComponents}</ComponentContainer>
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={20} verticalGap={20}>
                            {toolState.overviewMapActive && <OverviewMapComponent />}
                        </MapAnchor>
                        <MapAnchor horizontalGap={20} position="bottom-left">
                            {toolState.bookmarksActive && <SpatialBookmarksComponent />}
                        </MapAnchor>
                        <MapAnchor horizontalGap={20} position="bottom-left">
                            {toolState.printingActive && <PrintingComponent />}
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={45}>
                            <MapTools toolState={toolState} onToolStateChange={changeToolState} />
                        </MapAnchor>
                        <ResultListComponent /* always here, but may be invisible / empty */ />
                    </MapContainer>
                </Flex>
                <Flex
                    role="region"
                    aria-label={intl.formatMessage({ id: "ariaLabel.footer" })}
                    gap={3}
                    alignItems="center"
                    justifyContent="center"
                >
                    <CoordinateViewer
                        mapId={MAP_ID}
                        precision={2}
                        displayProjectionCode="EPSG:4326"
                    />
                    <ScaleBar mapId={MAP_ID} />
                    <ScaleViewer mapId={MAP_ID} />
                </Flex>
            </TitledSection>
        </Flex>
    );
}

function useEditingCreateWorkflow(
    map: MapModel | undefined,
    editingService: EditingService,
    notificationService: NotificationService,
    intl: PackageIntl,
    toolState: ToolState,
    changeToolState: (toolStateName: keyof ToolState, newValue: boolean) => void
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
                const workflow = editingService.createFeature(map, url);

                workflow
                    .whenComplete()
                    .then((featureData: Record<string, string> | undefined) => {
                        if (!featureData) {
                            return;
                        }

                        notificationService.notify({
                            level: "info",
                            message: intl.formatMessage(
                                {
                                    id: "editing.create.featureCreated"
                                },
                                { featureId: featureData.featureId }
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
                        changeToolState("editingCreateActive", false);
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
        changeToolState
    ]);
}

function useEditingUpdateWorkflow(
    map: MapModel | undefined,
    editingService: EditingService,
    notificationService: NotificationService,
    intl: PackageIntl,
    toolState: ToolState,
    changeToolState: (toolStateName: keyof ToolState, newValue: boolean) => void
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        let selectInteraction: Select;

        function _createEditingTooltip(olMap: OlMap): Tooltip {
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

        function startEditingUpdate() {
            if (!map) {
                throw Error("map is undefined");
            }

            const tooltip = _createEditingTooltip(map.olMap);

            try {
                const layer = map.layers.getLayerById("krankenhaus") as Layer;
                const vectorLayer = layer?.olLayer as VectorLayer<VectorSource>;

                selectInteraction = new Select({
                    layers: [vectorLayer]
                });

                map.olMap.addInteraction(selectInteraction);
                tooltip.element.classList.remove("editing-tooltip-hidden");

                const url = new URL(layer.attributes.collectionURL + "/items");
                let workflow: EditingWorkflow;

                const selectHandler = selectInteraction.on("select", (e) => {
                    const selected = e.selected;
                    const deselected = e.deselected;

                    if (selected.length === 1 && deselected.length === 0) {
                        map.olMap.removeInteraction(selectInteraction);
                        unByKey(selectHandler);
                        tooltip.destroy();

                        const feature = selected[0];
                        if (!feature) {
                            throw Error("feature is undefined");
                        }

                        workflow = editingService.updateFeature(map, url, feature);

                        workflow
                            .whenComplete()
                            .then((featureData: Record<string, string> | undefined) => {
                                if (!featureData) {
                                    return;
                                }

                                notificationService.notify({
                                    level: "info",
                                    message: intl.formatMessage(
                                        {
                                            id: "editing.update.featureModified"
                                        },
                                        { featureId: featureData.featureId }
                                    ),
                                    displayDuration: 4000
                                });

                                vectorLayer.getSource()?.refresh();
                            })
                            .catch((error: Error) => {
                                console.log(error);
                            })
                            .finally(() => {
                                changeToolState("editingUpdateActive", false);
                            });
                    }
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
        changeToolState
    ]);
}

/**
 * A simple container that separates its children with divider elements.
 */
function ComponentContainer(props: { children: ReactNode[] }) {
    const children = props.children;
    const separatedChildren: ReactNode[] = [];
    for (const c of children) {
        if (!c) {
            continue;
        }

        if (separatedChildren.length) {
            separatedChildren.push(<Divider key={separatedChildren.length} mt={4} mb={4} />);
        }
        separatedChildren.push(c);
    }

    if (separatedChildren.length === 0) {
        return undefined;
    }
    return (
        <Box
            backgroundColor="white"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
            width={350}
            maxWidth={350}
        >
            {separatedChildren}
        </Box>
    );
}
