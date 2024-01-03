// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    FormControl,
    FormLabel,
    Icon,
    Tooltip,
    VStack,
    chakra
} from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
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
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { DragController } from "./DragController";
import { SelectionController } from "./SelectionController";
import { SelectionResult, SelectionSource, SelectionSourceStatusObject } from "./api";

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
     * Array of allowed spatial select methods. Default is rectangle
     */
    //methods?: SelectionKind[];

    /**
     * This handler is called whenever the user has successfully (successfully) selected
     * some items.
     */
    onSelectionComplete?(event: SelectionCompleteEvent): void;

    /**
     * This handler is called whenever the user has changed the selected source
     */
    onSelectionSourceChanged?(event: SelectionSourceChangedEvent): void;
}

export interface SelectionCompleteEvent {
    /** The source that returned the {@link results}. */
    source: SelectionSource;

    /** Results selected by the user. */
    results: SelectionResult[];
}

export interface SelectionSourceChangedEvent {
    /** The new selected source */
    source: SelectionSource | undefined;
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

/**
 * Supported selection Methods
 */
export enum SelectionMethods {
    extent = "EXTEND",
    polygon = "POLYGON",
    free = "FREEPOLYGON",
    circle = "CIRCLE"
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
    const { mapId, sources, onSelectionComplete, onSelectionSourceChanged } = props;
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

    /**
     * Method to build Option-Array from the supported selection methods for the selection-method react-select
     * If there is no configuration => Default selection method: EXTEND
     * @param methods
     * @returns
     */
    const buildMethodOptions = useCallback(
        (methods: string[] | undefined) => {
            const objects: MethodOption[] = [];
            if (!methods) methods = [SelectionMethods.extent];
            methods.forEach((item) => {
                if (Object.values(SelectionMethods as unknown as string[]).includes(item))
                    objects.push({ label: intl.formatMessage({ id: item }), value: item });
            });
            if (objects.length === 0) throw new Error("methods does not contain valid values");
            return objects;
        },
        [intl]
    );

    const methodOptions: MethodOption[] = buildMethodOptions(undefined);
    const [selectedMethod, setSelectedMethode] = useState(methodOptions[0] as MethodOption);

    /**
     * Method to change used selectmethod
     */
    const onMethodeOptionChance = useEvent((newValue: MethodOption) => {
        setSelectedMethode(newValue);
    });

    const [dragControllerActive, setDragControllerActive] = useState<boolean>(true);
    useDragSelection(mapState.map, selectedMethod, intl, onExtentSelected, dragControllerActive);

    /**
     * Method to build Option-Array from sources for the selection-source react-select
     */
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

    /**
     * Method to change used source
     */
    const onSourceOptionChanged = useEvent((newValue: SingleValue<SourceOption>) => {
        setCurrentSource(newValue?.value);
        onSelectionSourceChanged && onSelectionSourceChanged({ source: newValue?.value });
    });

    useEffect(() => {
        if (!currentSource) {
            setDragControllerActive(false);
            return;
        }
        setDragControllerActive(currentSource && currentSource.status === "available");
        /*// TODO: Why can this be undefined after test above?!
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore*/
        const handle = currentSource.on("changed:status", () => {
            setDragControllerActive(currentSource && currentSource.status === "available");
        });
        return () => handle.destroy();
    }, [currentSource, setDragControllerActive]);

