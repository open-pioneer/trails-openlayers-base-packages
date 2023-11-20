// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex, Stack, Text, VStack } from "@open-pioneer/chakra-integration";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { MAP_ID } from "./MapConfigProviderImpl";
import { resultHandler } from "@open-pioneer/search-result-handler";
import { LineString, Point, Polygon } from "ol/geom";
import OlMap from "ol/Map";

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    const olMap = map?.olMap;
    const pointGeometries = [
        new Point([852011.307424, 6788511.322702]),
        new Point([829800.379064, 6809086.916672])
    ];
    const lineGeometries = [
        new LineString([
            [851890.680238, 6788133.616293],
            [851298.293269, 6790235.634571],
            [853419.420804, 6790407.617885]
        ]),
        new LineString([
            [848107.047338, 6790579.601198],
            [849081.619449, 6793197.569417]
        ])
    ];
    const polygonGeometries = [
        new Polygon([
            [
                [851728.251553, 6788384.425292],
                [851518.049725, 6788651.954891],
                [852182.096409, 6788881.265976],
                [851728.251553, 6788384.425292]
            ]
        ]),
        new Polygon([
            [
                [845183.331006, 6794496.998898],
                [850132.628588, 6794764.528497],
                [850629.469272, 6791707.047365],
                [844399.851466, 6791229.315939],
                [845183.331006, 6794496.998898]
            ]
        ])
    ];
    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Result Handler
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
                                    <Button
                                        onClick={() => zoomAndHighlight(olMap, pointGeometries)}
                                    >
                                        Points
                                    </Button>
                                    <Button onClick={() => zoomAndHighlight(olMap, lineGeometries)}>
                                        Linestring
                                    </Button>
                                    <Button
                                        onClick={() => zoomAndHighlight(olMap, polygonGeometries)}
                                    >
                                        Polygons
                                    </Button>
                                </Stack>
                            </Box>
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
                                        This application can be used to test the search result
                                        handler.
                                    </Text>
                                </VStack>
                            </MapAnchor>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}

function zoomAndHighlight(
    olMap: OlMap | undefined,
    resultGeometries: Point[] | LineString[] | Polygon[]
) {
    if (olMap) {
        resultHandler({
            olMap: olMap,
            geometries: resultGeometries,
            zoomScaleForPoints: 8,
            zoomScaleForLinesOrPolygons: 11
        });
    }
}
