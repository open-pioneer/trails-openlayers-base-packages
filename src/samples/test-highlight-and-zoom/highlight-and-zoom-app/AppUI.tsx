// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Flex,
    HStack,
    ListItem,
    Stack,
    StackDivider,
    Text,
    UnorderedList,
    VStack
} from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer, MapModel, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Geometry, LineString, Point, Polygon } from "ol/geom";
import { MAP_ID } from "./MapConfigProviderImpl";
import { Fill, Icon, Stroke, Style } from "ol/style";
import mapMarkerUrl2 from "@open-pioneer/map/assets/images/mapMarker2.png?url";

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    let highlightMap = new Map();
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
    const mixedGeometries = [
        new Point([852011.307424, 6788511.322702]),
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

    function handleClick(map: MapModel | undefined, resultGeometries: Geometry[], id: string) {
        if (map && !highlightMap.has(id)) {
            const highlight = map.highlightAndZoom(resultGeometries, {});
            if (highlight) highlightMap.set(id, highlight);
        }
    }

    function handleClickOwnStyle(
        map: MapModel | undefined,
        resultGeometries: Geometry[],
        id: string
    ) {
        if (map && !highlightMap.has(id)) {
            const highlight = map.highlightAndZoom(resultGeometries, {
                "highlightStyle": ownHighlightStyle
            });
            if (highlight) highlightMap.set(id, highlight);
        }
    }

    function removeHighlight(id: string) {
        if (highlightMap.has(id)) {
            highlightMap.get(id)?.destroy();
            highlightMap.delete(id);
        }
    }

    function reset(map: MapModel | undefined) {
        if (map) {
            map.removeHighlights();
            highlightMap = new Map();
        }
    }

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Highlight and Zoom
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
                                <Text align="center">Test Controls:</Text>
                                <Stack divider={<StackDivider borderColor="gray.200" />} pt={5}>
                                    <Stack pt={5}>
                                        <Text align="center">Style 1</Text>
                                        <HStack align="center">
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClick(map, pointGeometries, "point")
                                                }
                                            >
                                                Points
                                            </Button>
                                            <Button onClick={() => removeHighlight("point")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClick(map, lineGeometries, "line")
                                                }
                                            >
                                                LineString
                                            </Button>
                                            <Button onClick={() => removeHighlight("line")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClick(map, polygonGeometries, "polygon")
                                                }
                                            >
                                                Polygons
                                            </Button>
                                            <Button onClick={() => removeHighlight("polygon")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClick(map, mixedGeometries, "mix")
                                                }
                                            >
                                                Mixed
                                            </Button>
                                            <Button onClick={() => removeHighlight("mix")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                    </Stack>
                                    <Stack>
                                        <Text align="center">Style 2</Text>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClickOwnStyle(
                                                        map,
                                                        pointGeometries,
                                                        "point2"
                                                    )
                                                }
                                            >
                                                Points
                                            </Button>
                                            <Button onClick={() => removeHighlight("point2")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClickOwnStyle(
                                                        map,
                                                        lineGeometries,
                                                        "line2"
                                                    )
                                                }
                                            >
                                                LineString
                                            </Button>
                                            <Button onClick={() => removeHighlight("line2")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClickOwnStyle(
                                                        map,
                                                        polygonGeometries,
                                                        "polygon2"
                                                    )
                                                }
                                            >
                                                Polygons
                                            </Button>
                                            <Button onClick={() => removeHighlight("polygon2")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                        <HStack>
                                            <Button
                                                width={105}
                                                onClick={() =>
                                                    handleClickOwnStyle(
                                                        map,
                                                        mixedGeometries,
                                                        "mix2"
                                                    )
                                                }
                                            >
                                                Mixed
                                            </Button>
                                            <Button onClick={() => removeHighlight("mix2")}>
                                                Remove
                                            </Button>
                                        </HStack>
                                    </Stack>
                                    <Button onClick={() => reset(map)}>Reset All</Button>
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
                            >
                                <Text as="b">Description</Text>
                                <Text>
                                    This application can be used to test adding highlight or marker,
                                    zoom to their extent, and removing highlight and marker. The
                                    highlight and zoom for point, line string and polygon geometries
                                    in two different styles can be tested.
                                </Text>
                                <UnorderedList>
                                    <ListItem>
                                        Clicking on {"'Points'"} adds markers for point geometries.
                                    </ListItem>
                                    <ListItem>
                                        Clicking on {"'LineString'"} adds highlight for linestring
                                        geometries.
                                    </ListItem>
                                    <ListItem>
                                        Clicking on {"'Polygon'"} adds highlight for polygon
                                        geometries.
                                    </ListItem>
                                    <ListItem>
                                        Clicking on {"'Mixed'"} adds highlight for geometries of
                                        different types.
                                    </ListItem>
                                    <ListItem>
                                        Clicking on {"'Remove'"} will remove the marker or highlight
                                        added by the button on the left.
                                    </ListItem>
                                    <ListItem>
                                        Clicking on {"'Reset All'"} removes all highlights and
                                        markers from the map.
                                    </ListItem>
                                </UnorderedList>
                            </VStack>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}

const ownHighlightStyle = {
    "Point": new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: mapMarkerUrl2
        })
    }),
    "MultiPoint": new Style({
        image: new Icon({
            anchor: [0.5, 1],
            src: mapMarkerUrl2
        })
    }),
    "LineString": [
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 3
            })
        })
    ],
    "MultiLineString": [
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 3
            })
        })
    ],
    "Polygon": [
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(51, 171, 71,0.35)"
            })
        })
    ],
    "MultiPolygon": [
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#ff0000",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(51, 171, 71,0.35)"
            })
        })
    ]
};
