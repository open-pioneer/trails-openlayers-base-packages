// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Measurement } from "@open-pioneer/measurement";
import { Box, Flex, IconButton } from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { MAP_ID } from "./MapConfigProviderImpl";
import { EditIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
export function AppUI() {
    const intl = useIntl();
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);

    function activateMeasurement() {
        setMeasurementIsActive(!measurementIsActive);
    }

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <Box textAlign="center" py={1} px={1}>
                Open Pioneer - Measurement
            </Box>

            <Flex flex="1" direction="column" position="relative">
                <MapContainer mapId={MAP_ID}>
                    {measurementIsActive ? (
                        <MapAnchor position="top-left" horizontalGap={20} verticalGap={20}>
                            <Box
                                backgroundColor="whiteAlpha.900"
                                borderWidth="1px"
                                borderRadius="lg"
                                padding={2}
                                boxShadow="lg"
                            >
                                <TitledSection
                                    title={
                                        <SectionHeading size="md" mb={3}>
                                            {intl.formatMessage({ id: "measurementTitle" })}
                                        </SectionHeading>
                                    }
                                >
                                    <Measurement></Measurement>
                                </TitledSection>
                            </Box>
                        </MapAnchor>
                    ) : (
                        ""
                    )}
                    <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                        <IconButton
                            onClick={activateMeasurement}
                            aria-label="Search database"
                            icon={<EditIcon />}
                        />
                    </MapAnchor>
                </MapContainer>
            </Flex>
        </Flex>
    );
}
