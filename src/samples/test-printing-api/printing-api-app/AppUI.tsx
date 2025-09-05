// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Center, Flex, Image, List, Stack, Text, VStack } from "@chakra-ui/react";
import { createLogger } from "@open-pioneer/core";
import { MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { PrintingService } from "@open-pioneer/printing";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useService } from "open-pioneer:react-hooks";
import { useEffect, useRef, useState } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";

const LOG = createLogger("printing");

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    const printingService = useService<PrintingService>("printing.PrintingService");
    const [displayState, setDisplayState] = useState<undefined | string | HTMLCanvasElement>(
        undefined
    );

    const addCanvas = async () => {
        startPrintingService("canvas");
    };

    const showImageFromDataURL = async () => {
        startPrintingService("png");
    };

    const startPrintingService = async (mode: "canvas" | "png") => {
        if (!map) {
            return;
        }
        await printingService.printMap(map.olMap).then(
            (service) => {
                const canvas = service.getCanvas();
                if (mode === "canvas") {
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                    setDisplayState(canvas);
                } else {
                    setDisplayState(service.getPNGDataURL(0.6));
                }
            },
            (error) => {
                LOG.error(error);
            }
        );
    };

    return (
        map && (
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
                        <MapContainer map={map} role="application">
                            <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                                <Box
                                    backgroundColor="whiteAlpha.900"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                >
                                    <Stack pt={5}>
                                        <Center>
                                            <Text>Test Controls:</Text>
                                        </Center>
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
                                        The service provides the screenshot of the given map view in
                                        a form of HTMLCanvasElement or a data url.
                                    </Text>
                                    <List.Root marginStart="1em">
                                        <List.Item>
                                            Clicking on the {"'Canvas'"} button shows the
                                            HTMLCanvasElement of the map view embedded in another
                                            HTMLElement.
                                        </List.Item>
                                        <List.Item>
                                            Clicking on the {"'Image data URL'"} button shows the
                                            data url of the map view image used as source for
                                            HTMLImageElement.
                                        </List.Item>
                                    </List.Root>
                                </VStack>
                            </MapAnchor>
                            <MapAnchor position="top-right" horizontalGap={450} verticalGap={10}>
                                {displayState && (
                                    <VStack
                                        backgroundColor="whiteAlpha.900"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                        className="result-display"
                                        maxWidth="600"
                                        maxHeight="500"
                                    >
                                        <ImageOrCanvasRenderer input={displayState} />
                                    </VStack>
                                )}
                            </MapAnchor>
                        </MapContainer>
                    </Flex>
                </TitledSection>
            </Flex>
        )
    );
}

function ImageOrCanvasRenderer(props: { input: string | HTMLCanvasElement }) {
    const imageUrl = typeof props.input === "string" ? props.input : undefined;
    const imageContent = imageUrl && (
        <>
            <Text as="b">Image from data URL</Text>
            <Image src={imageUrl}></Image>
        </>
    );
    const canvasContent =
        typeof props.input !== "string" ? <RenderCanvas canvas={props.input} /> : undefined;

    return imageContent || canvasContent;
}

function RenderCanvas(props: { canvas: HTMLCanvasElement }) {
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!container.current) {
            return;
        }

        const box = container.current;
        box.appendChild(props.canvas);
        return () => {
            box.removeChild(props.canvas);
        };
    }, [props.canvas]);
    return (
        <>
            <Text as="b">Image from canvas</Text>
            <Box ref={container}></Box>
        </>
    );
}
