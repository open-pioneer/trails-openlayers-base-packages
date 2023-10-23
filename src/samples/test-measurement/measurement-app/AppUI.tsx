// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { Measurement } from "@open-pioneer/measurement";
import { Box, Flex, Button, Tooltip } from "@open-pioneer/chakra-integration";
import { MapAnchor, MapContainer } from "@open-pioneer/map";
import { MAP_ID } from "./MapConfigProviderImpl";
import { useState } from "react";
import { useIntl } from "open-pioneer:react-hooks";
import { SectionHeading, TitledSection } from "@open-pioneer/react-utils";
import { FiEdit, FiEdit2 } from "react-icons/fi";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

export function AppUI() {
    const intl = useIntl();
    const [measurementIsActive, setMeasurementIsActive] = useState<boolean>(false);
    const activeFeatureStyle = getActiveFeatureStyle();
    const finishedFeatureStyle = getFinishedFeatureStyle();
    function activateMeasurement() {
        setMeasurementIsActive(!measurementIsActive);
    }

    return (
        <Flex height="100%" direction="column" overflow="hidden">
            <TitledSection
                title={
                    <Box textAlign="center" py={1}>
                        <SectionHeading size={"md"}>
                            OpenLayers Base Packages - Measurement
                        </SectionHeading>
                    </Box>
                }
            >
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
                                        <Measurement
                                            mapId={MAP_ID}
                                            activeFeatureStyle={activeFeatureStyle}
                                            finishedFeatureStyle={finishedFeatureStyle}
                                        ></Measurement>
                                    </TitledSection>
                                </Box>
                            </MapAnchor>
                        ) : (
                            ""
                        )}
                        <MapAnchor position="bottom-right" horizontalGap={10} verticalGap={30}>
                            <Flex direction={"column"} gap={1} padding={1}>
                                <Tooltip
                                    label={intl.formatMessage({ id: "title" })}
                                    placement="auto"
                                    openDelay={500}
                                >
                                    <Button
                                        aria-label={intl.formatMessage({ id: "title" })}
                                        leftIcon={measurementIsActive ? <FiEdit2 /> : <FiEdit />}
                                        onClick={activateMeasurement}
                                        iconSpacing={0}
                                        padding={0}
                                    />
                                </Tooltip>
                            </Flex>
                        </MapAnchor>
                    </MapContainer>
                </Flex>
            </TitledSection>
        </Flex>
    );
}

function getActiveFeatureStyle() {
    return new Style({
        fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
        }),
        stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.5)",
            lineDash: [10, 10],
            width: 2
        }),
        image: new CircleStyle({
            radius: 5,
            stroke: new Stroke({
                color: "rgba(0, 0, 0, 0.7)"
            }),
            fill: new Fill({
                color: "rgba(255, 255, 255, 0.2)"
            })
        })
    });
}

function getFinishedFeatureStyle() {
    return {
        "fill-color": "rgba(255, 255, 255, 0.2)",
        "stroke-color": "#ffcc33",
        "stroke-width": 2,
        "circle-radius": 7,
        "circle-fill-color": "#ffcc33"
    };
}
