// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Field, HStack, Text } from "@chakra-ui/react";
import { NativeSelectField, NativeSelectRoot } from "@open-pioneer/chakra-snippets/native-select";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { StyleLike } from "ol/style/Style";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { MeasurementController, MeasurementType } from "./MeasurementController";

/** Emitted when a new measurement is being added to the map. */
export interface MeasurementsAddEvent {
    kind: "add-measurement";
    geometry: MeasurementGeometry;
}

/** Emitted when a measurement is being removed from the map. */
export interface MeasurementsRemoveEvent {
    kind: "remove-measurement";
    geometry: MeasurementGeometry;
}

/**
 * A change event emitted by {@link Measurement} when measurements change.
 *
 * NOTE: Non-exhaustive. More event types may be added in a future version.
 **/
export type MeasurementsChangeEvent = MeasurementsAddEvent | MeasurementsRemoveEvent;

/**
 * Represents the geometry of a measurement.
 */
export type MeasurementGeometry = LineString | Polygon;

/**
 * This is for special properties of the Measurement.
 */
export interface MeasurementProps extends CommonComponentProps, MapModelProps {
    /**
     * The style for the active drawing feature's geometry.
     */
    activeFeatureStyle?: StyleLike;

    /**
     * The style for the finished drawn feature's geometry.
     */
    finishedFeatureStyle?: StyleLike;

    /**
     * List of measurements to be rendered when the component is initialized.
     */
    predefinedMeasurements?: MeasurementGeometry[];

    /**
     * Event handler that is called whenever a measurement is added or removed.
     */
    onMeasurementsChange?: (event: MeasurementsChangeEvent) => void;
}

/**
 * The `Measurement` component can be used in an app to measure geometries (areas or lines) on the map.
 */
export const Measurement: FC<MeasurementProps> = (props) => {
    const intl = useIntl();
    const { containerProps } = useCommonComponentProps("measurement", props);
    const [selectedMeasurement, setMeasurement] = useState<MeasurementType>("distance");
    const label = (id: string) => intl.formatMessage({ id: id });
    const map = useMapModelValue(props);
    const controller = useController(map, props, intl);

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
            <Field.Root mb={4} asChild>
                <HStack mb={2} alignItems="center">
                    <Field.Label mb={1}>{label("measurementLabel")}</Field.Label>
                    <NativeSelectRoot>
                        <NativeSelectField
                            value={selectedMeasurement}
                            onChange={(e) => changeMeasurement(e.target.value)}
                            className="measurement-select"
                        >
                            <option value={"distance"}>{label("distance")}</option>
                            <option value={"area"}>{label("area")}</option>
                        </NativeSelectField>
                    </NativeSelectRoot>
                </HStack>
            </Field.Root>
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
function useController(map: MapModel, props: MeasurementProps, intl: PackageIntl) {
    const {
        activeFeatureStyle,
        finishedFeatureStyle,
        onMeasurementsChange,
        predefinedMeasurements
    } = props;
    const [controller, setController] = useState<MeasurementController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }
        const controller = new MeasurementController(map, {
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
        controller?.setMeasurementSourceChangedHandler(onMeasurementsChange);
    }, [controller, onMeasurementsChange]);

    useEffect(() => {
        controller?.setPredefinedMeasurements(predefinedMeasurements ?? []);
    }, [controller, predefinedMeasurements]);
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
