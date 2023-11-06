// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Toc } from "@open-pioneer/toc";
import { ScaleComponent } from "map-sample-scale-component";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useId } from "react";

export function AppUI() {
    const intl = useIntl();
    const tocTitleId = useId();
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
                            OpenLayers Base Packages - Default Sample
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex
                    role="main"
                    aria-label={intl.formatMessage({ id: "ariaLabel.main" })}
                    flex="1"
                    direction="column"
                    position="relative"
                >
                    <MapContainer mapId={MAP_ID}>
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            <Box
                                role="dialog"
                                aria-labelledby={tocTitleId}
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <TitledSection
                                    title={
                                        <SectionHeading id={tocTitleId} size="md">
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
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                            <Flex
                                role="toolbar"
                                aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
                                direction="column"
                                gap={1}
                                padding={1}
                            >
                                <InitialExtent mapId={MAP_ID} />
                                <ZoomIn mapId={MAP_ID} />
                                <ZoomOut mapId={MAP_ID} />
                            </Flex>
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
                    <CoordinateViewer mapId={MAP_ID} precision={2} />
                    <ScaleComponent mapId={MAP_ID} />
                    <ScaleViewer mapId={MAP_ID} />
                </Flex>
            </TitledSection>
        </Flex>
    );
}
