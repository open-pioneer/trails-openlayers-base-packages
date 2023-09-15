// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Stack,
    Text
} from "@open-pioneer/chakra-integration";
import { BkgTopPlusOpen, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { useRef } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";
import TileLayer from "ol/layer/Tile";

export function AppUI() {
    const basemapSwitcherRef = useRef<HTMLDivElement>(null);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Box textAlign="center" py={1} px={1}>
                Open Pioneer - Basemap Switcher
            </Box>

            <Flex flex="1" direction="column" position="relative">
                <MapContainer mapId={MAP_ID}>
                    <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                        <Box
                            backgroundColor="whiteAlpha.800"
                            borderWidth="1px"
                            borderRadius="lg"
                            padding={2}
                            boxShadow="lg"
                        >
                            <FormControl>
                                <FormLabel ps={1}>
                                    <Text as="b">Select basemap:</Text>
                                </FormLabel>
                                <BasemapSwitcher
                                    ref={basemapSwitcherRef}
                                    allowSelectingEmptyBasemap
                                    mapId={MAP_ID}
                                ></BasemapSwitcher>
                            </FormControl>
                            <Stack pt={5}>
                                <Text align="center">Test Controls:</Text>
                                <AddNewBaseLayerButton mapId={MAP_ID} />
                                <ToggleBaseLayerButton mapId={MAP_ID} />
                                <ClearBaseLayerButton mapId={MAP_ID} />
                            </Stack>
                        </Box>
                    </MapAnchor>
                </MapContainer>
            </Flex>
        </Flex>
    );
}

function AddNewBaseLayerButton(props: { mapId: string }) {
    const { mapId } = props;
    const { map } = useMapModel(mapId);
    const counter = useRef(1);
    const onClick = () => {
        if (!map) {
            return;
        }

        const number = counter.current++;
        const layer = map.layers.createLayer({
            title: `New Layer ${number}`,
            isBaseLayer: true,
            layer: new TileLayer({
                source: new BkgTopPlusOpen({ layer: "web_grau" })
            })
        });
        console.log("generated base layer with id", layer.id);
    };

    return <Button onClick={onClick}>Add base layer</Button>;
}

function ToggleBaseLayerButton(props: { mapId: string }) {
    const { mapId } = props;
    const { map } = useMapModel(mapId);
    const onClick = () => {
        if (!map) {
            return;
        }

        const baseLayers = map.layers.getAllLayers();
        if (baseLayers.length === 0) {
            console.error("There is no base layer");
            return;
        }

        const randomIndex = Math.floor(Math.random() * baseLayers.length);
        const layer = baseLayers[randomIndex];
        if (!layer) {
            console.error("Failed to find a layer");
            return;
        }

        console.log("activating base layer", layer.id);
        map.layers.activateBaseLayer(layer.id);
    };

    return <Button onClick={onClick}>Activate random base layer</Button>;
}

function ClearBaseLayerButton(props: { mapId: string }) {
    const { mapId } = props;
    const { map } = useMapModel(mapId);
    const onClick = () => {
        if (!map) {
            return;
        }

        console.log("setting active base layer to undefined");
        map.layers.activateBaseLayer(undefined);
    };

    return <Button onClick={onClick}>Clear base layer</Button>;
}
