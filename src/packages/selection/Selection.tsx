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
import { InteractionsController } from "./InteractionsController";
import { PackageIntl } from "@open-pioneer/runtime/i18n";
import { DragController } from "./DragController";

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

    /**
     * Is Tool activ
     */
    activeState: boolean;
}

export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { mapId, sourceLabel, activeState } = props;
    const { containerProps } = useCommonComponentProps("selection", props);
    const { map } = useMapModel(mapId);

    let sources: SelectionSource[] = [];
    const [source, setSource] = useState("");
    const mapState = useMapModel(mapId);
    const { onInputChanged } = useSelectionState();
    const controller = useDragController(mapState.map, intl, onInputChanged);

    useEffect(() => {
        if (!activeState) controller?.destroy();
    }, [activeState, controller]);

    //todo: check how the sources should be accessed. do we need to create hook for sources?
    if (sourceLabel) {
        const fakeSource = new FakePointSelectionSource(5000);
        if (sourceLabel.includes(fakeSource.label)) {
            sources = [fakeSource];
        }
    }

    const result = useInteractions(map);
    console.log(result);

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
    const startSelection = (geometry: Geometry): void => {};

    const onInputChanged = useCallback((geometry: Geometry) => {
        startSelection(geometry);
    }, []);
    return {
        onInputChanged
    };
}

function useInteractions(map: MapModel | undefined) {
    const [testResult, setTestResult] = useState("Test");
    const { onInputChanged } = useSelectionState();

    useEffect(() => {
        if (!map) {
            return;
        }

        const controller = new InteractionsController(map.olMap);
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

        map?.olMap.addInteraction(dragBox);
        controller.setCurrentDragBox(dragBox);

        dragBox.on("boxend", function () {
            const boxExtent = dragBox?.getGeometry().getExtent();
            dragBox && onInputChanged(dragBox.getGeometry());
            setTestResult((boxExtent as unknown as Extent)?.toString());
        });

        const selectedStyle = new Style({
            fill: new Fill({
                color: "rgba(255, 255, 255, 0.6)"
            }),
            stroke: new Stroke({
                color: "rgba(255, 255, 255, 0.7)",
                width: 2
            })
        });

        return () => {
            controller.removeDragBoxInteraction();
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    return testResult;
}
function useDragController(
    map: MapModel | undefined,
    intl: PackageIntl,
    extendHandler: (geometry: Geometry) => void
) {
    const [controller, setController] = useState<DragController | undefined>(undefined);
    useEffect(() => {
        if (!map) {
            return;
        }

        const controller = new DragController(
            map.olMap,
            intl.formatMessage({ id: "tooltip" }),
            extendHandler
        );
        setController(controller);
        return () => {
            controller.destroy();
            setController(undefined);
        };
    }, [map, intl, extendHandler]);
    return controller;
}
