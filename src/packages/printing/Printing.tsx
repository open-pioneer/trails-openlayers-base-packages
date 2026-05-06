// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Field, HStack, Input } from "@chakra-ui/react";
import { NativeSelectField, NativeSelectRoot } from "@open-pioneer/chakra-snippets/native-select";
import { createLogger } from "@open-pioneer/core";
import { MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, FormEvent, useEffect, useMemo, useState } from "react";
import { FileFormatType, PrintingController } from "./PrintingController";
import type { PrintingService, ViewPaddingBehavior } from "./index";
import OlMap from "ol/Map";
import {
    getPageDimensions,
    getResolution,
    getViewPadding,
    PageOrientationType,
    PageSizeType
} from "./utils";

const LOG = createLogger("bis-printing");

const PRINT_AREA_BUFFER = 20; // padding between map frame and printing area in pixels

const DEFAULT_SCALES = [
    2500000, 2000000, 1500000, 1000000, 750000, 500000, 300000, 250000, 200000, 150000, 100000,
    75000, 50000, 25000, 20000, 15000, 10000, 7500, 5000, 2500, 2000, 1500, 1000, 500, 250, 100
];

const INITIAL_PAGE_SIZE = "a4";
const INITIAL_ORIENTATION = "landscape";

/**
 * This is special property for the Printing.
 */
export interface PrintingProps extends CommonComponentProps, MapModelProps {
    /**
     * Whether to respect the map view's padding when printing (default: `"auto"`).
     *
     * See also {@link ViewPaddingBehavior}.
     */
    viewPadding?: ViewPaddingBehavior;

    /**
     * The set of scales that can be selected by the user (default: selection of pre-configured values).
     */
    scales?: number[];
}

/**
 * The `Printing` component can be used to download the current map view as a printable file.
 */
export const Printing: FC<PrintingProps> = (props) => {
    const intl = useIntl();
    const map = useMapModelValue(props);

    const { viewPadding = "auto", scales = DEFAULT_SCALES } = props;
    const { containerProps } = useCommonComponentProps("printing", props);

    const initialScale = getFittingScale(map.olMap, scales);

    const [size, setSize] = useState<PageSizeType>(INITIAL_PAGE_SIZE);
    const [orientation, setOrientation] = useState<PageOrientationType>(INITIAL_ORIENTATION);
    const [fileFormat, setFileFormat] = useState<FileFormatType>("pdf");
    const [resolution, setResolution] = useState<number>(96);
    const [scale, setScale] = useState<number>(initialScale);
    const [title, setTitle] = useState<string>("");
    const [running, setRunning] = useState<boolean>(false);

    const controller = useController(map, intl, viewPadding, size, orientation, scale);
    const notifier = useService<NotificationService>("notifier.NotificationService");

    function changeSize(size: string) {
        if (size === "a3" || size === "a4" || size === "a5") {
            setSize(size);
        }
    }

    function changeOrientation(orientation: string) {
        if (orientation === "landscape" || orientation === "portrait") {
            setOrientation(orientation);
        }
    }

    function changeFileFormat(fileFormat: string) {
        if (fileFormat === "png" || fileFormat === "pdf") {
            setFileFormat(fileFormat);
        }
    }

    function changeResolution(resolution: string) {
        const res = parseInt(resolution);
        if (res) {
            setResolution(res);
        }
    }

    function changeScale(scale: string) {
        const sc = parseInt(scale);
        if (sc) {
            setScale(sc);
        }
    }

    function exportMap() {
        if (running || !controller) {
            return;
        }

        setRunning(true);

        controller
            .handleMapExport({
                title: title,
                fileFormat: fileFormat,
                resolution: resolution
            })
            .catch((error) => {
                const errorMessage = intl.formatMessage({ id: "printingFailed" });
                notifier.notify({
                    level: "error",
                    message: errorMessage
                });
                LOG.error("Failed to print the map", error);
            })
            .finally(() => {
                setRunning(false);
            });
    }

    const scaleOptions = useMemo(
        () =>
            scales.map((scaleValue) => (
                <option key={scaleValue} value={scaleValue}>
                    {renderScaleText(intl, scaleValue)}
                </option>
            )),
        [intl, scales]
    );

    return (
        <Box {...containerProps}>
            <Box
                as="form"
                aria-label={intl.formatMessage({ id: "formLabel" })}
                m={2}
                alignItems="center"
                onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    exportMap();
                }}
            >
                <Field.Root asChild>
                    <HStack mb={2}>
                        <Field.Label minWidth={82} mb={1}>
                            {intl.formatMessage({ id: "title" })}
                        </Field.Label>
                        <Input
                            placeholder={intl.formatMessage({ id: "input.placeholder" })}
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                            }}
                        />
                    </HStack>
                </Field.Root>
                <Field.Root asChild>
                    <HStack mb={2}>
                        <Field.Label minWidth={82} mb={1}>
                            {intl.formatMessage({ id: "pageSize.label" })}
                        </Field.Label>
                        <NativeSelectRoot>
                            <NativeSelectField
                                className="printing-select"
                                value={size}
                                onChange={(event) => {
                                    changeSize(event.target.value);
                                }}
                            >
                                <option value={"a3"}>
                                    {intl.formatMessage({ id: "pageSize.a3" })}
                                </option>
                                <option value={"a4"}>
                                    {intl.formatMessage({ id: "pageSize.a4" })}
                                </option>
                                <option value={"a5"}>
                                    {intl.formatMessage({ id: "pageSize.a5" })}
                                </option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </HStack>
                </Field.Root>
                <Field.Root asChild>
                    <HStack mb={2}>
                        <Field.Label minWidth={82} mb={1}>
                            {intl.formatMessage({ id: "pageOrientation.label" })}
                        </Field.Label>
                        <NativeSelectRoot>
                            <NativeSelectField
                                className="printing-select"
                                value={orientation}
                                onChange={(event) => {
                                    changeOrientation(event.target.value);
                                }}
                            >
                                <option value={"landscape"}>
                                    {intl.formatMessage({ id: "pageOrientation.landscape" })}
                                </option>
                                <option value={"portrait"}>
                                    {intl.formatMessage({ id: "pageOrientation.portrait" })}
                                </option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </HStack>
                </Field.Root>
                <Field.Root asChild>
                    <HStack mb={2}>
                        <Field.Label minWidth={82} mb={1}>
                            {intl.formatMessage({ id: "fileFormat" })}
                        </Field.Label>
                        <NativeSelectRoot>
                            <NativeSelectField
                                className="printing-select"
                                value={fileFormat}
                                onChange={(event) => {
                                    changeFileFormat(event.target.value);
                                }}
                            >
                                <option value={"png"}>PNG</option>
                                <option value={"pdf"}>PDF</option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </HStack>
                </Field.Root>
                <Field.Root asChild>
                    <HStack mb={2}>
                        <Field.Label minWidth={82} mb={1}>
                            {intl.formatMessage({ id: "resolution" })}
                        </Field.Label>
                        <NativeSelectRoot>
                            <NativeSelectField
                                className="printing-select"
                                value={resolution}
                                onChange={(event) => {
                                    changeResolution(event.target.value);
                                }}
                            >
                                <option value={96}>96</option>
                                <option value={150}>150</option>
                                <option value={300}>300</option>
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </HStack>
                </Field.Root>
                <Field.Root asChild>
                    <HStack mb={2}>
                        <Field.Label minWidth={82} mb={1}>
                            {intl.formatMessage({ id: "scale.label" })}
                        </Field.Label>
                        <NativeSelectRoot>
                            <NativeSelectField
                                className="printing-select"
                                value={scale}
                                onChange={(event) => {
                                    changeScale(event.target.value);
                                }}
                            >
                                {scaleOptions}
                            </NativeSelectField>
                        </NativeSelectRoot>
                    </HStack>
                </Field.Root>
                <Button
                    loading={running}
                    loadingText={intl.formatMessage({ id: "printingMap" })}
                    disabled={running}
                    mt={2}
                    p={2}
                    className="printing-export-button"
                    type="submit"
                    width="100%"
                >
                    {intl.formatMessage({ id: "export" })}
                </Button>
            </Box>
        </Box>
    );
};

