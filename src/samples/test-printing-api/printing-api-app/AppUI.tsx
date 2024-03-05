// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Flex,
    ListItem,
    Stack,
    Text,
    UnorderedList,
    VStack
} from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { MAP_ID } from "./MapConfigProviderImpl";

export function AppUI() {
    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Printing API
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer mapId={MAP_ID}>
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            <Box
                                backgroundColor="whiteAlpha.900"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <Stack pt={5}>
                                    <Text align="center">Test Controls:</Text>
                                    <Button onClick={() => addCanvas()}>Canvas</Button>
                                    <Button onClick={() => showImageFromDataURL()}>
                                        Image data URL
                                    </Button>
                                </Stack>
                            </Box>
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                            <VStack
                                backgroundColor="whiteAlpha.900"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                maxWidth="400px"
                                maxHeight="300px"
                                overflow="auto"
                            >
                                <Text as="b">Description</Text>
                                <Text>
                                    This application can be used to test the printing service.
                                </Text>
                                <UnorderedList>
                                    <ListItem>...</ListItem>
                                    <ListItem>...</ListItem>
                                </UnorderedList>
                            </VStack>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}

function addCanvas() {
    console.debug("from test app");
}

function showImageFromDataURL() {
    console.debug("from test app");
}
