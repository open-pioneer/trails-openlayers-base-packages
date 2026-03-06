// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, DataList, Flex, Image, Link, Tabs, Text } from "@chakra-ui/react";
import { MapModel } from "@open-pioneer/map";
import { fromLonLat } from "ol/proj";
import { LuCamera, LuMapPin, LuTable } from "react-icons/lu";

/**
 * Creates an overlay with fixed content.
 */
export function createStaticOverlay(map: MapModel) {
    return map.overlays.add({
        position: fromLonLat([7.613056, 51.9637], map.olView.getProjection()),
        positioning: "bottom-center",
        stopEvent: true,
        content: <StaticOverlay />
    });
}

function StaticOverlay() {
    return (
        // Outer wrapper stays overflow:visible so the arrow tail is visible
        <Box position="relative" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.25))">
            <Box
                bg="white"
                w="340px"
                overflow="hidden"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="gray.200"
                borderBottom="none"
            >
                {/* Header */}
                <Box bg="teal.700" px={3} pt={3} pb={2}>
                    <Flex align="center" gap={1.5}>
                        <Box color="teal.200" flexShrink={0}>
                            <LuMapPin size={16} />
                        </Box>
                        <Text fontWeight="bold" fontSize="md" color="white" lineHeight="short">
                            Schloss Münster
                        </Text>
                    </Flex>
                    <Text fontSize="xs" color="teal.200" mt={0.5} ml="24px">
                        Münster, Germany · Baroque palace
                    </Text>
                </Box>

                {/* Tabs */}
                <Tabs.Root defaultValue="facts" variant="line" size="md">
                    <Tabs.List borderBottomWidth="1px" borderColor="gray.100" px={2}>
                        <Tabs.Trigger value="facts" gap={1.5}>
                            <LuTable size={14} />
                            Facts
                        </Tabs.Trigger>
                        <Tabs.Trigger value="photo" gap={1.5}>
                            <LuCamera size={14} />
                            Photo
                        </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="facts" p={3}>
                        <FactsDataList />
                    </Tabs.Content>
                    <Tabs.Content value="photo" p={0}>
                        <PhotoWithLicense />
                    </Tabs.Content>
                </Tabs.Root>
            </Box>

            {/* Downward arrow tail */}
            <Box
                position="absolute"
                bottom="-12px"
                left="50%"
                transform="translateX(-50%)"
                w={0}
                h={0}
                css={{
                    borderLeft: "12px solid transparent",
                    borderRight: "12px solid transparent",
                    borderTop: "12px solid white"
                }}
            />
        </Box>
    );
}

function FactsDataList() {
    const facts = [
        {
            label: "Name",
            value: "Schloss Münster"
        },
        { label: "Location", value: "Münster" },
        {
            label: "Style",
            value: "Baroque"
        },
        { label: "Built", value: "1767-1787" }
    ];

    return (
        <DataList.Root orientation="horizontal" divideY="1px" p={2} gapX={0} gapY={0}>
            {facts.map((item) => (
                <DataList.Item key={item.label} alignItems="center" p={2}>
                    <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
                    <DataList.ItemValue>
                        <Text wordBreak={"break-word"}>{item.value}</Text>
                    </DataList.ItemValue>
                </DataList.Item>
            ))}
        </DataList.Root>
    );
}

function PhotoWithLicense() {
    return (
        <Flex direction="column">
            <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/M%C3%BCnster%2C_F%C3%BCrstbisch%C3%B6fliches_Schloss_--_2018_--_1925-27-28.jpg/330px-M%C3%BCnster%2C_F%C3%BCrstbisch%C3%B6fliches_Schloss_--_2018_--_1925-27-28.jpg"
                w="full"
                display="block"
            />
            <Text fontSize={"sm"} color="gray.500" px={2} py={1.5} textAlign="center">
                Photo:{" "}
                <b>
                    <Link href="https://commons.wikimedia.org/wiki/User:XRay">Dietmar Rabich</Link>
                </b>
                <br />
                <Link href="https://commons.wikimedia.org/wiki/File:Münster,_Fürstbischöfliches_Schloss_--_2018_--_1925-27-28.jpg">
                    Wikimedia Commons
                </Link>
                {" · "}
                <Link href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" rel="license">
                    CC BY-SA 4.0
                </Link>
            </Text>
        </Flex>
    );
}
