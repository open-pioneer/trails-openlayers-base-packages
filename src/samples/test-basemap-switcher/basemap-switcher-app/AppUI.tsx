// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";
import {
    Box,
    Button,
    Flex,
    FormControl,
    FormLabel,
    ListItem,
    Stack,
    Text,
    UnorderedList,
    VStack
} from "@open-pioneer/chakra-integration";
import { TitledSection, SectionHeading } from "@open-pioneer/react-utils";
import {
    BkgTopPlusOpen,
    MapAnchor,
    MapContainer,
    SimpleLayer,
    useMapModel
} from "@open-pioneer/map";
import TileLayer from "ol/layer/Tile";
import { useIntl } from "open-pioneer:react-hooks";
import { useRef } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";

export function AppUI() {
    const intl = useIntl();

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Basemap Switcher
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
                                <FormControl>
                                    <FormLabel ps={1}>
                                        <Text as="b">
                                            {intl.formatMessage({ id: "basemapLabel" })}
                                        </Text>
                                    </FormLabel>
                                    <BasemapSwitcher
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
                                    This application can be used to test the basemap switcher. The
                                    basemap switcher synchronizes with the state of the shared map
                                    model. If the map model is changed (for example, by changing the
                                    current basemap), the basemap switcher must update itself
                                    accordingly.
                                </Text>
                                <UnorderedList>
                                    <ListItem>
                                        Adding a new basemap updates the dropdown menu (new option)
                                    </ListItem>
                                    <ListItem>
                                        Changing the current basemap to another basemap updates the
                                        selected option
                                    </ListItem>
                                    <ListItem>
                                        Setting the current basemap to {"'undefined'"} also updates
                                        the selection
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

function AddNewBaseLayerButton(props: { mapId: string }) {
    const { mapId } = props;
    const { map } = useMapModel(mapId);
    const counter = useRef(1);
    const onClick = () => {
        if (!map) {
            return;
        }

        const number = counter.current++;
        const layer = new SimpleLayer({
            title: `New Layer ${number}`,
            isBaseLayer: true,
            olLayer: new TileLayer({
                source: new BkgTopPlusOpen({ layer: "web_grau" })
            })
        });
        map.layers.addLayer(layer);
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
