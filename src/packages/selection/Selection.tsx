// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, FormControl, FormLabel, Select } from "@open-pioneer/chakra-integration";
import { FC, useCallback, useEffect, useState } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { DragBox, Extent, Select as SelectInteraction } from "ol/interaction.js";
import { Fill, Stroke, Style } from "ol/style.js";
import { mouseActionButton } from "ol/events/condition";
import { Geometry } from "ol/geom";
import { PiUserRectangle } from "react-icons/pi";
import { useIntl } from "open-pioneer:react-hooks";
import { FakePointSelectionSource } from "./testSources";
import { SelectionSource } from "./api";
import DragZoom from "ol/interaction/DragZoom";
import DragRotateAndZoom from "ol/interaction/DragRotateAndZoom";

/**
 * Properties supported by the {@link Search} component.
 */
export interface SelectionProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
    /**
     * Array of source labels
     */
    sourceLabel: string[];
}

export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { mapId, sourceLabel } = props;
    const { containerProps } = useCommonComponentProps("selection", props);
    const { map } = useMapModel(mapId);
    const [testResult, setTestResult] = useState("Test");
    const { onInputChanged } = useSelectionState();
    let sources: SelectionSource[] = [];
    const [source, setSource] = useState("");

    if (sourceLabel) {
        const fakeSource = new FakePointSelectionSource(5000);
        if (sourceLabel.includes(fakeSource.label)) {
            sources = [fakeSource];
        }
    }

    const selectedStyle = new Style({
        fill: new Fill({
            color: "rgba(255, 255, 255, 0.6)"
        }),
        stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.7)",
            width: 2
        })
    });

    // a normal select interaction to handle click
    const select = new SelectInteraction({
        style: function (feature) {
            const color = feature.get("COLOR_BIO") || "#eeeeee";
            selectedStyle?.getFill()?.setColor(color);
            return selectedStyle;
        }
    });

    map?.olMap.addInteraction(select);
    const dragBox = new DragBox({
        condition: mouseActionButton
    });

    removePreviousDragBox(map);
    //map?.olMap.removeInteraction(dragBox);
    map?.olMap.addInteraction(dragBox);
    dragBox.on("boxend", function () {
        const boxExtent = dragBox.getGeometry().getExtent();
        onInputChanged(dragBox.getGeometry());
        setTestResult((boxExtent as unknown as Extent)?.toString());
    });

    useEffect(() => {
        if (!map) {
            return;
        }
        return () => {
            removePreviousDragBox(map);
        };
    }, [map]);

    return (
        <Box {...containerProps}>
            <Button isActive={true} leftIcon={<PiUserRectangle />}>
                {intl.formatMessage({ id: "rectangle" })}
            </Button>

            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectSource" })}</FormLabel>
                <Select value={source} onChange={(e) => setSource(e.target.value)}>
                    {sources.map((opt, idx) => (
                        <option disabled={!!opt.status} key={idx} value={opt.label}>
                            {opt.label}
                        </option>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

function useSelectionState() {
    const startSelection = (geometry: Geometry) => {};

    const onInputChanged = useCallback((geometry: Geometry) => {
        startSelection(geometry);
    }, []);
    return {
        onInputChanged
    };
}

function removePreviousDragBox(map: MapModel | undefined) {
    const interactions = map?.olMap.getInteractions().getArray();
    const dragBox = interactions?.find((interaction) => {
        const isDragZoom =
            interaction instanceof DragZoom || interaction instanceof DragRotateAndZoom;
        return !isDragZoom && interaction instanceof DragBox;
    });
    if (dragBox) {
        map?.olMap.removeInteraction(dragBox);
    }
}
