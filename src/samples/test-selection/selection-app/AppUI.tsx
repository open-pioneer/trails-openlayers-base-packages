// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, BoxProps, Button, Code, Flex, List, Stack, Text, VStack } from "@chakra-ui/react";
import {
    DefaultMapProvider,
    MapAnchor,
    MapContainer,
    MapModel,
    useMapModel
} from "@open-pioneer/map";
import { Notifier } from "@open-pioneer/notifier";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { Selection } from "@open-pioneer/selection";
import { useIntl } from "open-pioneer:react-hooks";
import { useId } from "react";
import { MAP_ID } from "./MapConfigProviderImpl";
import { LastSelection, SelectionDemo, useSelectionDemo } from "./useSelectionDemo";

export function AppUI() {
    const { map } = useMapModel(MAP_ID);
    return map && <AppContent map={map} />;
}

function AppContent(props: { map: MapModel }) {
    const { map } = props;
    const intl = useIntl();
    const demo = useSelectionDemo(map);
    const selectionTitleId = useId();

    return (
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
                                OpenLayers Base Packages - Selection Sample
                            </SectionHeading>
                        </Box>
                    }
                >
                    <Flex flex="1" direction="column">
                        <MapContainer aria-label={intl.formatMessage({ id: "ariaLabel.map" })}>
                            <MapAnchor position="top-left" horizontalGap={10} verticalGap={10}>
                                <Panel width="350px">
                                    <Box role="dialog" aria-labelledby={selectionTitleId}>
                                        <TitledSection
                                            title={
                                                <SectionHeading
                                                    id={selectionTitleId}
                                                    size="md"
                                                    mb={2}
                                                >
                                                    {intl.formatMessage({ id: "selectionTitle" })}
                                                </SectionHeading>
                                            }
                                        >
                                            <Selection
                                                sources={demo.sources}
                                                onSelectionComplete={demo.onSelectionComplete}
                                                onSelectionSourceChanged={
                                                    demo.onSelectionSourceChanged
                                                }
                                            />
                                        </TitledSection>
                                    </Box>
                                </Panel>
                                <ResultsPanel
                                    lastSelection={demo.lastSelection}
                                    onClear={demo.clearResults}
                                />
                            </MapAnchor>

                            <MapAnchor position="top-right" horizontalGap={10} verticalGap={10}>
                                <Panel width="340px" maxHeight="80vh" overflowY="auto">
                                    <DemoControls demo={demo} />
                                </Panel>
                            </MapAnchor>
                        </MapContainer>
                    </Flex>
                </TitledSection>
            </Flex>
        </DefaultMapProvider>
    );
}

function DemoControls(props: { demo: SelectionDemo }) {
    const { demo } = props;
    return (
        <Stack gap={3} align="stretch">
            <Text as="b">Description</Text>
            <Text>
                This application demonstrates the selection component. Pick a selection source, then
                draw a region on the map.
            </Text>
            <List.Root ml={4}>
                <List.Item>
                    Changing the selected source should trigger a notification via the{" "}
                    <Code>onSelectionSourceChanged</Code> event.
                </List.Item>
                <List.Item>
                    Performing a selection should update the {'"results"'} view and show a
                    notification via the <Code>onSelectionComplete</Code> event.
                </List.Item>
            </List.Root>

            <Text as="b">Test controls</Text>
            <Text>Use the buttons below to toggle the presence or state of a source.</Text>
            <Button onClick={() => demo.togglePlacesLayer()}>Toggle vector layer</Button>
            <Button onClick={() => demo.toggleRemovableSource()}>Add or remove dummy source</Button>
        </Stack>
    );
}

function ResultsPanel(props: { lastSelection: LastSelection | undefined; onClear: () => void }) {
    const { lastSelection, onClear } = props;
    if (!lastSelection) {
        return undefined;
    }

    const { sourceLabel, results } = lastSelection;
    return (
        <Panel mt={2} width="350px">
            <VStack align="stretch" gap={2}>
                <Text as="b">
                    {results.length} result(s) from &quot;{sourceLabel}&quot;
                </Text>
                <List.Root fontSize="sm" ps={4}>
                    {results.map((result) => (
                        <List.Item key={result.id}>
                            {String(result.properties?.name ?? result.id)}
                        </List.Item>
                    ))}
                </List.Root>
                <Button size="sm" onClick={onClear}>
                    Clear results
                </Button>
            </VStack>
        </Panel>
    );
}

function Panel(props: BoxProps) {
    return (
        <Box
            backgroundColor="whiteAlpha.900"
            borderWidth="1px"
            borderRadius="lg"
            padding={2}
            boxShadow="lg"
            {...props}
        />
    );
}
