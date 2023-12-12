// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { SectionHeading, TitledSection, ToolButton } from "@open-pioneer/react-utils";
import { Toc } from "@open-pioneer/toc";
import { useIntl } from "open-pioneer:react-hooks";
import { useId, useState } from "react";
import { PiListLight } from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";

export function AppUI() {
    const intl = useIntl();
    const tocTitleId = useId();
    const [showToc, setShowToc] = useState<boolean>(true);

    function toggleToc() {
        setShowToc(!showToc);
    }

    return (
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
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer
                        mapId={MAP_ID}
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
                                    maxWidth={350}
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
                                                        {intl.formatMessage({ id: "tocTitle" })}
                                                    </SectionHeading>
                                                }
                                            >
                                                <Toc
                                                    mapId={MAP_ID}
                                                    basemapSwitcherProps={{
                                                        allowSelectingEmptyBasemap: true
                                                    }}
                                                />
                                            </TitledSection>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={45}>
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
    );
}
