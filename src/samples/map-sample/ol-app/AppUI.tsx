// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex, Tooltip } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import {
    FakeCitySource,
    FakeRiverSource,
    FakeStreetSource
} from "./search-source-examples/testSources";
import { Search, SelectSearchEvent } from "@open-pioneer/search";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Toc } from "@open-pioneer/toc";
import { ScaleComponent } from "map-sample-scale-component";
import { useIntl } from "open-pioneer:react-hooks";
import { useState } from "react";
import { PiRulerFill, PiRulerLight } from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";
import { useId } from "react";
//TODO useCallback for the sources
const sources = [new FakeCitySource(), new FakeStreetSource(), new FakeRiverSource()];
export function AppUI() {
    const intl = useIntl();
    const tocTitleId = useId();
    const measurementTitleId = useId();
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);

    function toggleMeasurement() {
        setMeasurementIsActive(!measurementIsActive);
    }

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
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Default Sample
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer
                        mapId={MAP_ID}
                        role="main"
                        aria-label={intl.formatMessage({ id: "ariaLabel.map" })}
                    >
                        <Box
                            backgroundColor="white"
                            borderWidth="1px"
                            borderRadius="lg"
                            padding={2}
                            boxShadow="lg"
                            mt={5}
                            className="search-placement"
                        >
                            <Search
                                mapId={MAP_ID}
                                sources={sources}
                                onSelect={function (event: SelectSearchEvent): void {
                                    console.debug(
                                        "User selected " + event.suggestion + " from Search"
                                    );
                                }}
                                onClear={function (): void {
                                    console.debug("User cleared Search");
                                }}
                            />
                        </Box>
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <Box role="dialog" aria-labelledby={tocTitleId}>
                                    <TitledSection
                                        title={
                                            <SectionHeading id={tocTitleId} size="md" mb={2}>
                                                {intl.formatMessage({ id: "tocTitle" })}
                                            </SectionHeading>
                                        }
                                    >
                                        <Toc
                                            mapId={MAP_ID}
                                            basemapSwitcherProps={{
                                                allowSelectingEmptyBasemap: true
                                            }}
                                        />
                                    </TitledSection>
                                </Box>
                                {measurementIsActive && (
                                    <Box role="dialog" aria-labelledby={measurementTitleId} mt={5}>
                                        <TitledSection
                                            title={
                                                <SectionHeading
                                                    id={measurementTitleId}
                                                    size="md"
                                                    mb={2}
                                                >
                                                    {intl.formatMessage({ id: "measurementTitle" })}
                                                </SectionHeading>
                                            }
                                        >
                                            <Measurement mapId={MAP_ID} />
                                        </TitledSection>
                                    </Box>
                                )}
                            </Box>
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                            <Flex
                                role="toolbar"
                                aria-label={intl.formatMessage({ id: "ariaLabel.toolbar" })}
                                direction="column"
                                gap={1}
                                padding={1}
                            >
                                <Tooltip
                                    label={intl.formatMessage({ id: "measurementTitle" })}
                                    placement="auto"
                                    openDelay={500}
                                >
                                    <Button
                                        aria-label={intl.formatMessage({ id: "measurementTitle" })}
                                        leftIcon={
                                            measurementIsActive ? <PiRulerFill /> : <PiRulerLight />
                                        }
                                        onClick={toggleMeasurement}
                                        iconSpacing={0}
                                        padding={0}
                                    />
                                </Tooltip>
                                <InitialExtent mapId={MAP_ID} />
                                <ZoomIn mapId={MAP_ID} />
                                <ZoomOut mapId={MAP_ID} />
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
                    <CoordinateViewer mapId={MAP_ID} precision={2} />
                    <ScaleComponent mapId={MAP_ID} />
                    <ScaleViewer mapId={MAP_ID} />
                </Flex>
            </TitledSection>
        </Flex>
    );
}
