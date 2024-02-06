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
            const exportOptions: Partial<Options> = {
                useCORS: true,
                ignoreElements: function (element: Element) {
                    const classNames: string = element.className || "";
                    if (typeof classNames === "object") return false;

                    return classNames.includes("map-anchors");
                }
            };

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

function exportMapInPNG(map: OlMap, mapCanvas: HTMLCanvasElement) {
    const containerCanvas = document.createElement("canvas");
    containerCanvas.width = mapCanvas.width;
    containerCanvas.height = mapCanvas.height + 50;
    containerCanvas.style.backgroundColor = "#fff";

    const context = containerCanvas.getContext("2d");

    if (context) {
        const text = "Default title for printing";

        context.fillStyle = "#fff"; // background color for background rect
        context.fillRect(0, 0, containerCanvas.width, containerCanvas.height); //draw background rect
        context.font = 20 + "px bold Arial";
        context.textAlign = "center";
        context.fillStyle = "#000"; // text color

        const x = containerCanvas.width / 2; //align text to center
        context.fillText(text, x, 20);
    }
    context?.drawImage(mapCanvas, 0, 50);

    const link = document.createElement("a");
    link.setAttribute("download", "map.png");
    link.href = containerCanvas.toDataURL("image/png", 0.8);
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

    pdf.setFontSize(20);
    if (size && size[0] && size[1]) {
        const height = size[1];
        const width = size[0];
        pdf.addImage(imgUrlStr, "JPEG", 0, 50, width, height - 50);
        pdf.text("Default title for printing", width / 2, 30, { align: "center" });
        pdf.save("map.pdf");
    }
}
