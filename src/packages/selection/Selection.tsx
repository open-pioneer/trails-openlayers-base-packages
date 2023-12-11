// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, FormControl, FormLabel, Tooltip } from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime/i18n";
import { OptionProps, Select, chakraComponents } from "chakra-react-select";
import { Geometry } from "ol/geom";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { PiUserRectangle } from "react-icons/pi";
import { DragController } from "./DragController";
import { SelectionController } from "./SelectionController";
import { SelectionResult, SelectionSource } from "./api";

import {} from "@open-pioneer/notifier"; // TODO: Workaround

/**
 * Properties supported by the {@link Selection} component.
 */
export interface SelectionProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Array of selection sources available for spatial selection.
     */
    sources: SelectionSource[];

    /**
     * This handler is called whenever the user has successfully (successfully) selected
     * some items.
     */
    onSelectionComplete?(event: SelectionCompleteEvent): void;
}

export interface SelectionCompleteEvent {
    /** The source that returned the {@link results}. */
    source: SelectionSource;

    /** Results selected by the user. */
    results: SelectionResult[];
}

/**
 * Properties for single select options.
 */
interface SelectOption {
    /**
     * The label of the select option.
     */
    label: string;

    /**
     * The value (SelectionSource) of the select option.
     */
    value: SelectionSource | undefined;
}

export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { mapId, sources, onSelectionComplete } = props;
    const { containerProps } = useCommonComponentProps("selection", props);

    // TODO: manage current source via select
    const currentSource = sources.find((s) => (s.status ?? "available") === "available");

    const [source, setSource] = useState("");
    const mapState = useMapModel(mapId);
    const { onExtentSelected } = useSelectionController(
        mapState.map,
        sources,
        currentSource,
        onSelectionComplete
    );
    useDragSelection(mapState.map, intl, onExtentSelected);

    const options: SelectOption[] = sources.map<SelectOption>((source) => {
        return { label: source.label, value: source };
    });

    return (
        <Box {...containerProps}>
            <Button isActive={true} leftIcon={<PiUserRectangle />}>
                {intl.formatMessage({ id: "rectangle" })}
            </Button>
            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectSource" })}</FormLabel>
                <Select
                    className="selection-sources"
                    classNamePrefix="react-select"
                    options={options}
                    menuPosition="fixed"
                    components={{ Option: SourceSelectOption }}
                    // TODO: watch "status" for changes and set isDisabled in `SourceSelectOption` only.
                    // It should be OK to remove this prop.
                    isOptionDisabled={(option) => option?.value?.status === "unavailable"}
                />
            </FormControl>
        </Box>
    );
};

function SourceSelectOption(props: OptionProps<SelectOption>): JSX.Element {
    const { value } = props.data;
    const intl = useIntl();
    // TODO: Label not working
    const notAvailableLabel: string | undefined = intl.formatMessage({ id: "sourceNotAvailable" });
    const label: string | undefined = value?.label;
    const isAvailable: boolean | undefined = value?.status === "available";

    return (
        <chakraComponents.Option {...props} isDisabled={!isAvailable}>
            {label}
            &nbsp;
            {!isAvailable && (
                <Tooltip label={notAvailableLabel} placement="right" openDelay={500}>
                    <span>
                        <FiAlertTriangle color={"red"} aria-label={notAvailableLabel} />
                    </span>
                </Tooltip>
            )}
        </chakraComponents.Option>
    );
}

function useSelectionController(
    mapModel: MapModel | undefined,
    sources: SelectionSource[],
    currentSource: SelectionSource | undefined,
    onSelectionComplete: ((event: SelectionCompleteEvent) => void) | undefined
) {
    const notifier = useService("notifier.NotificationService");
    const intl = useIntl();
    const [controller, setController] = useState<SelectionController | undefined>(undefined);
    useEffect(() => {
        if (!mapModel) {
            return;
        }
        const controller = new SelectionController({
            mapModel,
            sources,
            onError() {
                notifier.notify({
                    level: "error",
                    message: intl.formatMessage({ id: "selectionFailed" })
                });
            }
        });
        setController(controller);
        return () => {
            controller.destroy();
        };
    }, [mapModel, notifier, sources, intl]);

    const onExtentSelected = useEvent(async (geometry: Geometry) => {
        if (!controller || !currentSource) {
            return;
        }

        const selectionResult = await controller.select(currentSource, geometry.getExtent());
        if (!selectionResult) {
            return;
        }

        onSelectionComplete?.(selectionResult);
    });
    return {
        controller,
        onExtentSelected
    };
}

function useDragSelection(
    map: MapModel | undefined,
    intl: PackageIntl,
    onExtentSelected: (geometry: Geometry) => void
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        const controller = new DragController(
            map.olMap,
            intl.formatMessage({ id: "tooltip" }),
            onExtentSelected
        );
        return () => {
            controller.destroy();
        };
    }, [map, intl, onExtentSelected]);
}
