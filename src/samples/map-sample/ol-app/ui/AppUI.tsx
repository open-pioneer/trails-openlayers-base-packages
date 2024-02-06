// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Container, Divider, Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { useIntl } from "open-pioneer:react-hooks";
import { ReactNode, useState } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";
import { SpatialBookmarksComponent } from "./Bookmarks";
import { LegendComponent } from "./Legend";
import { MapTools, ToolState } from "./MapTools";
import { MeasurementComponent } from "./Measurement";
import { OverviewMapComponent } from "./OverviewMap";
import { SearchComponent } from "./Search";
import { SelectionComponent } from "./Selection";
import { TocComponent } from "./Toc";

type InteractionType = "measurement" | "selection" | undefined;

type IndependentToolState = Omit<ToolState, "measurementActive" | "selectionActive">;

const DEFAULT_TOOL_STATE: IndependentToolState = {
    bookmarksActive: false,
    legendActive: true,
    overviewMapActive: true,
    tocActive: true
};

/**
 * The main application layout.
 * Renders the map and all associated components.
 */
export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);

    // The current interaction. Only one interaction can be active at a time.
    const [currentInteractionType, setCurrentInteractionType] = useState<InteractionType>();

    // The active state of tools and their widgets (e.g. toc).
    const [currentToolState, setCurrentToolState] = useState(DEFAULT_TOOL_STATE);
    const toolState: ToolState = {
        ...currentToolState,
        measurementActive: currentInteractionType === "measurement",
        selectionActive: currentInteractionType === "selection"
    };

    // Called when a map tool is toggled on or off.
    // Most tools can be active independently of each other, but those that control interactions
    // must be handled separately.
    const changeToolState = (toolStateName: keyof ToolState, newValue: boolean) => {
        // Enforce mutually exclusive interaction
        if (toolStateName === "selectionActive" || toolStateName === "measurementActive") {
            const interactionType =
                toolStateName === "selectionActive" ? "selection" : "measurement";
            if (interactionType !== currentInteractionType && newValue) {
                // A new interaction type was toggled on
                setCurrentInteractionType(interactionType);
                map?.removeHighlight();
            } else if (interactionType === currentInteractionType && !newValue) {
                // The current interaction type was toggled off
                setCurrentInteractionType(undefined);
                map?.removeHighlight();
            }
        } else {
            setCurrentToolState({
                ...currentToolState,
                [toolStateName]: newValue
            });
        }
    };

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
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={45}>
                            <MapTools toolState={toolState} onToolStateChange={changeToolState} />
                        </MapAnchor>
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
