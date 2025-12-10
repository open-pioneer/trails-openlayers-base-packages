// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { ApplicationContext } from "@open-pioneer/runtime";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { useEffect } from "react";
import { AppModel } from "../AppModel";
import { Footer } from "./Footer";
import { WorkflowUI } from "../workflow/WorkflowUI";

/**
 * The main application layout.
 * Renders the map and all associated components.
 */
export function AppUI() {
    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");
    const map = useReactiveSnapshot(() => appModel.map, [appModel]);

    useGlobalLang();

    return (
        map && (
            <DefaultMapProvider map={map}>
                <Flex height="100%" direction="column" overflow="hidden">
                    <Notifier />

                    <TitledSection
                        title={
                            <Box
                                role="region"
                                aria-label={intl.formatMessage({ id: "ariaLabel.header" })}
                                textAlign="center"
                                py={1}
                            >
                                <SectionHeading size={"md"}>Sample Application</SectionHeading>
                            </Box>
                        }
                    >
                        <Flex flex="1" direction="column" position="relative">
                            <MapContainer
                                aria-label={intl.formatMessage({ id: "ariaLabel.map" })}
                                /* Note: matches the height of the result list component */
                            >
                                <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                                    <Box
                                        width={350}
                                        maxWidth={350}
                                        zIndex={1} // above map
                                        backgroundColor="white"
                                        borderWidth="1px"
                                        borderRadius="lg"
                                        padding={2}
                                        boxShadow="lg"
                                    >
                                        <WorkflowUI />
                                    </Box>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                        <Footer />
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
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
