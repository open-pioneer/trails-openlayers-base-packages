// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { ReactNode, useEffect, useId, useMemo } from "react";
import { AppInitModel, AppStateReady } from "../model/AppInitModel";
import { Header } from "./Header/Header";
import { ApplicationContext } from "@open-pioneer/runtime";

export function AppUI() {
    const appModel = useService<AppInitModel>("app.AppInitModel");
    const appState = useReactiveSnapshot(() => appModel.appState, [appModel]);

    useGlobalLang();

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

    const headingId = useId();

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
            <Notifier />
            <Flex height="100%" direction="column">
                <TitledSection title={<Header appModel={appModel} />}>
                    <Flex flex="1" direction="column" position="relative">
                        <DefaultMapProvider map={appModel.map}>
                            <MapContainer
                                viewPadding={viewPadding}
                                aria-label={intl.formatMessage({ id: "ariaLabels.map" })}
                            >
                                <MapAnchor
                                    className="main-map-anchor"
                                    position="top-left"
                                    horizontalGap={10}
                                    verticalGap={10}
                                >
                                    <Box
                                        role="region"
                                        aria-labelledby={headingId}
                                        bgColor="white"
                                        borderRadius={10}
                                        p={2}
                                        maxW="500px"
                                    >
                                        <TitledSection
                                            key={currentDemo.id}
                                            title={currentDemo.title}
                                            sectionHeadingProps={{ id: headingId, size: "lg" }}
                                        >
                                            <Text py={4}>{currentDemoModel.description}</Text>
                                            {currentDemoModel.mainWidget}
                                        </TitledSection>
                                    </Box>
                                </MapAnchor>
                                <MapAnchor position="bottom-right" horizontalGap={6}>
                                    <VStack p={1}>{currentDemoModel.tools}</VStack>
                                </MapAnchor>
                            </MapContainer>
                            {currentListContainer && (
                                <Box
                                    className="list-container"
                                    role="region"
                                    aria-label={intl.formatMessage({ id: "ariaLabels.results" })}
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
                        </DefaultMapProvider>
                    </Flex>
                </TitledSection>
            </Flex>
        </>
    );
}

/**
 * Syncs the application's locale into the <html> element.
 *
 * This is appropriate when the app implements the entire page anyway; it may introduce
 * conflicts when the app is embedded into another site.
 */
function useGlobalLang() {
    const ctx = useService<ApplicationContext>("runtime.ApplicationContext");
    const locale = useReactiveSnapshot(() => ctx.getLocale(), [ctx]);
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);
}
