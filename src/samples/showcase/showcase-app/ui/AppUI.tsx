// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Text, VStack } from "@open-pioneer/chakra-integration";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { ReactNode, useMemo } from "react";
import { AppInitModel, AppStateReady } from "../model/AppInitModel";
import { Header } from "./Header/Header";

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
    const intl = useIntl();
    const appModel = props.state.appModel;
    const { currentDemo, currentDemoModel } = useReactiveSnapshot(
        () => ({
            currentDemo: appModel.currentDemo,
            currentDemoModel: appModel.currentDemoModel
        }),
        [appModel]
    );
    const currentListContainer = useReactiveSnapshot(
        () => currentDemoModel.listContainer,
        [currentDemoModel]
    );

    const viewPadding = useMemo(() => {
        // adjust map view whether list container (bottom = height of list component)
        return {
            left: 0,
            right: 0,
            bottom: currentListContainer != null ? 400 : 0,
            top: 0
        };
    }, [currentListContainer]);

    return (
        <>
            <Notifier position="top-right" />
            <Flex height="100%" direction="column">
                <TitledSection title={<Header appModel={appModel} />}>
                    <Flex flex="1" direction="column" position="relative">
                        <DefaultMapProvider map={appModel.map}>
                            <MapContainer
                                viewPadding={viewPadding}
                                role="main"
                                aria-label={intl.formatMessage({ id: "ariaLabels.map" })}
                            >
                                <MapAnchor
                                    className="main-map-anchor"
                                    position="top-left"
                                    horizontalGap={10}
                                    verticalGap={10}
                                >
                                    <Box bgColor="white" borderRadius={10} p={2} maxW="500px">
                                        <TitledSection
                                            title={currentDemo.title}
                                            sectionHeadingProps={{ size: "lg" }}
                                        >
                                            <Text
                                                py={4}
                                                dangerouslySetInnerHTML={{
                                                    __html: currentDemoModel.description
                                                }}
                                            ></Text>
                                            {currentDemoModel.mainWidget}
                                        </TitledSection>
                                    </Box>
                                </MapAnchor>
                                <MapAnchor position="bottom-right" horizontalGap={6}>
                                    <VStack p={1}>{currentDemoModel.tools}</VStack>
                                </MapAnchor>
                                {currentListContainer && (
                                    <Box
                                        className="list-container"
                                        position="absolute"
                                        bottom="0"
                                        backgroundColor="white"
                                        width="100%"
                                        height="400px"
                                        zIndex={1 /* above map */}
                                        borderTop="2px solid"
                                        borderColor="trails.100"
                                    >
                                        {currentListContainer}
                                    </Box>
                                )}
                            </MapContainer>
                        </DefaultMapProvider>
                    </Flex>
                </TitledSection>
            </Flex>
        </>
    );
}
