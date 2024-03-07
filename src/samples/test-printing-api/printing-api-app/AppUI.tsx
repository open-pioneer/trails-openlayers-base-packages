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
import { useState } from "react";
import { ApplicationContext } from "@open-pioneer/runtime";

const LOG = createLogger("printing");

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    const printingService = useService<PrintingService>("printing.PrintingService");
    const systemService = useService<ApplicationContext>("runtime.ApplicationContext");

    const [dataURL, setDataURL] = useState("");
    const [showImageWindow, setShowImageWindow] = useState(false);
    const rootElement = systemService.getApplicationContainer();
    let canvas: HTMLCanvasElement | undefined = undefined;

    const addCanvas = async () => {
        setShowImageWindow(false);

        if (!canvas) {
            await new Promise<void>((resolve) => {
                startPrintingService().then(() => {
                    if (canvas) {
                        resolve();
                        appendCanvasElement();
                    }
                });
            });
        } else {
            appendCanvasElement();
        }
    };

    const appendCanvasElement = () => {
        const canvasContainer = rootElement.querySelector(".canvas-container");
        if (!canvasContainer) {
            const div = document.createElement("div");
            div.classList.add("canvas-container");
            div.style.backgroundColor = "rgba(255, 255, 255, 0.92)";
            div.style.padding = "0.5rem";
            div.style.borderWidth = "1px";
            canvas && div.appendChild(canvas);
            const canvasDisplayElement = rootElement.querySelector(".canvas-display");
            canvasDisplayElement?.appendChild(div);
        }
    };

    const showImageFromDataURL = async () => {
        if (!canvas) {
            await startPrintingService();
        }
        const canvasContainer = rootElement.querySelector(".canvas-container");
        canvasContainer?.remove();
        setShowImageWindow(true);
    };

    const startPrintingService = async () => {
        if (!map) {
            return;
        }
        // pass a second argument to printMap inorder to block user interaction (add overlay)
        await printingService.printMap(map.olMap).then(
            (service) => {
                canvas = service.getCanvas();
                if (canvas) {
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                    const dataURL = service.getPNGDataURL(0.6);
                    setDataURL(dataURL);
                }
            },
            (error) => {
                LOG.error(error);
            }
        );

        const overlayElement = rootElement.querySelector(".printing-overlay");
        overlayElement?.remove();
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
                                    service provides the screenshot of the given map view in a form
                                    of HTMLCanvasElement or a data url.
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
                            <Box className="canvas-display" width="100%" height="100%"></Box>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}
