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
import { ApplicationContext } from "@open-pioneer/runtime";

const LOG = createLogger("printing");

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    const printingService = useService<PrintingService>("printing.PrintingService");
    const systemService = useService<ApplicationContext>("runtime.ApplicationContext");

    const [canvas, setCanvas] = useState<HTMLCanvasElement>();
    const [dataURL, setDataURL] = useState("");
    const [showImageWindow, setShowImageWindow] = useState(false);
    const rootElement = systemService.getApplicationContainer();

    useEffect(() => {
        if (!map) {
            return;
        }
        printingService.printMap(map.olMap).then(
            async (service) => {
                const canvas = service.getCanvas();
                if (canvas) {
                    canvas.style.width = "790px";
                    canvas.style.height = "590px";
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

    const addCanvas = () => {
        setShowImageWindow(false);
        const canvasContainer = rootElement.querySelector(".canvas-container");
        if (canvas && !canvasContainer) {
            const div = document.createElement("div");
            div.classList.add("canvas-container");
            div.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
            div.style.padding = "0.5rem";
            div.style.borderWidth = "1px";
            div.appendChild(canvas);
            const canvasDisplayElement = rootElement.querySelector(".canvas-display");
            canvasDisplayElement?.appendChild(div);
        }
    };

    const showImageFromDataURL = () => {
        const canvasContainer = rootElement.querySelector(".canvas-container");
        canvasContainer?.remove();
        setShowImageWindow(true);
    };

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
                                    This application can be used to test the printing service. The
                                    service provides the screenshot of the given map view in the a
                                    form of HTMLCanvasElement or a data url.
                                </Text>
                                <UnorderedList>
                                    <ListItem>
                                        Clicking on the {"'Canvas'"} button shows the
                                        HTMLCanvasElement of the map view embedded in another
                                        HTMLElement.
                                    </ListItem>
                                    <ListItem>
                                        Clicking on the {"'Image data URL'"} button shows the data
                                        url of the map view image used as source for
                                        HTMLImageElement.
                                    </ListItem>
                                </UnorderedList>
                            </VStack>
                        </MapAnchor>
                        <MapAnchor position="top-right" horizontalGap={450} verticalGap={10}>
                            {dataURL && showImageWindow && (
                                <Box
                                    backgroundColor="whiteAlpha.900"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                    className="image-display"
                                    maxWidth="600"
                                    maxHeight="500"
                                >
                                    <Text as="b">Image from data URL</Text>
                                    <Image src={dataURL}></Image>
                                </Box>
                            )}
                            {canvas && (
                                <Box
                                    className="canvas-display"
                                    minWidth="800"
                                    minHeight="600"
                                ></Box>
                            )}
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}
