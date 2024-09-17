// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";
import { ImageLabelSwitchObject } from "@open-pioneer/basemap-switcher/BasemapSwitcher";

import firstImage from "./assets/map_717498.png"; // https://de.freepik.com/icon/karte_717498#fromView=search&page=1&position=3&uuid=affc743f-cf4c-4469-8919-f587e95295db
import secondImage from "./assets/map_699730.png"; // https://de.freepik.com/icon/karte_699730#fromView=search&page=1&position=9&uuid=affc743f-cf4c-4469-8919-f587e95295db

const BASE_MAP_TOOLTIP = "Basic map";
const EMPTY_MAP_TOOLTIP = "Empty map";

export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);

    const [imageBaseSwitcherBool, setImageBaseSwitcherBool] = useState(false);

    const [imageLabel, setImageLabel] = useState({
        image: firstImage, // The image that is shown on the front
        label: BASE_MAP_TOOLTIP, // The tooltip that should be shown on hover
        callBack: () => {} // The callback that should be called when the image is clicked. In most cases no needed for the front
    } as ImageLabelSwitchObject);

    const [currentSelection, setCurrentSelection] = useState<ImageLabelSwitchObject[]>([]);

    useEffect(() => {
        switch (imageLabel.label) {
            case BASE_MAP_TOOLTIP: {
                setCurrentSelection([
                    {
                        image: firstImage, // The image that should be shown on the front
                        label: BASE_MAP_TOOLTIP, // The tooltip that should be shown on hover
                        callBack: () => {} // The callback that should be executed when the image is clicked
                    },
                    {
                        image: secondImage,
                        label: EMPTY_MAP_TOOLTIP,
                        callBack: () => {
                            setImageLabel({
                                image: secondImage, // The image that should be shown on the front
                                label: EMPTY_MAP_TOOLTIP, // The tooltip that should be shown on hover
                                callBack: () => {} // The callback that should be executed when the image is clicked
                            });
                            map?.layers.activateBaseLayer(undefined);
                        }
                    }
                ]);
                break;
            }
            case EMPTY_MAP_TOOLTIP: {
                setCurrentSelection([
                    {
                        image: firstImage, // The image that should be shown on the front
                        label: BASE_MAP_TOOLTIP, // The tooltip that should be shown on hover
                        callBack: () => {
                            // The callback that should be executed when the image is clicked
                            setImageLabel({
                                image: firstImage,
                                label: BASE_MAP_TOOLTIP,
                                callBack: () => {}
                            });
                            const baseLayers = map?.layers.getAllLayers();
                            if (!baseLayers || baseLayers?.length === 0) {
                                console.error("There is no base layer");
                                return;
                            }

                            const layer = baseLayers[0];
                            if (!layer) {
                                console.error("Failed to find a layer");
                                return;
                            }
                            map?.layers.activateBaseLayer(layer.id);
                        }
                    },
                    {
                        image: secondImage,
                        label: EMPTY_MAP_TOOLTIP,
                        callBack: () => {}
                    }
                ]);
                break;
            }
        }
    }, [imageLabel, map]);

    const imageBasemapSwitcher = useMemo(() => {
        return {
            selectedImageLabel: imageLabel,
            choosableImageLabel: currentSelection
        };
    }, [imageLabel, currentSelection]);

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
                                    {imageBaseSwitcherBool ? (
                                        <BasemapSwitcher
                                            allowSelectingEmptyBasemap
                                            mapId={MAP_ID}
                                            imageBasemapSwitcher={imageBasemapSwitcher}
                                        ></BasemapSwitcher>
                                    ) : (
                                        <BasemapSwitcher
                                            allowSelectingEmptyBasemap
                                            mapId={MAP_ID}
                                        ></BasemapSwitcher>
                                    )}
                                </FormControl>
                                <Stack pt={5}>
                                    <Text align="center">Test Controls:</Text>
                                    {imageBaseSwitcherBool ? (
                                        <></>
                                    ) : (
                                        <>
                                            <AddNewBaseLayerButton mapId={MAP_ID} />
                                            <ToggleBaseLayerButton mapId={MAP_ID} />
                                            <ClearBaseLayerButton mapId={MAP_ID} />
                                        </>
                                    )}
                                    <ChangeBaseSwitchButton
                                        callback={() =>
                                            setImageBaseSwitcherBool(!imageBaseSwitcherBool)
                                        }
                                    />
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

                                {imageBaseSwitcherBool ? (
                                    <>
                                        <Text>
                                            This application can be used to test the image basemap
                                            switcher. This basemap switcher can be used if the
                                            basemap configurations are well known and should be
                                            represented with an user-friendly image.
                                        </Text>
                                        <Text>
                                            Instead of the layer title, an image and tooltip can be
                                            used to represent the available choices. The Available
                                            choices have to be managed by yourself.
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text>
                                            This application can be used to test the basemap
                                            switcher. The basemap switcher synchronizes with the
                                            state of the shared map model. If the map model is
                                            changed (for example, by changing the current basemap),
                                            the basemap switcher must update itself accordingly.
                                        </Text>
                                        <UnorderedList>
                                            <ListItem>
                                                Adding a new basemap updates the dropdown menu (new
                                                option)
                                            </ListItem>
                                            <ListItem>
                                                Changing the current basemap to another basemap
                                                updates the selected option
                                            </ListItem>
                                            <ListItem>
                                                Setting the current basemap to {"'undefined'"} also
                                                updates the selection
                                            </ListItem>
                                        </UnorderedList>
                                    </>
                                )}
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

function ChangeBaseSwitchButton(props: { callback: () => void }) {
    const { callback } = props;
    const { map } = useMapModel(MAP_ID);

    // To minimise the example, always load the first basemap for the example images example
    const loadFirstBasemapForExample = useCallback(() => {
        const baseLayers = map?.layers.getAllLayers();
        if (!baseLayers || baseLayers?.length === 0) {
            return;
        }
        const layer = baseLayers[0];
        if (!layer) {
            console.error("Failed to find a layer");
            return;
        }
        map?.layers.activateBaseLayer(layer.id);
    }, [map]);

    return (
        <Button
            mb={2}
            onClick={() => {
                loadFirstBasemapForExample();
                callback();
            }}
        >
            Change BasemapSwitcher type
        </Button>
    );
}
