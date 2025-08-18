// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import {
    DefaultMapProvider,
    isLayer,
    Layer,
    MapAnchor,
    MapContainer,
    useMapModel,
    useMapModelValue
} from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Toc } from "@open-pioneer/toc";
import { MAP_ID } from "./MapConfigProviderImpl";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useEffect, useState } from "react";

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    return (
        map && (
            <DefaultMapProvider map={map}>
                <AppReady />
            </DefaultMapProvider>
        )
    );
}

function AppReady() {
    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box role="region" textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Dynamic Map Content
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column">
                    <MapContainer role="main">
                        <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                            <VStack
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                maxWidth="400px"
                            >
                                <Text as="b">Description</Text>
                                <Text>
                                    Supports adding and removing layers using the follow control
                                    buttons:
                                </Text>
                                <VStack>
                                    <LayerToggleButton layerId="kitas"></LayerToggleButton>
                                    <LayerToggleButton layerId="schools"></LayerToggleButton>
                                    <LayerToggleButton layerId="transport"></LayerToggleButton>
                                </VStack>
                            </VStack>
                        </MapAnchor>
                        <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                                width={350}
                            >
                                <TitledSection
                                    title="Table of Contents"
                                    sectionHeadingProps={{ size: "md" }}
                                >
                                    <Toc
                                        showTools={true}
                                        basemapSwitcherProps={{
                                            allowSelectingEmptyBasemap: true
                                        }}
                                        collapsibleGroups={true}
                                        initiallyCollapsed={true}
                                    />
                                </TitledSection>
                            </Box>
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={45}>
                            <Flex role="toolbar" direction="column" gap={1} padding={1}></Flex>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}

function LayerToggleButton(props: { layerId: string }) {
    const { layerId } = props;
    const map = useMapModelValue();

    // Use getLayerById to set up the layer reference.
    // This expects that the layers are initially part of the map.
    const [layer, setLayer] = useState<Layer>();
    useEffect(() => {
        const foundLayer = map.layers.getLayerById(layerId);
        if (!foundLayer) {
            throw new Error("Layer is not present in map during mount: " + layerId);
        }
        if (!isLayer(foundLayer)) {
            throw new Error("Expected an operational layer");
        }
        setLayer(foundLayer);
        return () => setLayer(undefined);
    }, [map, layerId]);

    const presentInMap = useReactiveSnapshot(() => !!layer && layer.nullableMap != null, [layer]);

    const onClick = () => {
        if (!layer) {
            return;
        }

        if (presentInMap) {
            map.layers.removeLayer(layer);
        } else {
            map.layers.addLayer(layer);
        }
    };

    return (
        <Button onClick={onClick} disabled={layer == null}>
            {presentInMap ? "Remove" : "Add"} {layerId}
        </Button>
    );
}
