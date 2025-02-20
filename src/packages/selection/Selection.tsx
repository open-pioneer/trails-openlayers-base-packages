// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    Icon,
    Tooltip,
    VStack,
    chakra,
    useToken
} from "@open-pioneer/chakra-integration";
import { MapModel, MapModelProps, useMapModel } from "@open-pioneer/map";
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
import { FC, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { SelectionController } from "./SelectionController";
import { SelectionResult, SelectionSource, SelectionSourceStatusObject } from "./api";
import { ClickController } from "./selection-controller/ClickController";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { PiSelectionPlusBold } from "react-icons/pi";
import { TbPointerQuestion } from "react-icons/tb";
import { DragController } from "./selection-controller/DragController";
import { Map } from "ol";

/**
 * The method how the user interacts with the map to select features.
 */
export type SelectionMethod = "extent" | "point";

export interface ISelectionTypeHandler<T> {
    new (map: Map, tooltip: string, disabledMessage: string, onExtentSelected: (geometry: Geometry) => void): T;
};

/**
 * Properties supported by the {@link Selection} component.
 */
export interface SelectionProps extends CommonComponentProps, MapModelProps {
    /**
     * Array of selection sources available for spatial selection.
     */
    sources: SelectionSource[];

    /**
     * Array of selection methods available for spatial selection.
     */
    availableSelectionMethods?: SelectionMethod | SelectionMethod[];

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
    value: SelectionSource;
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
    const { sources, availableSelectionMethods, onSelectionComplete, onSelectionSourceChanged } = props;
    const { containerProps } = useCommonComponentProps("selection", props);
    const defaultNotAvailableMessage = intl.formatMessage({ id: "sourceNotAvailable" });

    const [currentSource, setCurrentSource] = useCurrentSelectionSource(
        sources,
        onSelectionSourceChanged
    );
    const currentSourceStatus = useSourceStatus(currentSource, defaultNotAvailableMessage);

    const defaultSelectionMethod = "extent";
    const [activeSelectionMethod, setActiveSelectionMethod] = useState<SelectionMethod>(defaultSelectionMethod);
    useEffect(() => {
        let method = availableSelectionMethods ?? defaultSelectionMethod;
        method = Array.isArray(method) && method.length > 0 ? method[0]! : method as SelectionMethod;
        setActiveSelectionMethod(method);
    }, [availableSelectionMethods]);
    const showSelectionButtons = useMemo(() => {
        return Boolean(availableSelectionMethods && Array.isArray(availableSelectionMethods) && availableSelectionMethods.length > 1);
    }, [availableSelectionMethods]);


    const mapState = useMapModel(props);
    const { onExtentSelected } = useSelectionController(
        mapState.map,
        sources,
        currentSource,
        onSelectionComplete
    );
    const chakraStyles = useChakraStyles();
    const [isOpenSelect, setIsOpenSelect] = useState(false);

    useInteractiveSelection(
        activeSelectionMethod,
        mapState.map,
        intl,
        onExtentSelected,
        currentSourceStatus.kind === "available",
        !!currentSource
    );

    const sourceOptions = useMemo(
        () =>
            sources.map<SelectionOption>((source) => {
                return { label: source.label, value: source };
            }),
        [sources]
    );
    const currentSourceOption = useMemo(() => {
        const foundOption: SelectionOption | undefined = sourceOptions.find(
            (option) => option.value === currentSource
        );
        return foundOption || null;
    }, [sourceOptions, currentSource]);

    const onSourceOptionChanged = useEvent((newValue: SingleValue<SelectionOption>) => {
        setCurrentSource(newValue?.value);
    });

    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        //if the menu is already open, do noting
        if (!isOpenSelect && event.key === "Enter") {
            setIsOpenSelect(true);
        }
    });

    return (
        <VStack {...containerProps} spacing={2}>
            {showSelectionButtons && <FormControl>
                <FormLabel>{intl.formatMessage({ id: "selectionMethod" })}</FormLabel>
                <HStack gap={2}>
                    <ToolButton 
                        icon={<PiSelectionPlusBold />} 
                        label={intl.formatMessage({id: "EXTENT"})} 
                        onClick={() => setActiveSelectionMethod("extent")} 
                        isActive={activeSelectionMethod === "extent"}/>
                    <ToolButton 
                        icon={<TbPointerQuestion />} 
                        label={intl.formatMessage({id: "POINT"})} 
                        onClick={() => setActiveSelectionMethod("point")} 
                        isActive={activeSelectionMethod === "point"}/>
                </HStack>
            </FormControl>}
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
                    isOptionDisabled={() => false} // allow to select disabled options; optical disabling is done in option
                    // optionLabel is used by screenreaders
                    getOptionLabel={(option) => {
                        const label = option.label;
                        const status = getSourceStatus(option.value, defaultNotAvailableMessage);
                        if (status.kind == "available") return label;
                        return label + " " + status.reason;
                    }}
                    ariaLiveMessages={{
                        guidance: () => "",
                        onChange: (props) => {
                            if (
                                props.action == "select-option" ||
                                props.action == "initial-input-focus"
                            )
                                return props.label + " " + intl.formatMessage({ id: "selected" });
                            else return "";
                        },
                        onFilter: () => "",
                        onFocus: () => ""
                    }}
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

function useCurrentSelectionSource(
    sources: SelectionSource[],
    onSourceChanged: ((event: SelectionSourceChangedEvent) => void) | undefined
): [SelectionSource | undefined, (source: SelectionSource | undefined) => void] {
    const [currentSource, setCurrentSource] = useState<SelectionSource | undefined>(
        () => sources[0]
    );

    // Reset to undefined if the current source is not in the list of sources
    useEffect(() => {
        if (currentSource && !sources.includes(currentSource)) {
            setCurrentSource(undefined);
        }
    }, [sources, currentSource]);

    // Track the current source and notify the parent component if it changes
    const prevSelectedSource = useRef<SelectionSource | undefined>(undefined);
    useEffect(() => {
        if (currentSource !== prevSelectedSource.current) {
            prevSelectedSource.current = currentSource;
            onSourceChanged?.({ source: currentSource });
        }
    }, [currentSource, onSourceChanged]);
    return [currentSource, setCurrentSource];
}

/**
 * Hook to manage source option in selection-source react-select
 */
function useSourceItem(source: SelectionSource | undefined, isSelected: boolean) {
    const intl = useIntl();
    const label: string | undefined = source?.label;
    const defaultNotAvailableMessage = intl.formatMessage({ id: "sourceNotAvailable" });
    const status = useSourceStatus(source, defaultNotAvailableMessage);

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
function useSourceStatus(
    source: SelectionSource | undefined,
    defaultNotAvailableMessage: string
): SimpleStatus {
    const sourceStatus = useReactiveSnapshot((): SimpleStatus => {
        if (!source) {
            return { kind: "unavailable", reason: defaultNotAvailableMessage };
        }
        return getSourceStatus(source, defaultNotAvailableMessage);
    }, [source, defaultNotAvailableMessage]);
    return sourceStatus;
}

/**
 * Hook to manage map controls and tooltip
 */
function useInteractiveSelection(
    selectionMethod: SelectionMethod,
    map: MapModel | undefined,
    intl: PackageIntl,
    onExtentSelected: (geometry: Geometry) => void,
    isActive: boolean,
    hasSelectedSource: boolean
) {

    function selectionMethodFactory(
        selectionMethod: SelectionMethod,
    ): ISelectionTypeHandler<DragController | ClickController> {
        switch (selectionMethod) {
            case "extent":
                return DragController;
            case "point":
                return ClickController;
            default:
                throw new Error(`Unknown selection kind: ${selectionMethod}`);
        }
    }

    useEffect(() => {
        if (!map) {
            return;
        }

        const disabledMessage = hasSelectedSource
            ? intl.formatMessage({ id: "disabledTooltip" })
            : intl.formatMessage({ id: "noSourceTooltip" });

        const controlerCls = selectionMethodFactory(selectionMethod);
        const dragController = new controlerCls(
            map.olMap,
            intl.formatMessage({ id: `tooltip.${selectionMethod}` }),
            disabledMessage,
            onExtentSelected
        );

        dragController.setActive(isActive);
        return () => {
            dragController?.destroy();
        };
    }, [map, intl, onExtentSelected, isActive, hasSelectedSource, selectionMethod]);
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
