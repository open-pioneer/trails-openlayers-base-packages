// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Flex, Tooltip } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { InitialExtent, ZoomIn, ZoomOut } from "@open-pioneer/map-navigation";
import { Measurement } from "@open-pioneer/measurement";
import {
    Search,
    FakeCitySource,
    FakeStreetSource,
    FakeRiverSource,
    GeoSearchSource
} from "@open-pioneer/search-ui";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { Toc } from "@open-pioneer/toc";
import { ScaleComponent } from "map-sample-scale-component";
import { useIntl } from "open-pioneer:react-hooks";
import { useState } from "react";
import {
    PiRulerFill,
    PiRulerLight,
    PiMagnifyingGlassFill,
    PiFileMagnifyingGlassLight
} from "react-icons/pi";
import { MAP_ID } from "./MapConfigProviderImpl";

const sources = [
    new FakeCitySource(),
    new FakeRiverSource(),
    new FakeStreetSource(),
    new GeoSearchSource()
];
export function AppUI() {
    const intl = useIntl();
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);
    const [searchIsActive, setSearchIsActive] = useState<boolean>(false);

    function toggleMeasurement() {
        setMeasurementIsActive(!measurementIsActive);
    }

    function toggleSearch() {
        setSearchIsActive(!searchIsActive);
    }

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Default Sample
                        </SectionHeading>
                    </Box>
                }
            >
                <Flex flex="1" direction="column" position="relative">
                    <MapContainer mapId={MAP_ID}>
                        {searchIsActive && (
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
                                    searchTypingDelay={500}
                                    showDropdownIndicator={false}
                                    placeholder={intl.formatMessage({ id: "searchPlaceholder" })}
                                />
                            </Box>
                        )}
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            <Box
                                backgroundColor="white"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <TitledSection
                                    title={
                                        <SectionHeading size="md" mb={2}>
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
                                <Box
                                    backgroundColor="white"
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    padding={2}
                                    boxShadow="lg"
                                    mt={5}
                                >
                                    <TitledSection
                                        title={
                                            <SectionHeading size="md" mb={2}>
                                                {intl.formatMessage({ id: "measurementTitle" })}
                                            </SectionHeading>
                                        }
                                    >
                                        <Measurement mapId={MAP_ID} />
                                    </TitledSection>
                                </Box>
                            )}
                        </MapAnchor>
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                            <Flex direction="column" gap={1} padding={1}>
                                <Tooltip
                                    label={intl.formatMessage({ id: "searchTooltip" })}
                                    placement="auto"
                                    openDelay={500}
                                >
                                    <Button
                                        aria-label={intl.formatMessage({ id: "searchTooltip" })}
                                        leftIcon={
                                            searchIsActive ? (
                                                <PiMagnifyingGlassFill />
                                            ) : (
                                                <PiFileMagnifyingGlassLight />
                                            )
                                        }
                                        onClick={toggleSearch}
                                        iconSpacing={0}
                                        padding={0}
                                    />
                                </Tooltip>
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
                <Flex gap={3} alignItems="center" justifyContent="center">
                    <CoordinateViewer mapId={MAP_ID} precision={2} />
                    <ScaleComponent mapId={MAP_ID} />
                    <ScaleViewer mapId={MAP_ID} />
                </Flex>
            </TitledSection>
        </Flex>
    );
}
