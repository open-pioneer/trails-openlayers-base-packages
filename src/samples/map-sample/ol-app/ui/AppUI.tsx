// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Separator, Flex } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer } from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { ReactNode, useEffect, useMemo } from "react";
import { AppModel, MainContentId } from "../AppModel";
import { EditingComponent } from "./Editing";
import { Footer } from "./Footer";
import { LegendComponent } from "./Legend";
import { MeasurementComponent } from "./Measurement";
import { PrintingComponent } from "./Printing";
import { ResultListComponent } from "./ResultList";
import { SearchComponent } from "./Search";
import { SelectionComponent } from "./Selection";
import { TocComponent } from "./Toc";
import { MapTools } from "./MapTools";
import { ApplicationContext } from "@open-pioneer/runtime";

/**
 * The main application layout.
 * Renders the map and all associated components.
 */
export function AppUI() {
    const intl = useIntl();
    const appModel = useService<AppModel>("ol-app.AppModel");
    const map = useReactiveSnapshot(() => appModel.map, [appModel]);

    useGlobalLang();

    const { resultListState, mainContent } = useReactiveSnapshot(() => {
        return {
            resultListState: appModel.resultListState,
            mainContent: appModel.mainContent
        };
    }, [appModel]);

    const showResultList = resultListState.input && resultListState.open;
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
                                role="main"
                                aria-label={intl.formatMessage({ id: "ariaLabel.map" })}
                                /* Note: matches the height of the result list component */
                                viewPadding={showResultList ? { bottom: 400 } : undefined}
                            >
                                <SearchComponent />

                                <MainContentComponent mainContent={mainContent} />
                                <MapAnchor
                                    position="bottom-right"
                                    horizontalGap={10}
                                    verticalGap={45}
                                >
                                    <MapTools />
                                </MapAnchor>
                            </MapContainer>
                            <ResultListComponent /* always here, but may be invisible / empty */ />
                        </Flex>
                        <Footer />
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}

/**
 * Renders the main content of the application, specified by the array of content elements.
 */
function MainContentComponent(props: { mainContent: readonly MainContentId[] }) {
    const { mainContent } = props;
    const components = useMemo(() => {
        const getComponent = (content: MainContentId): ReactNode => {
            switch (content) {
                case "toc":
                    return <TocComponent key={content} />;
                case "legend":
                    return <LegendComponent key={content} />;
                case "printing":
                    return <PrintingComponent key={content} />;
                case "selection":
                    return <SelectionComponent key={content} />;
                case "measurement":
                    return <MeasurementComponent key={content} />;
                case "editing-create":
                    return <EditingComponent key={content} kind="create" />;
                case "editing-update":
                    return <EditingComponent key={content} kind="update" />;
            }
        };
        return mainContent.map((content) => getComponent(content));
    }, [mainContent]);
    return <MainContentContainer>{components}</MainContentContainer>;
}

/**
 * A simple container that separates its children with separator elements.
 */
function MainContentContainer(props: { children: ReactNode[] }) {
    const intl = useIntl();
    const children = props.children;
    const separatedChildren: ReactNode[] = [];
    for (const c of children) {
        if (!c) {
            continue;
        }

        if (separatedChildren.length) {
            separatedChildren.push(<Separator key={separatedChildren.length} mt={4} mb={4} />);
        }
        separatedChildren.push(c);
    }

    if (separatedChildren.length === 0) {
        return undefined;
    }
    return (
        <Box
            position="absolute"
            top="100px"
            left={4}
            maxHeight="calc(100% - 140px)"
            width={350}
            maxWidth={350}
            zIndex={1} // above map
            backgroundColor="white"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
            overflow="auto"
            role="region"
            aria-label={intl.formatMessage({ id: "ariaLabel.widgets" })}
        >
            {separatedChildren}
        </Box>
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
