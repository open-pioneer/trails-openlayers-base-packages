// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { LayerItemAttributes, Toc } from "@open-pioneer/toc";
import { useIntl } from "open-pioneer:react-hooks";
import { useId, useState } from "react";
import { PiListLight } from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";

export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);
    const tocTitleId = useId();
    const [showToc, setShowToc] = useState<boolean>(true);

    function toggleToc() {
        setShowToc(!showToc);
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
                                                        />
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
                                            active={showToc}
                                            onClick={toggleToc}
                                        />
                                        <Button
                                            onClick={() => {
                                                if (map) {
                                                    const layer =
                                                        map.layers.getLayerById("bustops");
                                                    if (layer) {
                                                        const isInternal = layer.internal;
                                                        layer.setInternal(!isInternal);
                                                    }
                                                }
                                            }}
                                        >
                                            toggle layer internal
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (map) {
                                                    const layer =
                                                        map.layers.getLayerById("street_network_wms");
                                                    if (layer) {
                                                        const listMode = (
                                                            layer.attributes.toc as
                                                                | LayerItemAttributes
                                                                | undefined
                                                        )?.listMode;
                                                        const newListMode =
                                                            listMode === "hide-children" ? "show" : "hide-children";
                                                        layer.updateAttributes({
                                                            toc: {
                                                                listMode: newListMode
                                                            }
                                                        });
                                                    }
                                                }
                                            }}
                                        >
                                            toggle toc list mode
                                        </Button>
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
