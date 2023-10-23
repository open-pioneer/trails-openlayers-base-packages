// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { OverviewMap } from "@open-pioneer/overview-map";
import { Box, Flex } from "@open-pioneer/chakra-integration";
import { MapContainer } from "@open-pioneer/map";
import { MAP_ID } from "./MapConfigProviderImpl";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
export function AppUI() {
    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Overview map
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer mapId={MAP_ID}></MapContainer>
                </Flex>
                <Flex alignItems="center" justifyContent="center">
                    {/*
                    <OverviewMap mapId={MAP_ID}></OverviewMap>
*/}
                </Flex>
            </TitledSection>
        </Flex>
    );
}
