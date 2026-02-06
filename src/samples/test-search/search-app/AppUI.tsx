// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { DefaultMapProvider, MapAnchor, MapContainer, useMapModel } from "@open-pioneer/map";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { MAP_ID } from "./MapConfigProviderImpl";
import { Search, SearchApi, SearchClearEvent, SearchReadyEvent } from "@open-pioneer/search";
import { FakeCitySource } from "@open-pioneer/search/testSources";
import { NotificationService, Notifier } from "@open-pioneer/notifier";
import { useRef } from "react";

export function AppUI() {
    const intl = useIntl();
    const { map } = useMapModel(MAP_ID);
    const notificationService = useService<NotificationService>("notifier.NotificationService");
    const searchApiRef = useRef<SearchApi>(undefined);

    const sources = [new FakeCitySource(1)];

    function onSearchSelect() {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage({ id: "selected" }),
            displayDuration: 4000
        });
    }

    function onSearchCleared(event: SearchClearEvent) {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage({ id: "cleared" }) + ` (trigger: ${event.trigger})`,
            displayDuration: 4000
        });
    }

    function searchReadyHandler(searchReadyEvent: SearchReadyEvent) {
        searchApiRef.current = searchReadyEvent.api;
    }

    function searchDisposeHandler() {
        searchApiRef.current = undefined;
    }

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
                                <SectionHeading size={"md"}>
                                    OpenLayers Base Packages - search API sample
                                </SectionHeading>
                            </Box>
                        }
                    >
                        <Flex flex="1" direction="column">
                            <MapContainer aria-label={intl.formatMessage({ id: "ariaLabel.map" })}>
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                    className="search-box"
                                    zIndex={3}
                                    // Center in parent
                                    position="absolute"
                                    top={5}
                                    left="50%"
                                    transform="translateX(-50%)"
                                    role="region"
                                    aria-label={intl.formatMessage({ id: "ariaLabel.search" })}
                                >
                                    <Search
                                        sources={sources}
                                        maxResultsPerGroup={10}
                                        onSelect={onSearchSelect}
                                        onClear={(clearEvent) => onSearchCleared(clearEvent)}
                                        onReady={(searchReadyEvent) => {
                                            searchReadyHandler(searchReadyEvent);
                                        }}
                                        onDisposed={searchDisposeHandler}
                                    />
                                </Box>
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
                                        <Text>
                                            This application can be used to test the search api,
                                            including its functionality to programmatically reset
                                            the search input.
                                        </Text>
                                    </VStack>
                                </MapAnchor>
                                <MapAnchor
                                    position="bottom-right"
                                    horizontalGap={10}
                                    verticalGap={45}
                                >
                                    <Flex role="toolbar" direction="column" gap={1} padding={1}>
                                        <Button
                                            onClick={() => {
                                                searchApiRef.current?.resetInput();
                                            }}
                                        >
                                            reset search input
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                searchApiRef.current?.setInputValue("Münster");
                                            }}
                                        >
                                            set search input
                                        </Button>
                                    </Flex>
                                </MapAnchor>
                            </MapContainer>
                        </Flex>
                    </TitledSection>
                </Flex>
            </DefaultMapProvider>
        )
    );
}