    return (
        <VStack {...containerProps} spacing={2}>
            {methodOptions.length > 1 && (
                <FormControl>
                    <FormLabel>{intl.formatMessage({ id: "selectMethod" })}</FormLabel>
                    <Select
                        className="selection-method react-select"
                        {...COMMON_SELECT_PROPS}
                        options={methodOptions}
                        onChange={onMethodeOptionChance}
                        value={selectedMethod}
                    />
                </FormControl>
            )}
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
                    isOptionDisabled={(option) =>
                        option.value === undefined || option.value.status === "unavailable"
                    }
                    // optionLabel is used by screenreaders
                    getOptionLabel={(option) =>
                        option.label +
                        (option.value === undefined || option.value.status === "unavailable"
                            ? " " + intl.formatMessage({ id: "sourceNotAvailable" })
                            : "")
                    }
                />
            </FormControl>
        </VStack>
    );
};

function SourceSelectOption(props: OptionProps<SourceOption>): JSX.Element {
    const { value } = props.data;
    const { isAvailable, content } = useSourceItem(value, false);

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
    const { isAvailable, content } = useSourceItem(value, true);
    const clazz = isAvailable
        ? "selection-source-value"
        : "selection-source-value selection-source-value--disabled";

    return (
        <chakraComponents.SingleValue {...props} isDisabled={!isAvailable} className={clazz}>
            {content}
        </chakraComponents.SingleValue>
    );
}

/**
 * Hook to manage source option in selection-source react-select
 * @param source
 * @returns
 */
function useSourceItem(source: SelectionSource | undefined, isSelected: boolean) {
    const label: string | undefined = source?.label;
    const status = useSourceStatus(source);

    return {
        isAvailable: status.kind === "available",
        content: (
            <Flex direction="row" alignItems="center" grow={1}>
                {!isSelected && <Flex grow={1}>{label}</Flex>}
                {status.kind === "unavailable" && (
                    <Box ml={2}>
                        <Tooltip label={status.reason} placement="right" openDelay={500}>
                            <chakra.span>
                                <Icon
                                    as={FiAlertTriangle}
                                    color="red"
                                    className="warning-icon"
                                    aria-label={status.reason}
                                />
                            </chakra.span>
                        </Tooltip>
                    </Box>
                )}
                {isSelected && label}
            </Flex>
        )
    };
}

/**
 * Hook to manage selection sources
 * @param mapModel
 * @param sources
 * @param currentSource
 * @param onSelectionComplete
 * @returns
 */
function useSelectionController(
    mapModel: MapModel | undefined,
    sources: SelectionSource[],
    currentSource: SelectionSource | undefined,
    onSelectionComplete: ((event: SelectionCompleteEvent) => void) | undefined
) {
    const notifier = useService<NotificationService>("notifier.NotificationService");
    const intl = useIntl();
    const [controller, setController] = useState<SelectionController | undefined>(undefined);
    useEffect(() => {
        if (!mapModel) {
            return;
        }
        const controller = new SelectionController({
            mapModel,
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

type SimpleStatus =
    | {
          kind: "available";
      }
    | {
          kind: "unavailable";
          reason: string;
      };

/**
 * Hook to manage source status
 */
function useSourceStatus(source: SelectionSource | undefined): SimpleStatus {
    const intl = useIntl();
    const [status, setStatus] = useState<SimpleStatus>(() => ({ kind: "available" }));
    useEffect(() => {
        if (!source) {
            setStatus({ kind: "available" });
            return;
        }

        const getStatus = (): SimpleStatus => {
            const rawCurrent = source.status ?? "available";
            const current: SelectionSourceStatusObject =
                typeof rawCurrent === "string" ? { kind: rawCurrent } : rawCurrent;
            if (current.kind === "available") {
                return current;
            }

            return {
                kind: "unavailable",
                reason: current.reason ?? intl.formatMessage({ id: "sourceNotAvailable" })
            };
        };

        setStatus(getStatus());
        const resource = source.on?.("changed:status", () => {
            setStatus(getStatus());
        });
        return () => resource?.destroy();
    }, [source, intl]);
    return status;
}

/**
 * Hook to manage map controls and tooltip
 * @param map
 * @param selectMethode
 * @param intl
 * @param onExtentSelected
 */
function useDragSelection(
    map: MapModel | undefined,
    selectMethode: MethodOption,
    intl: PackageIntl,
    onExtentSelected: (geometry: Geometry) => void,
    isActive: boolean
) {
    useEffect(() => {
        if (!map) {
            return;
        }

        const dragController = new DragController(
            map.olMap,
            selectMethode.value,
            intl.formatMessage({ id: "tooltip" }),
            intl.formatMessage({ id: "disabledTooltip" }),
            onExtentSelected
        );
        dragController.setActive(isActive);

        return () => {
            dragController?.destroy();
        };
    }, [map, selectMethode, intl, onExtentSelected, isActive]);
}
