// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Box, Button, Field, HStack, Input } from "@chakra-ui/react";
import { NativeSelectField, NativeSelectRoot } from "@open-pioneer/chakra-snippets/native-select";
import { createLogger } from "@open-pioneer/core";
import { LayerFactory, MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { sourceId } from "open-pioneer:source-info";
import { FC, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
    FileFormatType,
    isFileFormatType,
    isPageOrientationType,
    isPageFormatType,
    PageOrientationType,
    PageFormatType,
    PrintingService,
    ViewPaddingBehavior
} from "./index";
import { PrintingController } from "./PrintingController";
import { getPageSize, getScreenSizeForPageSize, getViewPadding, PageSize } from "./utils";

const LOG = createLogger(sourceId);

const PRINT_AREA_BUFFER = 20; // padding between map frame and printing area in pixels

const DEFAULT_SCALES = [
    2500000, 2000000, 1500000, 1000000, 750000, 500000, 300000, 250000, 200000, 150000, 100000,
    75000, 50000, 25000, 20000, 15000, 10000, 7500, 5000, 2500, 2000, 1500, 1000, 500, 250, 100
];
const DEFAULT_DPIS = [96, 150, 300];
const DEFAULT_PAGE_FORMATS: PageFormatType[] = ["a3", "a4", "a5"];
const DEFAULT_PAGE_ORIENTATIONS: PageOrientationType[] = ["landscape", "portrait"];
const DEFAULT_FILE_FORMATS: FileFormatType[] = ["png", "pdf"];

const INITIAL_DPI = 96;
const INITIAL_PAGE_FORMAT: PageFormatType = "a4";
const INITIAL_PAGE_ORIENTATION: PageOrientationType = "landscape";
const INITIAL_FILE_FORMAT: FileFormatType = "pdf";

/**
 * Properties supported by the {@link Printing} component.
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

    /**
     * The set of print resolutions in DPI that can be selected by the user (default: selection of pre-configured values).
     */
    dpis?: number[];

    /**
     * The set of page formats that can be selected by the user (default: selection of pre-configured values).
     */
    pageFormats?: PageFormatType[];

    /**
     * The set of page orientations that can be selected by the user (default: selection of pre-configured values).
     */
    pageOrientations?: PageOrientationType[];

    /**
     * The set of file formats that can be selected by the user (default: selection of pre-configured values).
     */
    fileFormats?: FileFormatType[];
}

/**
 * The `Printing` component can be used to download the current map view as a printable file.
 */
export const Printing: FC<PrintingProps> = (props) => {
    const intl = useIntl();
    const map = useMapModelValue(props);

    const {
        viewPadding = "auto",
        scales = DEFAULT_SCALES,
        dpis = DEFAULT_DPIS,
        pageFormats = DEFAULT_PAGE_FORMATS,
        pageOrientations = DEFAULT_PAGE_ORIENTATIONS,
        fileFormats = DEFAULT_FILE_FORMATS
    } = props;
    const { containerProps } = useCommonComponentProps("printing", props);

    const [pageFormat, setPageFormat] = useState(() =>
        getInitialOption(pageFormats, INITIAL_PAGE_FORMAT, "pageFormats")
    );
    const [orientation, setOrientation] = useState(() =>
        getInitialOption(pageOrientations, INITIAL_PAGE_ORIENTATION, "pageOrientations")
    );
    const [scale, setScale] = useState(() =>
        getFittingScale(map, scales, getPageSize(pageFormat, orientation))
    );
    const [dpi, setDpi] = useState(() => getInitialOption(dpis, INITIAL_DPI, "dpis"));
    const [fileFormat, setFileFormat] = useState(() =>
        getInitialOption(fileFormats, INITIAL_FILE_FORMAT, "fileFormats")
    );
    const [title, setTitle] = useState<string>("");
    const [running, setRunning] = useState<boolean>(false);

    const controller = useController(map, intl, {
        viewPadding: viewPadding,
        pageFormat: pageFormat,
        orientation: orientation,
        scale: scale
    });
    const notifier = useService<NotificationService>("notifier.NotificationService");

    function changePageFormat(pageFormat: string) {
        if (isPageFormatType(pageFormat)) {
            setPageFormat(pageFormat);
        }
    }

    function changeOrientation(orientation: string) {
        if (isPageOrientationType(orientation)) {
            setOrientation(orientation);
        }
    }

    function changeFileFormat(fileFormat: string) {
        if (isFileFormatType(fileFormat)) {
            setFileFormat(fileFormat);
        }
    }

    function changeDpi(dpi: string) {
        const res = parseInt(dpi);
        if (res) {
            setDpi(res);
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
                dpi: dpi
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

    const pageFormatOptions = useMemo(
        () =>
            pageFormats.map((format) => ({
                value: format,
                label: intl.formatMessage({ id: "pageFormat." + format })
            })),
        [intl, pageFormats]
    );
    const pageOrientationOptions = useMemo(
        () =>
            pageOrientations.map((pageOrientation) => ({
                value: pageOrientation,
                label: intl.formatMessage({ id: "pageOrientation." + pageOrientation })
            })),
        [intl, pageOrientations]
    );
    const fileFormatOptions = useMemo(
        () =>
            fileFormats.map((format) => ({
                value: format,
                label: intl.formatMessage({ id: "fileFormat." + format })
            })),
        [intl, fileFormats]
    );
    const dpiOptions = useMemo(
        () => dpis.map((value) => ({ value, label: String(value) })),
        [dpis]
    );
    const scaleOptions = useMemo(
        () => scales.map((value) => ({ value, label: renderScaleText(intl, value) })),
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
                <FormRow label={intl.formatMessage({ id: "title" })}>
                    <Input
                        placeholder={intl.formatMessage({ id: "input.placeholder" })}
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value);
                        }}
                    />
                </FormRow>
                <SelectField
                    label={intl.formatMessage({ id: "pageFormat.label" })}
                    className="printing-select-pageformat"
                    value={pageFormat}
                    options={pageFormatOptions}
                    onChange={changePageFormat}
                />
                <SelectField
                    label={intl.formatMessage({ id: "pageOrientation.label" })}
                    className="printing-select-orientation"
                    value={orientation}
                    options={pageOrientationOptions}
                    onChange={changeOrientation}
                />
                <SelectField
                    label={intl.formatMessage({ id: "fileFormat.label" })}
                    className="printing-select-fileformat"
                    value={fileFormat}
                    options={fileFormatOptions}
                    onChange={changeFileFormat}
                />
                <SelectField
                    label={intl.formatMessage({ id: "dpi" })}
                    className="printing-select-dpi"
                    value={dpi}
                    options={dpiOptions}
                    onChange={changeDpi}
                />
                <SelectField
                    label={intl.formatMessage({ id: "scale.label" })}
                    className="printing-select-scale"
                    value={scale}
                    options={scaleOptions}
                    onChange={changeScale}
                />
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

function FormRow(props: { label: string; children: ReactNode }) {
    return (
        <Field.Root asChild>
            <HStack mb={2}>
                <Field.Label minWidth={82} mb={1}>
                    {props.label}
                </Field.Label>
                {props.children}
            </HStack>
        </Field.Root>
    );
}

interface SelectFieldProps {
    label: string;
    className: string;
    value: string | number;
    options: { value: string | number; label: string }[];
    onChange: (value: string) => void;
}

function SelectField(props: SelectFieldProps) {
    const { label, className, value, options, onChange } = props;
    return (
        <FormRow label={label}>
            <NativeSelectRoot>
                <NativeSelectField
                    className={className}
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                    }}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </NativeSelectField>
            </NativeSelectRoot>
        </FormRow>
    );
}

