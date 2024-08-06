// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Select,
    Text
} from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { StyleLike } from "ol/style/Style";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import {
    MeasurementController,
    MeasurementGeometry,
    MeasurementsChangedHandler,
    MeasurementType
} from "./MeasurementController";

/**
 * This is for special properties of the Measurement.
 */
export interface MeasurementProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * The style for the active drawing feature's geometry.
     */
    activeFeatureStyle?: StyleLike;

    /**
     * The style for the finished drawn feature's geometry.
     */
    finishedFeatureStyle?: StyleLike;

    /**
     * handler that is called whenever a measurement is added or removed
     */
    onMeasurementsChange?: MeasurementsChangedHandler;

    /**
     * list of measurements to be rendered when the component is initialized
     */
    predefinedMeasurements?: MeasurementGeometry[];
}

/**
 * The `Measurement` component can be used in an app to switch between distance and area measurements and to delete all current measurements.
 */
export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();

    const {
        mapId,
        activeFeatureStyle,
        finishedFeatureStyle,
        onMeasurementsChange: measurementsChangeHandler,
        predefinedMeasurements: predefinedMeasurements
    } = props;
    const { containerProps } = useCommonComponentProps("measurement", props);
    const [selectedMeasurement, setMeasurement] = useState<MeasurementType>("distance");
    const label = (id: string) => intl.formatMessage({ id: id });
    const mapState = useMapModel(mapId);
    const controller = useController(mapState.map, intl);

    // Synchronize styles with controller
    useEffect(() => {
        controller?.setActiveFeatureStyle(activeFeatureStyle ?? getDefaultActiveFeatureStyle());
    }, [controller, activeFeatureStyle]);
    useEffect(() => {
        controller?.setFinishedFeatureStyle(
            finishedFeatureStyle ?? getDefaultFinishedFeatureStyle()
        );
    }, [controller, finishedFeatureStyle]);

    useEffect(() => {
        if (measurementsChangeHandler) {
            controller?.setMeasurementSourceChangedHandler(measurementsChangeHandler);
        }
    }, [controller, measurementsChangeHandler]);

    useEffect(() => {
        if (predefinedMeasurements) {
            controller?.setPredefinedMeasurements(predefinedMeasurements);
        }
    }, [controller, predefinedMeasurements]);

    // Start / Stop measurement on selection change
    useEffect(() => {
        if (!controller) {
            return;
        }

        controller.startMeasurement(selectedMeasurement);
        return () => {
            controller.stopMeasurement();
        };
    }, [controller, selectedMeasurement]);

    function changeMeasurement(measurementType: string) {
        if (measurementType === "distance" || measurementType === "area") {
            setMeasurement(measurementType);
        } else {
            throw new Error(`Unexpected measurement type: '${measurementType}'.`);
        }
    }

    function removeMeasurements() {
        controller?.clearMeasurements();
    }

    return (
        <Box {...containerProps}>
            <Text mb={3}>{intl.formatMessage({ id: "measurementInfoText" })}</Text>
            <FormControl mb={4} alignItems="center">
                <HStack mb={2}>
                    <FormLabel mb={1}>{label("measurementLabel")}</FormLabel>
                    <Select
                        value={selectedMeasurement}
                        onChange={(e) => changeMeasurement(e.target.value)}
                        className="measurement-select"
                    >
                        <option value={"distance"}>{label("distance")}</option>
                        <option value={"area"}>{label("area")}</option>
                    </Select>
                </HStack>
            </FormControl>
            <Button
                padding={2}
                className="measurement-delete-button"
                onClick={removeMeasurements}
                width="100%"
            >
                {label("deleteMeasurementLabel")}
            </Button>
        </Box>
    );
};

/** Creates a MeasurementController instance for the given map. */
function useController(map: MapModel | undefined, intl: PackageIntl) {
    const [controller, setController] = useState<MeasurementController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }
        const controller = new MeasurementController(map.olMap, {
            getContinueMessage() {
                return intl.formatMessage({ id: "tooltips.continue" });
            },
            getHelpMessage() {
                return intl.formatMessage({ id: "tooltips.help" });
            },
            formatNumber(value) {
                return intl.formatNumber(value, {
                    maximumFractionDigits: 2
                });
            }
        });

        setController(controller);
        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, intl]);
    return controller;
}

function getDefaultActiveFeatureStyle() {
    return [
        new Style({
            stroke: new Stroke({
                color: "#fff",
                lineDash: [10, 10],
                width: 5
            })
        }),
        new Style({
            fill: new Fill({
                color: "rgba(0,0,0,0.15)"
            }),
            stroke: new Stroke({
                color: "rgba(0, 0, 0, 0.7)",
                lineDash: [10, 10],
                width: 3
            }),
            image: new CircleStyle({
                radius: 5,
                stroke: new Stroke({
                    color: "rgba(0, 0, 0, 0.7)",
                    width: 2
                }),
                fill: new Fill({
                    color: "rgba(255, 255, 255, 0.2)"
                })
            })
        })
    ];
}

function getDefaultFinishedFeatureStyle() {
    return [
        new Style({
            stroke: new Stroke({
                color: "#fff",
                width: 5
            })
        }),
        new Style({
            stroke: new Stroke({
                color: "#0b96fc",
                width: 3
            }),
            fill: new Fill({
                color: "rgba(11,150,252,0.15)"
            })
        })
    ];
}
