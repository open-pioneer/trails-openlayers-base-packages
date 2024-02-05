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
import { useMapModel } from "@open-pioneer/map";
import OlMap from "ol/Map";
import html2canvas, { Options } from "html2canvas";
import { jsPDF } from "jspdf";
import { ScaleLine } from "ol/control";
import { createManualPromise } from "@open-pioneer/core";
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

    const { map } = useMapModel(mapId);

    function changeFileFormat(fileFormat: string) {
        if (fileFormat === "png" || fileFormat === "pdf") {
            setSelectedFileFormat(fileFormat);
        }
    }

    async function exportMap() {
        if (map && selectedFileFormat) {
            const olMap = map.olMap;

            await handleScaleLine(olMap);

            // export options for html2canvas.
            const exportOptions: Partial<Options> = {};

            html2canvas(olMap.getViewport(), exportOptions).then((canvas: HTMLCanvasElement) => {
                if (canvas) {
                    selectedFileFormat == "png"
                        ? exportMapInPNG(olMap, canvas)
                        : exportMapInPDF(olMap, canvas);
                }
                //olMap.removeControl(scaleLine);
            });
        }
    }

    async function handleScaleLine(olMap: OlMap) {
        const scaleLine = new ScaleLine({ bar: true, text: true, minWidth: 125 });
        const renderPromise = createManualPromise<void>();
        const oldRender = scaleLine.render;
        scaleLine.render = (...args) => {
            oldRender.apply(scaleLine, args);
            renderPromise.resolve();
        };
        olMap.addControl(scaleLine);
        await renderPromise.promise;
        await new Promise((resolve) => {
            requestAnimationFrame(resolve);
        });
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
            <Button padding={2} className="export-button" onClick={exportMap} width="100%">
                {intl.formatMessage({ id: "export" })}
            </Button>
        </Box>
    );
};

function exportMapInPNG(map: OlMap, canvas: HTMLCanvasElement) {
    const link = document.createElement("a");
    link.setAttribute("download", "map.png");
    // Save the image locally automatically
    link.href = canvas.toDataURL("image/png", 0.8);
    link.click();
}
function exportMapInPDF(map: OlMap, canvas: HTMLCanvasElement) {
    // Landscape map export
    const size = map.getSize();
    const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: size
    });
    const imgUrlStr = canvas.toDataURL("image/jpeg");
    size && size[0] && size[1] && pdf.addImage(imgUrlStr, "JPEG", 0, 0, size[0], size[1]);
    pdf.text("Default title", 10, 10);

    pdf.save("map.pdf");
}
