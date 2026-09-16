// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import {
    Box,
    Button,
    Flex,
    HStack,
    List,
    ListItem,
    Separator,
    Stack,
    Text,
    VStack
} from "@chakra-ui/react";
import { Switch } from "@open-pioneer/chakra-snippets/switch";
import {
    DefaultMapProvider,
    Highlight,
    MapAnchor,
    MapContainer,
    useMapModel,
    useMapModelValue
} from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Geometry, LineString, Point, Polygon } from "ol/geom";
import { Fill, Icon, Stroke, Style } from "ol/style";
import { ReactNode, useEffect, useState } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";
import mapMarkerUrl2 from "./mapMarker2.png?url";

export function AppUI() {
    const { map } = useMapModel(MAP_ID);

    return (
        map && (
            <DefaultMapProvider map={map}>
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
                            <MapContainer map={map}>
                                <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                                    <Box
                                        backgroundColor="whiteAlpha.900"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                    >
                                        <TestControls />
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
                                        <AppDescription />
                                    </VStack>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}

const POINT_GEOMETRIES = [
    new Point([852011.307424, 6788511.322702]),
    new Point([829800.379064, 6809086.916672])
];

const LINE_GEOMETRIES = [
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

const POLYGON_GEOMETRIES = [
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

const MIXED_GEOMETRIES = [
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

interface GeometrySet {
    id: string;
    label: string;
    geometries: Geometry[];
}

const GEOMETRY_SETS: GeometrySet[] = [
    { id: "point", label: "Points", geometries: POINT_GEOMETRIES },
    { id: "line", label: "LineStrings", geometries: LINE_GEOMETRIES },
    { id: "polygon", label: "Polygons", geometries: POLYGON_GEOMETRIES },
    { id: "mix", label: "Mixed", geometries: MIXED_GEOMETRIES }
];

const CUSTOM_POINT_STYLE = new Style({
    image: new Icon({
        anchor: [0.5, 1],
        src: mapMarkerUrl2
    })
});

const CUSTOM_LINE_STYLE = [
    new Style({
        stroke: new Stroke({ color: "#ff0000", width: 5 })
    }),
    new Style({
        stroke: new Stroke({ color: "#ff0000", width: 3 })
    })
];

const CUSTOM_POLYGON_STYLE = [
    new Style({
        stroke: new Stroke({ color: "#ff0000", width: 5 })
    }),
    new Style({
        stroke: new Stroke({ color: "#ff0000", width: 3 }),
        fill: new Fill({ color: "rgba(51, 171, 71, 0.35)" })
    })
];

const CUSTOM_HIGHLIGHT_STYLE = {
    Point: CUSTOM_POINT_STYLE,
    MultiPoint: CUSTOM_POINT_STYLE,
    LineString: CUSTOM_LINE_STYLE,
    MultiLineString: CUSTOM_LINE_STYLE,
    Polygon: CUSTOM_POLYGON_STYLE,
    MultiPolygon: CUSTOM_POLYGON_STYLE
};

function TestControls() {
    const map = useMapModelValue();
    const [highlights, setHighlights] = useState<ReadonlyMap<string, Highlight>>(new Map());
    const [useCustomStyle, setUseCustomStyle] = useState(false);

    useEffect(() => {
        const style = useCustomStyle ? CUSTOM_HIGHLIGHT_STYLE : {};
        for (const h of highlights.values()) {
            h.setStyle(style);
        }
    }, [highlights, useCustomStyle]);

    function addHighlight({ id, geometries }: GeometrySet) {
        const highlight = map.highlights.addAndZoom(geometries, {
            highlightStyle: useCustomStyle ? CUSTOM_HIGHLIGHT_STYLE : undefined,
            buffer: 1.1
        });
        if (highlight) {
            setHighlights((prev) => new Map(prev).set(id, highlight));
        }
    }

    function removeHighlight(id: string) {
        highlights.get(id)?.destroy();
        setHighlights((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }

    function reset() {
        map.highlights.clear();
        setHighlights(new Map());
    }

    return (
        <Stack gap={3} minWidth="220px">
            <ControlSection title="Style">
                <Switch
                    size="sm"
                    checked={useCustomStyle}
                    onCheckedChange={(e) => setUseCustomStyle(e.checked)}
                    alignSelf="center"
                >
                    Use custom style
                </Switch>
            </ControlSection>

            <Separator />

            <ControlSection title="Highlights">
                {GEOMETRY_SETS.map((set) => {
                    const active = highlights.has(set.id);
                    return (
                        <HStack key={set.id} justify="space-between">
                            <Text fontSize="sm">{set.label}</Text>
                            <Button
                                size="sm"
                                width="72px"
                                variant={active ? "outline" : "solid"}
                                colorPalette={!active ? undefined : "red"}
                                onClick={() =>
                                    active ? removeHighlight(set.id) : addHighlight(set)
                                }
                            >
                                {active ? "Remove" : "Add"}
                            </Button>
                        </HStack>
                    );
                })}
            </ControlSection>

            <Separator />

            <Button
                size="sm"
                variant="subtle"
                disabled={highlights.size === 0}
                colorPalette="red"
                onClick={reset}
            >
                Remove all highlights
            </Button>
        </Stack>
    );
}

function ControlSection(props: { title: string; children: ReactNode }) {
    return (
        <Stack gap={2}>
            <Text fontSize="sm" fontWeight="semibold">
                {props.title}
            </Text>
            {props.children}
        </Stack>
    );
}

function AppDescription() {
    return (
        <>
            <Text as="b">Description</Text>
            <Text>
                This application can be used to test adding highlights or markers, zooming to their
                extent, and removing them again. Point, line string and polygon geometries can be
                highlighted using the default or a custom style.
            </Text>
            <List.Root marginStart="1em">
                <ListItem>
                    {"'Use custom style'"} switches between the default and a custom style. It
                    applies to new highlights as well as to highlights already on the map.
                </ListItem>
                <ListItem>
                    {"'Add'"} highlights the geometries of the respective row and zooms to them.{" "}
                    {"'Remove'"} removes that highlight again.
                </ListItem>
                <ListItem>
                    {"'Remove all highlights'"} removes all highlights and markers from the map.
                </ListItem>
            </List.Root>
        </>
    );
}
