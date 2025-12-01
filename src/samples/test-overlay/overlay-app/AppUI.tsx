// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    Separator,
    VStack,
    Text,
    Icon,
    Tabs,
    Image,
    Link,
    DataList
} from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import TileLayer from "ol/layer/Tile";
import { OSM } from "ol/source";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { OverviewMap } from "@open-pioneer/overview-map";
import { BasemapSwitcher } from "@open-pioneer/basemap-switcher";
import { Toolbar } from "./ui/Toolbar";
import { LuCamera, LuCrosshair, LuTable } from "react-icons/lu";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Reactive, reactive } from "@conterra/reactivity-core";
import { fromLonLat } from "ol/proj";
import { PackageIntl } from "@open-pioneer/runtime";

export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);

    const overviewMapLayer = useMemo(
        () =>
            new TileLayer({
                source: new OSM()
            }),
        []
    );

    const count = useRef(reactive(0));
    useEffect(() => {
        const interval = setInterval(() => {
            const increment = count.current.value + 1;
            count.current.value = increment;
            console.log(increment);
        }, 1000);
        return () => clearInterval(interval);
    });

    useEffect(() => {
        if (!map) {
            return;
        }

        const followPointerOverlay = map.overlays.addOverlay(
            { positioning: "center-center", stopEvent: false, followPointer: true, insertFirst: false},
            <Icon size={"2xl"} color={"red.solid"}>
                <LuCrosshair />
            </Icon>
        );
        const staticOverlay = map.overlays.addOverlay(
            {
                position: fromLonLat([7.613056, 51.9637], map.olView.getProjection()),
                positioning: "bottom-center",
                stopEvent: true
            },
            <StaticTooltip />
        );
        const updatingTooltip = map.overlays.addOverlay(
            {
                positioning: "center-center",
                stopEvent: false,
                followPointer: false,
                position: [410000, 5760000]
            },
            <SelfUpdatingTooltip></SelfUpdatingTooltip>
        );
        const updatedTooltip = map.overlays.addOverlay(
            {
                positioning: "center-center",
                stopEvent: false,
                followPointer: false,
                position: [410000, 5762000]
            },
            <ReactiveTooltip count={count.current}></ReactiveTooltip>
        );
        return () => {
            staticOverlay.destroy();
            followPointerOverlay.destroy();
            updatingTooltip.destroy();
            updatedTooltip.destroy();
        };
    }, [map]);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box
                        role="region"
                        aria-label={intl.formatMessage({ id: "ariaLabel.header" })}
                        textAlign="center"
                        py={1}
                    >
                        <SectionHeading size={"md"}>Open Pioneer Trails - Overlays</SectionHeading>
                    </Box>
                }
            >
                {map && (
                    <DefaultMapProvider map={map}>
                        <Flex flex="1" direction="column" position="relative">
                            <MapContainer aria-label={intl.formatMessage({ id: "ariaLabel.map" })}>
                                <MapAnchor position="top-right" horizontalGap={5} verticalGap={5}>
                                    <Box
                                        backgroundColor="white"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                        aria-label={intl.formatMessage({
                                            id: "ariaLabel.topRight"
                                        })}
                                    >
                                        <OverviewMap olLayer={overviewMapLayer} />
                                        <Separator mt={4} />
                                        <BasemapSwitcherComponent />
                                    </Box>
                                </MapAnchor>
                                <MapAnchor
                                    position="bottom-right"
                                    horizontalGap={10}
                                    verticalGap={30}
                                >
                                    <Flex
                                        aria-label={intl.formatMessage({
                                            id: "ariaLabel.bottomRight"
                                        })}
                                        direction="column"
                                        gap={1}
                                        padding={1}
                                    >
                                        <Toolbar map={map} />
                                    </Flex>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                        <Flex
                            role="region"
                            aria-label={intl.formatMessage({ id: "ariaLabel.footer" })}
                            gap={3}
                            alignItems="center"
                            justifyContent="center"
                        >
                            <CoordinateViewer precision={2} />
                            <ScaleBar />
                            <ScaleViewer />
                        </Flex>
                    </DefaultMapProvider>
                )}
            </TitledSection>
        </Flex>
    );
}

