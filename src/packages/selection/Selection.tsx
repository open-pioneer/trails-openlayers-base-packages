// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Flex,
    FormControl,
    FormLabel,
    Icon,
    Tooltip,
    VStack,
    chakra
} from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime/i18n";
import {
    OptionProps,
    Select,
    Props as SelectProps,
    SingleValueProps,
    chakraComponents,
    type SingleValue
} from "chakra-react-select";
import { Geometry } from "ol/geom";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { DragController } from "./DragController";
import { SelectionController } from "./SelectionController";
import { SelectionResult, SelectionSource, SelectionSourceStatus } from "./api";

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
interface SourceOption {
    /**
     * The label of the select source option.
     */
    label: string;

    /**
     * The value (SelectionSource) of the select source option.
     */
    value: SelectionSource | undefined;
}

/**
 * Properties for single select method options.
 */
interface MethodOption {
    /**
     * The label of the select method option.
     */
    label: string;

    /**
     * The value of the select method option.
     */
    value: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMMON_SELECT_PROPS: SelectProps<any, any, any> = {
    classNamePrefix: "react-select",
    menuPosition: "fixed",
    isSearchable: false,
    isClearable: false
};

export const Selection: FC<SelectionProps> = (props) => {
    const intl = useIntl();
    const { mapId, sources, onSelectionComplete } = props;
    const { containerProps } = useCommonComponentProps("selection", props);
    const [currentSource, setCurrentSource] = useState<SelectionSource | undefined>(() =>
        sources.find((s) => (s.status ?? "available") === "available")
    );
    const mapState = useMapModel(mapId);
    const { onExtentSelected } = useSelectionController(
        mapState.map,
        sources,
        currentSource,
        onSelectionComplete
    );
    useDragSelection(mapState.map, intl, onExtentSelected);

    const sourceOptions = useMemo(
        () =>
            sources.map<SourceOption>((source) => {
                return { label: source.label, value: source };
            }),
        [sources]
    );
    const currentSourceOption = useMemo(
        () => sourceOptions.find((option) => option.value === currentSource),
        [sourceOptions, currentSource]
    );
    const onSourceOptionChanged = useEvent((newValue: SingleValue<SourceOption>) => {
        setCurrentSource(newValue?.value);
    });

    const methodOptions: MethodOption[] = [
        { label: intl.formatMessage({ id: "rectangle" }), value: "rectangle" }
    ];

    return (
        <VStack {...containerProps} spacing={2}>
            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectMethod" })}</FormLabel>
                <Select
                    className="selection-method react-select"
                    {...COMMON_SELECT_PROPS}
                    options={methodOptions}
                    value={methodOptions.filter((option) => option.value === "rectangle")}
                />
            </FormControl>
            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectSource" })}</FormLabel>
                <Select<SourceOption>
                    className="selection-source react-select"
                    {...COMMON_SELECT_PROPS}
                    options={sourceOptions}
                    value={currentSourceOption}
                    onChange={onSourceOptionChanged}
                    components={{
                        Option: SourceSelectOption,
                        SingleValue: SourceSelectValue
                    }}
                />
            </FormControl>
        </VStack>
    );
};

function SourceSelectOption(props: OptionProps<SourceOption>): JSX.Element {
    const { value } = props.data;
    const { isAvailable, content } = useSourceItem(value);

    return (
        <chakraComponents.Option
            {...props}
            isDisabled={!isAvailable}
            className="selection-source-option"
        >
            {content}
        </chakraComponents.Option>
    );
}

function SourceSelectValue(props: SingleValueProps<SourceOption>): JSX.Element {
    const { value } = props.data;
    const { isAvailable, content } = useSourceItem(value);
    return (
        <chakraComponents.SingleValue
            {...props}
            isDisabled={!isAvailable}
            className="selection-source-value"
        >
            {content}
        </chakraComponents.SingleValue>
    );
}

function useSourceItem(source: SelectionSource | undefined) {
    const intl = useIntl();
    // TODO: Label not working?
    const notAvailableLabel: string | undefined = intl.formatMessage({ id: "sourceNotAvailable" });
    const label: string | undefined = source?.label;
    const isAvailable = useSourceStatus(source) === "available";

    return {
        isAvailable,
        content: (
            <Flex direction="row" alignItems="baseline">
                {label}
                {!isAvailable && (
                    <Tooltip label={notAvailableLabel} placement="right" openDelay={500}>
                        <chakra.span ml={2}>
                            <Icon as={FiAlertTriangle} color="red" aria-label={notAvailableLabel} />
                        </chakra.span>
                    </Tooltip>
                )}
            </Flex>
        )
    };
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

function useSourceStatus(source: SelectionSource | undefined): SelectionSourceStatus {
    const [status, setStatus] = useState<SelectionSourceStatus>("available");
    useEffect(() => {
        if (!source) {
            setStatus("available");
            return;
        }

        setStatus(source.status ?? "available");
        const resource = source.on?.("changed:status", () => {
            setStatus(source.status ?? "available");
        });
        return () => resource?.destroy();
    }, [source]);
    return status;
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
