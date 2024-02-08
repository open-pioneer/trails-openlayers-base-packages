// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select
} from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { FileFormatType, PrintingController } from "./PrintingController";
import { createLogger } from "@open-pioneer/core";

const LOG = createLogger("printing");

/**
 * This is special property for the Printing.
 */
export interface PrintingProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

/**
 * The `Printing` component can be used to download the current map view as a printable file.
 */
export const Printing: FC<PrintingProps> = (props) => {
    const intl = useIntl();

    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("printing", props);
    const [selectedFileFormat, setSelectedFileFormat] = useState<FileFormatType>("pdf");
    const [title, setTitle] = useState<string>("");
    const [running, setRunning] = useState<boolean>(false);

    const { map } = useMapModel(mapId);

    const controller = useController(map);

    useEffect(() => {
        controller?.setFileFormat(selectedFileFormat);
    }, [controller, selectedFileFormat]);

    useEffect(() => {
        controller?.setTitle(title);
    }, [controller, title]);

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
            .handleMapExport()
            .catch((error) => {
                //Todo: add notification with a generic error message (e.g. "Printing failed")
                LOG.error("Failed to print the map", error);
            })
            .finally(() => setRunning(false));
    }

    return (
        <Box {...containerProps}>
            <FormControl mb={4} alignItems="center">
                <HStack mb={2}>
                    <FormLabel minWidth="82" mb={1}>
                        {intl.formatMessage({ id: "title" })}
                    </FormLabel>
                    <Input
                        placeholder={intl.formatMessage({ id: "input.placeholder" })}
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value);
                        }}
                        isRequired
                        autoFocus // eslint-disable-line jsx-a11y/no-autofocus
                    />
                </HStack>
                <HStack mb={2}>
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
                </HStack>
            </FormControl>
            <Button
                isLoading={running}
                loadingText={intl.formatMessage({ id: "export" })} // TODO: Message 'Map is printing...'
                disabled={running}
                padding={2}
                className="printing-export-button"
                onClick={exportMap}
                width="100%"
            >
                {intl.formatMessage({ id: "export" })}
            </Button>
        </Box>
    );
};

function useController(map: MapModel | undefined) {
    const [controller, setController] = useState<PrintingController | undefined>(undefined);

    useEffect(() => {
        if (!map) {
            return;
        }

        const controller = new PrintingController(map.olMap);
        setController(controller);

        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map]);
    return controller;
}
