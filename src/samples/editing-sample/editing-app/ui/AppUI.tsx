// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, HStack } from "@chakra-ui/react";

import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { Notifier } from "@open-pioneer/notifier";
import { TitledSection } from "@open-pioneer/react-utils";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Toc } from "@open-pioneer/toc";

import { useCallback, useState, type ReactElement } from "react";
import { LuMenu, LuPencil } from "react-icons/lu";

import { MAP_ID } from "../map/MainMapProvider";
import { EditingComponent } from "./EditingComponent";

export function AppUI(): ReactElement | undefined {
    const [editingIsActive, toggleEditing] = useToolState(true);
    const [tocIsActive, toggleToc] = useToolState(false);

    const { map } = useMapModel(MAP_ID);

    if (map != null) {
        return (
            <Flex direction="column" height="full" overflow="hidden">
                <DefaultMapProvider map={map}>
                    <Flex direction="column" flex={1}>
                        <MapContainer>
                            {editingIsActive && (
                                <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                    <EditingComponent />
                                </MapAnchor>
                            )}
                            {tocIsActive && (
                                <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                                    <Box
                                        backgroundColor="white"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={4}
                                        boxShadow="lg"
                                        width={250}
                                    >
                                        <TitledSection
                                            title="Table of Contents"
                                            sectionHeadingProps={{ size: "md" }}
                                        >
                                            <Toc />
                                        </TitledSection>
                                    </Box>
                                </MapAnchor>
                            )}
                            <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                                <HStack gap={3}>
                                    <ToolButton
                                        label="Table of Contents"
                                        icon={<LuMenu />}
                                        active={tocIsActive}
                                        onClick={toggleToc}
                                    />
                                    <ToolButton
                                        label="Editing"
                                        icon={<LuPencil />}
                                        active={editingIsActive}
                                        onClick={toggleEditing}
                                    />
                                </HStack>
                            </MapAnchor>
                        </MapContainer>
                    </Flex>
                    <Flex direction="row" gap={3} alignItems="center" justifyContent="center">
                        <CoordinateViewer precision={0} />
                        <ScaleBar />
                        <ScaleViewer />
                    </Flex>
                </DefaultMapProvider>
                <Notifier />
            </Flex>
        );
    } else {
        return undefined;
    }
}

function useToolState(initialState: boolean): [boolean, () => void] {
    const [isActive, setIsActive] = useState(initialState);
    const toggle = useCallback(() => setIsActive((isActive) => !isActive), []);
    return [isActive, toggle];
}