interface PrintingControllerOptions {
    viewPadding: ViewPaddingBehavior;
    pageFormat: PageFormatType;
    orientation: PageOrientationType;
    scale: number;
}

/**
 * Create a PrintingController instance to export the map view.
 */
function useController(map: MapModel, intl: PackageIntl, options: PrintingControllerOptions) {
    const printingService = useService<PrintingService>("printing.PrintingService");
    const [controller, setController] = useState<PrintingController | undefined>(undefined);
    const layerFactory = useService<LayerFactory>("map.LayerFactory");

    useEffect(() => {
        const controller = new PrintingController(map, layerFactory, printingService, {
            overlayText: intl.formatMessage({ id: "printingMap" })
        });
        setController(controller);

        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, intl, printingService, layerFactory]);

    useEffect(() => {
        controller?.setViewPadding(options.viewPadding);
    }, [controller, options.viewPadding]);

    useEffect(() => {
        controller?.setPageFormat(options.pageFormat);
    }, [controller, options.pageFormat]);

    useEffect(() => {
        controller?.setOrientation(options.orientation);
    }, [controller, options.orientation]);

    useEffect(() => {
        controller?.setScale(options.scale);
    }, [controller, options.scale]);

    return controller;
}

function renderScaleText(intl: PackageIntl, rawScale: number): string {
    return "1 : " + intl.formatNumber(rawScale);
}

// find the largest scale that fits completely inside the map view, considering some padding
function getFittingScale(map: MapModel, scales: number[], pageSize: PageSize): number {
    const fallbackScale = scales[0];
    if (fallbackScale == null) {
        throw new Error("'scales' must not be empty");
    }

    const mapSize = map.olMap.getSize();
    if (!mapSize || mapSize.length < 2) {
        return fallbackScale;
    }
    const [mapWidth, mapHeight] = mapSize as [number, number];

    const viewPadding = getViewPadding(map.olView);
    const maxPrintHeight = mapHeight - viewPadding.top - viewPadding.bottom - PRINT_AREA_BUFFER; // pixels
    const maxPrintWidth = mapWidth - viewPadding.left - viewPadding.right - PRINT_AREA_BUFFER;

    const sortedScales = scales.toSorted((a, b) => b - a); // sort descending
    // return first scale that fits in the map screen
    for (const scale of sortedScales) {
        const screenSize = getScreenSizeForPageSize(map, pageSize, scale);
        if (!screenSize) break;

        const { pixelWidth, pixelHeight } = screenSize;
        if (pixelWidth <= maxPrintWidth && pixelHeight <= maxPrintHeight) return scale;
    }

    return fallbackScale;
}

// The preferred option if the list contains it, otherwise the first entry of the list.
function getInitialOption<T>(options: T[], preferred: T, propName: string): T {
    if (options.includes(preferred)) {
        return preferred;
    }

    const first = options[0];
    if (first == null) {
        throw new Error(`'${propName}' must not be empty`);
    }
    return first;
}
