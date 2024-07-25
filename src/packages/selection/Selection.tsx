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
    chakra,
    useToken
} from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/map";
import { NotificationService } from "@open-pioneer/notifier";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import {
    ChakraStylesConfig,
    GroupBase,
    OptionProps,
    Select,
    Props as SelectProps,
    SingleValueProps,
    chakraComponents,
    type SingleValue
} from "chakra-react-select";
import { Geometry } from "ol/geom";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, KeyboardEvent, useEffect, useMemo, useState } from "react";
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
     * This handler is called whenever the user has successfully selected
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
interface SelectionOption {
    /**
     * The label of the selection source option.
     */
    label: string;

    /**
     * The value (SelectionSource) of the selection source option.
     */
    value: SelectionSource | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COMMON_SELECT_PROPS: SelectProps<any, any, any> = {
    classNamePrefix: "react-select",
    menuPosition: "fixed",
    isSearchable: false,
    isClearable: false
};

/**
 * A component that allows the user to perform a spatial selection on a given set of {@link SelectionSource}.
 */
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
    const chakraStyles = useChakraStyles();
    const [isOpenSelect, setIsOpenSelect] = useState(false);

    const [dragControllerActive, setDragControllerActive] = useState<boolean>(true);
    useDragSelection(mapState.map, intl, onExtentSelected, dragControllerActive);

    const sourceOptions = useMemo(
        () =>
            sources.map<SelectionOption>((source) => {
                return { label: source.label, value: source };
            }),
        [sources]
    );
    const currentSourceOption = useMemo(
        () => sourceOptions.find((option) => option.value === currentSource),
        [sourceOptions, currentSource]
    );

    const onSourceOptionChanged = useEvent((newValue: SingleValue<SelectionOption>) => {
        setCurrentSource(newValue?.value);
        onSelectionSourceChanged && onSelectionSourceChanged({ source: newValue?.value });
    });

    useEffect(() => {
        if (!currentSource) {
            setDragControllerActive(false);
            return;
        }

        const sourceNotAvailableReason = intl.formatMessage({ id: "sourceNotAvailable" });
        const isCurrentSourceAvailable = () => {
            return (
                currentSource &&
                getSourceStatus(currentSource, sourceNotAvailableReason).kind === "available"
            );
        };

        setDragControllerActive(isCurrentSourceAvailable());
        // Why can this be undefined after test above?!
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const handle = currentSource.on("changed:status", () => {
            setDragControllerActive(isCurrentSourceAvailable());
        });
        return () => handle.destroy();
    }, [currentSource, setDragControllerActive, intl]);
    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        //if the menu is already open, do noting
        if (!isOpenSelect && event.key === "Enter") {
            setIsOpenSelect(true);
        }
    });

    return (
        <VStack {...containerProps} spacing={2}>
            <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectSource" })}</FormLabel>
                <Select<SelectionOption>
                    className="selection-source react-select"
                    {...COMMON_SELECT_PROPS}
                    options={sourceOptions}
                    placeholder={intl.formatMessage({ id: "selectionPlaceholder" })}
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
                    chakraStyles={chakraStyles}
                    onKeyDown={keyDown}
                    menuIsOpen={isOpenSelect}
                    onMenuOpen={() => setIsOpenSelect(true)}
                    onMenuClose={() => setIsOpenSelect(false)}
                />
            </FormControl>
        </VStack>
    );
};

function SourceSelectOption(props: OptionProps<SelectionOption>): JSX.Element {
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

function SourceSelectValue(props: SingleValueProps<SelectionOption>): JSX.Element {
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

function getSourceStatus(source: SelectionSource, sourceNotAvailableReason: string): SimpleStatus {
    const rawCurrent = source.status ?? "available";
    const current: SelectionSourceStatusObject =
        typeof rawCurrent === "string" ? { kind: rawCurrent } : rawCurrent;
    if (current.kind === "available") {
        return current;
    }

    return {
        kind: "unavailable",
        reason: current.reason ?? sourceNotAvailableReason
    };
}

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
        const sourceNotAvailableReason = intl.formatMessage({ id: "sourceNotAvailable" });
        setStatus(getSourceStatus(source, sourceNotAvailableReason));
        const resource = source.on?.("changed:status", () => {
            setStatus(getSourceStatus(source, sourceNotAvailableReason));
        });
        return () => resource?.destroy();
    }, [source, intl]);
    return status;
}

/**
 * Hook to manage map controls and tooltip
 */
function useDragSelection(
    map: MapModel | undefined,
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
            intl.formatMessage({ id: "tooltip" }),
            intl.formatMessage({ id: "disabledTooltip" }),
            onExtentSelected
        );
        dragController.setActive(isActive);

        return () => {
            dragController?.destroy();
        };
    }, [map, intl, onExtentSelected, isActive]);
}

/**
 * Customizes components styles within the select component.
 */
function useChakraStyles() {
    const [dropDownBackground, borderColor] = useToken(
        "colors",
        ["background_body", "border"],
        ["#ffffff", "#ffffff"]
    );
    return useMemo(() => {
        const chakraStyles: ChakraStylesConfig<
            SelectionOption,
            false,
            GroupBase<SelectionOption>
        > = {
            control: (styles) => ({ ...styles, cursor: "pointer" }),
            indicatorSeparator: (styles) => ({
                ...styles,
                borderColor: borderColor
            }),
            dropdownIndicator: (provided) => ({
                ...provided,
                backgroundColor: dropDownBackground
            })
        };
        return chakraStyles;
    }, [dropDownBackground, borderColor]);
}
