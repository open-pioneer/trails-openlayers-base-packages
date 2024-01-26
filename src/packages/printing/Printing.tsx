// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useState } from "react";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    HStack,
    Input,
    Select
} from "@open-pioneer/chakra-integration";

export type FileFormatType = "png" | "pdf";

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

    function changeFileFormat(fileFormat: string) {
        if (fileFormat === "png" || fileFormat === "pdf") {
            setSelectedFileFormat(fileFormat);
        }
    }

    function exportMap() {
        console.log("export clicked");
    }

    return (
        <Box {...containerProps}>
            <FormControl mb={4} alignItems="center">
                <HStack mb={2}>
                    <FormLabel mb={1}>{intl.formatMessage({ id: "title" })}</FormLabel>
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
                    <FormLabel mb={1}>{intl.formatMessage({ id: "fileFormat" })}</FormLabel>
                    <Select
                        value={selectedFileFormat}
                        onChange={(e) => changeFileFormat(e.target.value)}
                        className="printing-select"
                    >
                        <option value={"jpg"}>JPG</option>
                        <option value={"pdf"}>PDF</option>
                    </Select>
                </HStack>
            </FormControl>
            <Button padding={2} className="export-button" onClick={exportMap} width="100%">
                {intl.formatMessage({ id: "export" })}
            </Button>
        </Box>
    );
};
