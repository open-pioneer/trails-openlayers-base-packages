// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, VStack, Text, Button } from "@open-pioneer/chakra-integration";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { Toc, TocAPI } from "@open-pioneer/toc";
import { useIntl } from "open-pioneer:react-hooks";
import { useId, useRef, useState } from "react";
import { PiListLight } from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { TocEvent } from "@open-pioneer/toc/ui/Toc";

type APIReadyHandler = (event: TocEvent) => void; 

export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);
    const tocTitleId = useId();
    const [showToc, setShowToc] = useState<boolean>(true);
    const tocAPIRef = useRef<TocAPI>(undefined);
    const tocAPIRef_Event = useRef<TocAPI>(undefined);
    const [handler, setHandler] = useState<APIReadyHandler>(createAPIReadyHandler);

    function toggleToc() {
        setShowToc(!showToc);
    }


    function createAPIReadyHandler() : APIReadyHandler{
        const handler = (event: TocEvent) => {
            console.log(event);
            if(event.kind === "resolved")
                tocAPIRef_Event.current = event.apiRef;
        };
        return handler;
    }

    function collapseItems() {
        if (showToc && tocAPIRef_Event.current) {
            tocAPIRef_Event.current.toggleItemExpanded("streets", { alignParents: true });
        }
    }

    return (
        map && (
            <DefaultMapProvider map={map}>
                <Flex height="100%" direction="column" overflow="hidden">
                    <TitledSection
                        title={
                            <Box
                                role="region"
                                aria-label={intl.formatMessage({ id: "ariaLabel.header" })}
                                textAlign="center"
                                py={1}
                            >
                                <SectionHeading size={"md"}>
                                    OpenLayers Base Packages - TOC and Health Check Sample
                                </SectionHeading>
                            </Box>
                        }
                    >
                        <Flex flex="1" direction="column">
                            <MapContainer
                                role="main"
                                aria-label={intl.formatMessage({ id: "ariaLabel.map" })}
                            >
                                <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                                    {showToc && (
                                        <Box
                                            backgroundColor="white"
                                            borderWidth="1px"
                                            borderRadius="lg"
                                            padding={2}
                                            boxShadow="lg"
                                            width={350}
                                        >
                                            {showToc && (
                                                <Box role="dialog" aria-labelledby={tocTitleId}>
                                                    <TitledSection
                                                        title={
                                                            <SectionHeading
                                                                id={tocTitleId}
                                                                size="md"
                                                                mb={2}
                                                            >
                                                                {intl.formatMessage({
                                                                    id: "tocTitle"
                                                                })}
                                                            </SectionHeading>
                                                        }
                                                    >
                                                        <Toc
                                                            showTools={true}
                                                            basemapSwitcherProps={{
                                                                allowSelectingEmptyBasemap: true
                                                            }}
                                                            collapsibleGroups={true}
                                                            initiallyCollapsed={true}
                                                            onTocEvent={handler} 
                                                        />
                                                        <Button onClick={collapseItems}>toggle</Button>
                                                        <Button m={5} onClick={() => setHandler(createAPIReadyHandler)}>set new api handler</Button>
                                                    </TitledSection>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </MapAnchor>
                                <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                    <VStack
                                        backgroundColor="whiteAlpha.900"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                        maxWidth="400px"
                                    >
                                        <Text as="b">Description</Text>
                                        <Text>
                                            This application can be used to test the TOC, including
                                            health checks for configured layers. Two base layers (
                                            {'"'}TopPlus Open
                                            {'"'} and {'"'}TopPlus Open (Grau){'"'}) and one
                                            operational layer ({'"'}Schulstandorte{'"'}) will be
                                            unavailable and should be marked as such by the UI.
                                        </Text>
                                    </VStack>
                                </MapAnchor>
                                <MapAnchor
                                    position="bottom-right"
                                    horizontalGap={10}
                                    verticalGap={45}
                                >
                                    <Flex
                                        role="toolbar"
                                        aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
                                        direction="column"
                                        gap={1}
                                        padding={1}
                                    >
                                        <ToolButton
                                            label={intl.formatMessage({ id: "tocTitle" })}
                                            icon={<PiListLight />}
                                            isActive={showToc}
                                            onClick={toggleToc}
                                        />
                                    </Flex>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}