/**
 * Create a PrintingController instance to export the map view.
 */
function useController(
    map: MapModel,
    intl: PackageIntl,
    viewPadding: ViewPaddingBehavior,
    size: PageSizeType,
    orientation: PageOrientationType,
    scale: number
) {
    const printingService = useService<PrintingService>("printing.PrintingService");
    const [controller, setController] = useState<PrintingController | undefined>(undefined);

    useEffect(() => {
        const controller = new PrintingController(map.olMap, printingService, {
            overlayText: intl.formatMessage({ id: "printingMap" })
        });
        setController(controller);

        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, intl, printingService]);

    useEffect(() => {
        controller?.setViewPadding(viewPadding);
    }, [controller, viewPadding]);

    useEffect(() => {
        controller?.setSize(size);
    }, [controller, size]);

    useEffect(() => {
        controller?.setOrientation(orientation);
    }, [controller, orientation]);

    useEffect(() => {
        controller?.setScale(scale);
    }, [controller, scale]);

    return controller;
}

function renderScaleText(intl: PackageIntl, rawScale: number): string {
    return "1 : " + intl.formatNumber(rawScale);
}

// find the largest scale that fits completely inside the map view, considering some padding
function getFittingScale(olMap: OlMap, scales: number[]): number {
    const fallbackScale = scales[0];
    if (!fallbackScale) {
        throw new Error("No scales defined");
    }

    const mapSize = olMap.getSize();
    if (!mapSize || mapSize.length < 2) {
        return fallbackScale;
    }
    const [mapWidth, mapHeight] = mapSize as [number, number];

    const viewPadding = getViewPadding(olMap);

    const maxPrintHeight = mapHeight - viewPadding.top - viewPadding.bottom - PRINT_AREA_BUFFER; // pixels
    const maxPrintWidth = mapWidth - viewPadding.left - viewPadding.right - PRINT_AREA_BUFFER;

    const resolution = getResolution(olMap); // pixels per meter
    if (!resolution) return fallbackScale;

    const width = resolution * maxPrintWidth; // meters
    const height = resolution * maxPrintHeight;

    const printDimension = getPageDimensions(INITIAL_PAGE_SIZE, INITIAL_ORIENTATION);

    const scaleWidth = width / (printDimension.width / 1000.0);
    const scaleHeight = height / (printDimension.height / 1000.0);

    const maxFittingScale = Math.min(scaleHeight, scaleWidth);

    scales.sort((a, b) => b - a); // sort descending
    return scales.find((scale) => scale <= maxFittingScale) ?? fallbackScale;
}
