// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, FormControl, FormLabel, Select } from "@open-pioneer/chakra-integration";
import { FC, useCallback, useState } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useMapModel } from "@open-pioneer/map";
import { DragBox, Extent, Select as SelectInteraction } from "ol/interaction.js";
import { Fill, Stroke, Style } from "ol/style.js";
import { mouseActionButton } from "ol/events/condition";
import { Geometry } from "ol/geom";
import { PiUserRectangle } from "react-icons/pi";
import { useIntl } from "open-pioneer:react-hooks";

/**
 * Properties supported by the {@link Search} component.
 */
export interface SelectionProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { mapId } = props;
    const { containerProps } = useCommonComponentProps("selection", props);
    const mapState = useMapModel(mapId);
    const [testResult, setTestResult] = useState("Test");
    const { onInputChanged } = useSelectionState();

    const sources = [];
    const source = "";
    const sourceStatus = false;

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

    mapState.map?.olMap.addInteraction(select);
    const dragBox = new DragBox({
        condition: mouseActionButton
    });

    mapState.map?.olMap.addInteraction(dragBox);
    dragBox.on("boxend", function () {
        const boxExtent = dragBox.getGeometry().getExtent();
        onInputChanged(dragBox.getGeometry());
        setTestResult((boxExtent as unknown as Extent)?.toString());
    });

    return (
        <Box {...containerProps}>
            <Button isActive={true} leftIcon={<PiUserRectangle />}>
                {intl.formatMessage({ id: "rectangle" })}
            </Button>

            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectSource" })}</FormLabel>
                <Select value={source}>
                    {!sourceStatus ? (
                        <option disabled={true} value="'source 1'">
                            {" "}
                            source 2
                        </option>
                    ) : (
                        <option value="'source 1'">source 1</option>
                    )}
                </Select>
            </FormControl>

            {/*<span>{testResult}</span>*/}
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
