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
    VStack,
    Image
} from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { MAP_ID } from "./MapConfigProviderImpl";
import { PrintingService } from "@open-pioneer/printing";
import { useService } from "open-pioneer:react-hooks";
import { createLogger } from "@open-pioneer/core";
import { useEffect, useState } from "react";

const LOG = createLogger("printing");

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    const printingService = useService<PrintingService>("printing.PrintingService");

    const [canvas, setCanvas] = useState<HTMLCanvasElement>();
    const [dataURL, setDataURL] = useState("");

    useEffect(() => {
        if (!map) {
            return;
        }
        printingService.printMap(map.olMap).then(
            async (service) => {
                const canvas = service.getCanvas();
                if (canvas) {
                    setCanvas(canvas);
                    const dataURL = service.getPNGDataURL(0.6);
                    setDataURL(dataURL);
                }
            },
            (error) => {
                LOG.error(error);
            }
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

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
                                    Internally, this application keeps track of the current result
                                    list input and displays it when the component shall be shown.
                                </Text>
                                <UnorderedList>
                                    <ListItem>
                                        If the result list has been filled, it can be hidden and
                                        shown again while preserving the state (selection, sort,
                                        scroll, ...).
                                    </ListItem>
                                    <ListItem>
                                        The result list is embedded with a fixed height (with
                                        internal scrolling) above the map (using view padding).
                                        Showing or hiding the component will animate the view.
                                    </ListItem>
                                </UnorderedList>
                            </VStack>
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={450} verticalGap={10}>
                            {dataURL && (
                                <Box
                                    backgroundColor="whiteAlpha.900"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                    className="canvas-display"
                                    maxWidth="600"
                                    maxHeight="500"
                                >
                                    <Image src={dataURL}></Image>
                                </Box>
                            )}
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                            <Box
                                maxWidth="400px"
                                maxHeight="300px"
                                className="canvas-display"
                            ></Box>
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
