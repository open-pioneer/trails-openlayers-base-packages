// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Text, VStack } from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useService } from "open-pioneer:react-hooks";
import { ReactNode } from "react";
import { MAP_ID } from "../MapConfigProviderImpl";
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

    return (
        <>
            <Notifier position="top-right" />
            <Flex height="100%" direction="column">
                <TitledSection title={<Header appModel={appModel} />}>
                    <Flex flex="1" direction="column" position="relative">
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
                                                __html: currentDemoModel.description
                                            }}
                                        ></Text>
                                        {currentDemoModel.mainWidget}
                                    </TitledSection>
                                </Box>
                            </MapAnchor>
                            <MapAnchor position="bottom-right" horizontalGap={10}>
                                <VStack>{currentDemoModel.tools}</VStack>
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
                    </Flex>
                </TitledSection>
            </Flex>
        </>
    );
}
