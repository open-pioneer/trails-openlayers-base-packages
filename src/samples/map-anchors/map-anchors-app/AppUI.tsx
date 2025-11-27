// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Text, Box, BoxProps, Flex, HStack } from "@chakra-ui/react";
import { Checkbox } from "@open-pioneer/chakra-snippets/checkbox";
import {
    DefaultMapProvider,
    MapAnchor,
    MapAnchorPosition,
    MapContainer,
    useMapModel
} from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ReactNode, useMemo, useState } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";

const ANCHOR_POSITIONS: MapAnchorPosition[] = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-center",
    "bottom-center",
    "left-center",
    "right-center",
    "center"
];

interface EnabledPaddings {
    left: boolean;
    right: boolean;
    top: boolean;
    bottom: boolean;
}

const PADDING_SIZE = 150; // Pixels

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    const [enabledPaddings, setEnabledPaddings] = useState<EnabledPaddings>({
        left: false,
        right: false,
        top: false,
        bottom: false
    });
    const updatePadding = (key: keyof EnabledPaddings, enabled: boolean) => {
        setEnabledPaddings((prev) => ({
            ...prev,
            [key]: enabled
        }));
    };
    const checkboxes = Object.keys(enabledPaddings).map((rawKey) => {
        const key = rawKey as keyof EnabledPaddings;
        return (
            <Checkbox
                key={rawKey}
                checked={enabledPaddings[key]}
                onCheckedChange={(e) => updatePadding(key, !!e.checked)}
            >
                {rawKey} padding
            </Checkbox>
        );
    });

    const overlays = useMemo(() => getOverlays(enabledPaddings), [enabledPaddings]);

    return (
        map && (
            <DefaultMapProvider map={map}>
                <Flex height="100%" direction="column" overflow="hidden">
                    <TitledSection
                        title={
                            <Box textAlign="center" py={1} px={1}>
                                <SectionHeading size="md">Map Anchors Test App</SectionHeading>
                            </Box>
                        }
                    >
                        <Flex flex="1" direction="column" position="relative" textAlign="center">
                            <Text alignSelf="center" maxW="2xl" fontSize="sm">
                                This test app demonstrates the functionality of map anchors and map
                                padding. Click the check boxes to toggle padding on each side of the
                                map. The map should update itself accordingly, and the map anchors
                                positioned on top of the map should move with the padding.
                            </Text>
                            <HStack my={2} justify="center">
                                {checkboxes}
                            </HStack>
                            <Flex flex="1" direction="column" position="relative">
                                <MapContent paddings={enabledPaddings} />
                                {overlays}
                            </Flex>
                        </Flex>
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}

function MapContent(props: { paddings: EnabledPaddings }) {
    const { paddings } = props;
    const viewPadding = useMemo(() => {
        return {
            left: paddings.left ? PADDING_SIZE : undefined,
            right: paddings.right ? PADDING_SIZE : undefined,
            top: paddings.top ? PADDING_SIZE : undefined,
            bottom: paddings.bottom ? PADDING_SIZE : undefined
        };
    }, [paddings]);

    const anchors = useMemo(() => getAnchors(), []);
    return (
        <MapContainer viewPadding={viewPadding} viewPaddingChangeBehavior="preserve-extent">
            {anchors}
        </MapContainer>
    );
}

function getOverlays(paddings: EnabledPaddings) {
    const size = `${PADDING_SIZE}px`;

    const box = (props: BoxProps) => (
        <Box position="absolute" backgroundColor="whiteAlpha.800" {...props} />
    );

    return (
        <>
            {paddings.left && box({ left: 0, top: 0, bottom: 0, width: size })}
            {paddings.right && box({ right: 0, top: 0, bottom: 0, width: size })}
            {paddings.top && box({ left: 0, right: 0, top: 0, height: size })}
            {paddings.bottom && box({ left: 0, right: 0, bottom: 0, height: size })}
        </>
    );
}

function getAnchors() {
    const anchors: ReactNode[] = [];
    anchors.push(
        ...ANCHOR_POSITIONS.map((position) => (
            <MapAnchor
                key={position}
                position={position}
                //verticalGap={30}
                //horizontalGap={30}
            >
                <Box
                    backgroundColor="whiteAlpha.800"
                    borderWidth="1px"
                    borderRadius="lg"
                    padding={2}
                    boxShadow="lg"
                >
                    Anchor at {position}
                </Box>
            </MapAnchor>
        ))
    );
    anchors.push(
        // See CSS in app.css
        <MapAnchor className="manual-position" key="manual" position="manual">
            <Box
                backgroundColor="whiteAlpha.800"
                borderWidth="1px"
                borderRadius="lg"
                padding={2}
                boxShadow="lg"
            >
                Manually positioned anchor
            </Box>
        </MapAnchor>
    );
    return anchors;
}
