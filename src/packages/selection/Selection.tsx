// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, FormControl, FormLabel, Select } from "@open-pioneer/chakra-integration";
import { FC, useCallback, useEffect, useState } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { Geometry } from "ol/geom";
import { PiUserRectangle } from "react-icons/pi";
import { useIntl } from "open-pioneer:react-hooks";
import { FakePointSelectionSource } from "./testSources";
import { SelectionSource } from "./api";
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

    let sources: SelectionSource[] = [];
    const [source, setSource] = useState("");
    const mapState = useMapModel(mapId);
    const { onInputChanged } = useSelectionState();
    const controller = useDragController(mapState.map, intl, onInputChanged);

    useEffect(() => {
        if (!activeState) controller?.destroy();
    }, [activeState, controller]);

    if (sourceLabel) {
        const fakeSource = new FakePointSelectionSource(5000);
        if (sourceLabel.includes(fakeSource.label)) {
            sources = [fakeSource];
        }
    }

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