function BasemapSwitcherComponent() {
    const intl = useIntl();
    const labelId = useId();
    return (
        <VStack align="start" mt={2} gap={1}>
            <Text id={labelId} as="b" mb={1}>
                {intl.formatMessage({ id: "basemapLabel" })}
            </Text>
            <BasemapSwitcher aria-labelledby={labelId} allowSelectingEmptyBasemap />
        </VStack>
    );
}

function SelfUpdatingTooltip() {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setDate(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    return <Box bg={"yellow.400"}>{date.toLocaleString()}</Box>;
}

function ReactiveTooltip(props: { count: Reactive<number> }) {
    const count = useReactiveSnapshot(() => props.count.value, [props]);

    return <Box bg={"teal.500"}>Count: {count}</Box>;
}

function StaticTooltip() {
    const intl = useIntl();

    return (
        <Box bg={"whiteAlpha.700"} borderWidth={3} borderColor={"gray.700"} rounded={20}>
            <Tabs.Root defaultValue="facts" variant="plain">
                <Tabs.List bg="bg.muted" rounded="l3" ml="2">
                    <Tabs.Trigger value="facts">
                        <LuTable />
                        {intl.formatMessage({id:"tooltip.facts"})}
                    </Tabs.Trigger>
                    <Tabs.Trigger value="photo">
                        <LuCamera />
                        {intl.formatMessage({id:"tooltip.photo"})}
                    </Tabs.Trigger>
                    <Tabs.Indicator rounded="l2" />
                </Tabs.List>
                <Tabs.Content value="facts">
                    <Box h={200} w={222} p={2}>
                        <FactsDataList intl={intl}></FactsDataList>
                    </Box>
                </Tabs.Content>
                <Tabs.Content value="photo">
                    <Flex
                        h={200}
                        w={222}
                        p={2}
                        justifyItems={"center"}
                        justifyContent={"center"}
                        alignItems={"center"}
                    >
                        <PhotoWithLicense intl={intl}></PhotoWithLicense>
                    </Flex>
                </Tabs.Content>
            </Tabs.Root>
        </Box>
    );
}

function FactsDataList(props: {intl: PackageIntl}) {
    const {intl} = props;

    const facts = [
        { label: intl.formatMessage({id:"tooltip.factList.name"}), value: "Schloss Münster" },
        { label: intl.formatMessage({id:"tooltip.factList.location"}), value: "Münster" },
        { label: intl.formatMessage({id:"tooltip.factList.style"}), value: intl.formatMessage({id:"tooltip.factList.baroque"}) },
        { label: intl.formatMessage({id:"tooltip.factList.date"}), value: "1767-1787" }
    ];

    return (
        <DataList.Root orientation="horizontal" divideY="1px" gapX={0}>
            {facts.map((item) => (
                <DataList.Item key={item.label}>
                    <DataList.ItemLabel>{item.label}</DataList.ItemLabel>
                    <DataList.ItemValue>
                        <Text wordBreak={"break-word"}>{item.value}</Text>
                    </DataList.ItemValue>
                </DataList.Item>
            ))}
        </DataList.Root>
    );
}

function PhotoWithLicense(props: {intl: PackageIntl}) {
    const { intl } = props;
    return (
        <Flex direction="column">
            <Box borderWidth={1} borderColor={"gray.700"}>
            <Image  src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/M%C3%BCnster%2C_F%C3%BCrstbisch%C3%B6fliches_Schloss_--_2018_--_1925-27-28.jpg/330px-M%C3%BCnster%2C_F%C3%BCrstbisch%C3%B6fliches_Schloss_--_2018_--_1925-27-28.jpg" />
            </Box>
            <Text fontSize={"2xs"}>
                {intl.formatMessage({id:"tooltip.photo"})}:{" "}
                <b>
                    <Link href="https://commons.wikimedia.org/wiki/User:XRay">Dietmar Rabich</Link>
                </b>
                ,{" "}
                <Link href="https://commons.wikimedia.org/wiki/File:Münster,_Fürstbischöfliches_Schloss_--_2018_--_1925-27-28.jpg">
                    Münster, Fürstbischöfliches Schloss -- 2018 -- 1925-27-28
                </Link>
                ,{" "}
                <Link href="https://creativecommons.org/licenses/by-sa/4.0/legalcode" rel="license" >
                    CC BY-SA 4.0
                </Link>              
            </Text>
        </Flex>
    );
}
