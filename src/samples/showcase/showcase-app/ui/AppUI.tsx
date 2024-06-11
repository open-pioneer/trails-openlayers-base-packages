// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, HStack, Select, VStack, Text } from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { MAP_ID } from "../MapConfigProviderImpl";
import { useService } from "open-pioneer:react-hooks";
import { AppInitModel, AppStateReady } from "../model/AppInitModel";
import { ReactNode, useMemo } from "react";
import { createLogger } from "@open-pioneer/core";
import { LocaleSwitcher } from "./LocaleSwitcher";

const LOG = createLogger("app::AppUI");

export function AppUI() {
    const appModel = useService<AppInitModel>("app.AppInitModel");
    const appState = useReactiveSnapshot(() => appModel.appState, [appModel]);

    let content: ReactNode;
    switch (appState.kind) {
        case "loading":
            content = "Loading...";
            break;
        case "error":
            content = "Error: " + appState.message;
            break;
        case "ready":
            content = <AppContent state={appState} />;
    }

    return content;
}

function AppContent(props: { state: AppStateReady }) {
    const appModel = props.state.appModel;

    const { allDemos, currentDemo } = useReactiveSnapshot(
        () => ({
            allDemos: appModel.allDemoInfos,
            currentDemo: appModel.currentDemo
        }),
        [appModel]
    );

    const demoSelection = useMemo(() => {
        const options = allDemos.map((demo) => (
            <option key={demo.id} value={demo.id}>
                {demo.title}
            </option>
        ));
        return (
            <Select
                value={currentDemo.id}
                onChange={(e) => {
                    const demoId = e.target.value;
                    try {
                        appModel.selectDemo(demoId);
                    } catch (e) {
                        LOG.error("Failed to select demo", e);
                    }
                }}
            >
                {options}
            </Select>
        );
    }, [appModel, currentDemo, allDemos]);

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Notifier position="top-right" />
            <TitledSection
                title={
                    <Box
                        role="region"
                        aria-label={
                            "title" /* TODO intl.formatMessage({ id: "ariaLabel.header" }) */
                        }
                        textAlign="center"
                        py={1}
                    >
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Showcase
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <HStack>
                        <Box>Select demo:</Box>
                        {demoSelection}
                        <LocaleSwitcher />
                    </HStack>
                    <MapContainer
                        mapId={MAP_ID}
                        role="main"
                        /* TODO: aria-label={intl.formatMessage({ id: "ariaLabel.map" })} */
                    >
                        <MapAnchor position="top-left" horizontalGap={10}>
                            <Box bgColor="whiteAlpha.800">
                                <TitledSection title={currentDemo.title}>
                                    <Text
                                        dangerouslySetInnerHTML={{
                                            __html: currentDemo.description
                                        }}
                                    ></Text>
                                    {currentDemo.mainWidget}
                                </TitledSection>
                            </Box>
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10}>
                            <VStack>{currentDemo.tools}</VStack>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}
