// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select
} from "@open-pioneer/chakra-integration";
import { createLogger } from "@open-pioneer/core";
import { MapModel, MapModelProps, useMapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, FormEvent, useEffect, useState } from "react";
import { FileFormatType, PrintingController } from "./PrintingController";
import type { PrintingService, ViewPaddingBehavior } from "./index";

const LOG = createLogger("printing");

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
}

/**
 * The `Printing` component can be used to download the current map view as a printable file.
 */
export const Printing: FC<PrintingProps> = (props) => {
    const intl = useIntl();

    const { viewPadding = "auto" } = props;
    const { containerProps } = useCommonComponentProps("printing", props);
    const [selectedFileFormat, setSelectedFileFormat] = useState<FileFormatType>("pdf");
    const [title, setTitle] = useState<string>("");
    const [running, setRunning] = useState<boolean>(false);

    const notifier = useService<NotificationService>("notifier.NotificationService");

    const { map } = useMapModel(props);
    const controller = useController(map, intl, viewPadding);

    function changeFileFormat(fileFormat: string) {
        if (fileFormat === "png" || fileFormat === "pdf") {
            setSelectedFileFormat(fileFormat);
        }
    }

    function exportMap() {
        if (running || !controller) {
            return;
        }

        setRunning(true);
        controller
            .handleMapExport({
                title,
                fileFormat: selectedFileFormat
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

    return (
        <Box {...containerProps}>
            <Box
                as="form"
                m={2}
                alignItems="center"
                onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    exportMap();
                }}
            >
                <FormControl as={HStack} mb={2}>
                    <FormLabel minWidth="82" mb={1}>
                        {intl.formatMessage({ id: "title" })}
                    </FormLabel>
                    <Input
                        placeholder={intl.formatMessage({ id: "input.placeholder" })}
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value);
                        }}
                        autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                    />
                </FormControl>
                <FormControl as={HStack} mb={2}>
                    <FormLabel minWidth="82" mb={1}>
                        {intl.formatMessage({ id: "fileFormat" })}
                    </FormLabel>
                    <Select
                        value={selectedFileFormat}
                        onChange={(e) => changeFileFormat(e.target.value)}
                        className="printing-select"
                    >
                        <option value={"png"}>PNG</option>
                        <option value={"pdf"}>PDF</option>
                    </Select>
                </FormControl>
                <Button
                    isLoading={running}
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
    map: MapModel | undefined,
    intl: PackageIntl,
    viewPadding: ViewPaddingBehavior
) {
    const printingService = useService<PrintingService>("printing.PrintingService");
    const [controller, setController] = useState<PrintingController | undefined>(undefined);

    useEffect(() => {
        if (!map) {
            return;
        }

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

    return controller;
}
