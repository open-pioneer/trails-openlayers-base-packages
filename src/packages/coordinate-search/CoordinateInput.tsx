// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { CloseIcon, CopyIcon } from "@chakra-ui/icons";
import {
    Box,
    Flex,
    IconButton,
    Input,
    InputGroup,
    InputRightAddon,
    InputRightElement,
    Portal,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { MapModelProps, useMapModel, useProjection } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { PackageIntl } from "@open-pioneer/runtime";
import {
    AriaLiveMessages,
    AriaOnChange,
    AriaOnFocus,
    GroupBase,
    Select
} from "chakra-react-select";
import { Coordinate } from "ol/coordinate";
import { get as getProjection, Projection, ProjectionLike, transform } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PRECISION = 3;
const DEFAULT_PROJECTIONS = [
    {
        label: "WGS 84",
        value: getProjection("EPSG:4326")!,
        precision: 3
    },
    {
        label: "Web Mercator",
        value: getProjection("EPSG:3857")!,
        precision: 2
    }
];

/**
 * dropdown items of projection selection with an optional coordinate precision
 */
export interface ProjectionInput {
    /**
     * Label to show the user.
     */
    label: string;

    /**
     * The map projection as projection or as string.
     */
    value: ProjectionLike;

    /**
     * The number of displayed decimal places.
     */
    precision?: number;
}

/**
 * dropdown items of projection selection with an optional coordinate precision
 */
export interface ProjectionOption {
    /**
     * Label to show the user.
     */
    label: string;

    /**
     * The map projection.
     */
    value: Projection;

    /**
     * The number of displayed decimal places.
     */
    precision?: number;
}

/**
 * dropdown items of projection selection, must have a specified precision
 */
type ProjectionItem = Required<ProjectionOption>;

type ValidationResult =
    | "success"
    | "tooltip.space"
    | "tooltip.spaceOne"
    | "tooltip.2coords"
    | "tooltip.dividerDe"
    | "tooltip.dividerEn"
    | "tooltip.extent"
    | "tooltip.projection";

/**
 * Event type emitted when the user enters new coordinates or projection is changed by the user.
 */
export interface CoordinatesEvent {
    /** coordinates in the projection of the object */
    coords: Coordinate;

    /** the projection of the coordinates. */
    projection: Projection;
}

/**
 * Props for the {@link CoordinateInput} component.
 */
export interface CoordinateInputProps extends CommonComponentProps, MapModelProps {
    /**
     * Searchable projections, only projections that are known by the map as projection are shown.
     * Each projection can have an individual precision of coordinates. If no precision is given, the default precision is used.
     */
    projections?: ProjectionInput[];

    /**
     * Function that gets called if some coordinates are entered or projection is changed by the user.
     */
    onSelect?: (selectProps: CoordinatesEvent) => void;

    /**
     * Function that gets called if the input is cleared.
     */
    onClear?: () => void;

    /**
     * Insert input text and overwrite user input
     */
    input?: Coordinate;

    /**
     * Placeholder text to display when no input was entered by the user. Common usages:
     * * hint for the user ("enter coordinate here")
     * * example coordinate ("12.345 67.890")
     * * current mouse position
     *
     * If a Coordinate is given, it has to be in the current projection of the map
     */
    placeholder?: string | Coordinate;
}

/**
 * The `CoordinateSearch`component can be used in an app to search for entered coordinates in a selected projection
 */
export const CoordinateInput: FC<CoordinateInputProps> = (props) => {
    const { onSelect, onClear, projections = DEFAULT_PROJECTIONS, input, placeholder = "" } = props;
    const { containerProps } = useCommonComponentProps("coordinate-input", props);
    const { map } = useMapModel(props);
    const intl = useIntl();
    const olMap = map?.olMap;
    const mapProjection = useProjection(olMap) ?? undefined; // projection of the map

    // Projection items (dropdown)
    const availableProjections = useProjectionItems(projections); // filter for projections that are known
    const [selectedProjection, setSelectedProjection] = useState<ProjectionItem>(
        // set projection select initial on first one in list
        availableProjections[0]!
    );

    // Input state
    const [coordinateSearchInput, setCoordinateSearchInput] = useInput(
        input,
        mapProjection,
        selectedProjection,
        onSelect
    );
    const placeholderString = usePlaceholder(placeholder, mapProjection, selectedProjection);
    const validationResult = validateInput(intl, coordinateSearchInput, selectedProjection.value);
    const isInputValid = validationResult === "success";

    const portalElement = useRef<HTMLDivElement>(null);

    return (
        <Box {...containerProps}>
            <Portal>
                <div ref={portalElement} />
            </Portal>
            <Flex flexDirection={"row"} flexDir={"row"}>
                <Tooltip
                    label={!isInputValid ? intl.formatMessage({ id: validationResult }) : undefined}
                    hasArrow
                    placement="auto"
                    isOpen={!isInputValid}
                    className="coordinateInputToolTip"
                >
                    <InputGroup className="coordinateInputGroup">
                        <CoordinateInputField
                            coordinateSearchInput={coordinateSearchInput}
                            setCoordinateSearchInput={setCoordinateSearchInput}
                            placeholder={placeholder}
                            placeholderString={placeholderString}
                            onClear={onClear}
                            isInputValid={isInputValid}
                            selectedProjection={selectedProjection}
                            mapProjection={mapProjection}
                            onSelect={onSelect}
                        />
                        <InputRightAddon padding={"0px"} borderLeft={"0px"}>
                            <ProjectionSelect
                                selectedProjection={selectedProjection}
                                availableProjections={availableProjections}
                                portalElement={portalElement}
                                setSelectedProjection={setSelectedProjection}
                                coordinateSearchInput={coordinateSearchInput}
                                mapProjection={mapProjection}
                                onSelect={onSelect}
                            />
                        </InputRightAddon>
                    </InputGroup>
                </Tooltip>
            </Flex>
        </Box>
    );
};
function CoordinateInputField(props: {
    isInputValid: boolean;
    selectedProjection: ProjectionItem;
    mapProjection: Projection | undefined;
    onSelect: ((selectProps: CoordinatesEvent) => void) | undefined;
    coordinateSearchInput: string;
    setCoordinateSearchInput: (searchinput: string) => void;
    placeholder: string | Coordinate;
    placeholderString: string;
    onClear: (() => void) | undefined;
}) {
    const {
        isInputValid,
        selectedProjection,
        mapProjection,
        onSelect,
        coordinateSearchInput,
        setCoordinateSearchInput,
        placeholder,
        placeholderString,
        onClear
    } = props;
    const intl = useIntl();
    return (
        <InputGroup className="coordinateInputFieldGroup">
            <Input
                type="text"
                value={coordinateSearchInput}
                onChange={(eve) => {
                    setCoordinateSearchInput(eve.target.value);
                }}
                isInvalid={!isInputValid}
                backgroundColor={!isInputValid ? "red.100" : "undefined"}
                placeholder={placeholderString}
                errorBorderColor="red.500"
                aria-label={intl.formatMessage({
                    id: "coordinateInput.ariaLabel"
                })}
                borderRightRadius={0}
                onKeyDown={(eve) => {
                    if (eve.key == "Enter") {
                        onCoordinateInput(
                            intl,
                            coordinateSearchInput,
                            selectedProjection.value,
                            mapProjection,
                            onSelect
                        );
                    }
                }}
            />
            <CoordinateInputButton
                coordinateSearchInput={coordinateSearchInput}
                setCoordinateSearchInput={setCoordinateSearchInput}
                placeholder={placeholder}
                placeholderString={placeholderString}
                onClear={onClear}
                intl={intl}
            />
        </InputGroup>
    );
}

function CoordinateInputButton(props: {
    coordinateSearchInput: string;
    setCoordinateSearchInput: (searchinput: string) => void;
    placeholder: string | Coordinate;
    placeholderString: string;
    onClear: (() => void) | undefined;
    intl: PackageIntl;
}) {
    const {
        coordinateSearchInput,
        setCoordinateSearchInput,
        placeholder,
        placeholderString,
        onClear,
        intl
    } = props;
    if (coordinateSearchInput !== "") {
        return (
            <InputRightElement>
                <IconButton
                    className="clearButton"
                    size="sm"
                    onClick={() => {
                        setCoordinateSearchInput("");
                        if (onClear) {
                            onClear();
                        }
                    }}
                    isDisabled={coordinateSearchInput == ""}
                    padding={0}
                    icon={<CloseIcon />}
                    aria-label={intl.formatMessage({
                        id: "coordinateInput.ariaLabel"
                    })}
                />
            </InputRightElement>
        );
    } else if (typeof placeholder === "object" && coordinateSearchInput == "") {
        return (
            <InputRightElement>
                <IconButton
                    className="copyButton"
                    size="sm"
                    onClick={() => {
                        navigator.clipboard.writeText(placeholderString);
                    }}
                    padding={0}
                    icon={<CopyIcon />}
                    aria-label={intl.formatMessage({
                        id: "coordinateInput.copyPlaceholder"
                    })}
                />
            </InputRightElement>
        );
    } else return <></>;
}

function ProjectionSelect(projSelectProps: {
    selectedProjection: ProjectionItem;
    availableProjections: ProjectionItem[];
    portalElement: React.RefObject<HTMLDivElement>;
    setSelectedProjection: (proj: ProjectionItem) => void;
    coordinateSearchInput: string;
    mapProjection: Projection | undefined;
    onSelect: ((selectProps: CoordinatesEvent) => void) | undefined;
}) {
    const [isOpenSelect, setIsOpenSelect] = useState(false); // if the select menu is open

    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        //if the menu is already open, do noting
        if (!isOpenSelect && event.key === "Enter") {
            setIsOpenSelect(true);
        }
    });
    const {
        selectedProjection,
        availableProjections,
        portalElement,
        setSelectedProjection,
        coordinateSearchInput,
        mapProjection,
        onSelect
    } = projSelectProps;
    const intl = useIntl();
    const ariaMessages = useAriaMessages(intl);
    return (
        <Select
            value={selectedProjection}
            defaultValue={selectedProjection}
            options={availableProjections}
            menuPlacement="auto"
            menuPortalTarget={portalElement.current}
            aria-label={intl.formatMessage({
                id: "coordinateInput.ariaLabel"
            })}
            classNamePrefix={"coordinate-Input-Select"}
            isSearchable={false}
            chakraStyles={{
                menu: (base) => {
                    return {
                        ...base,
                        width: "max-content",
                        minWidth: "100%"
                    };
                },
                control: (base, { selectProps: { menuIsOpen } }) => ({
                    ...base,
                    width: "max-content",
                    minWidth: "100%",
                    color: "white",
                    borderleftstyle: "none",
                    borderLeftRadius: 0,
                    padding: 0,
                    backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`,
                    _focus: {
                        boxShadow: "var(--chakra-shadows-outline)"
                    }
                }),
                valueContainer: (base) => ({
                    ...base,
                    paddingEnd: 0,
                    cursor: "pointer"
                }),
                dropdownIndicator: (base, { selectProps: { menuIsOpen } }) => ({
                    ...base,
                    paddingStart: 0,
                    backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                }),
                option: (base) => ({
                    ...base,
                    _focus: {
                        background: "var(--chakra-colors-trails-300)"
                    }
                }),
                indicatorSeparator: (base, { selectProps: { menuIsOpen } }) => ({
                    ...base,
                    backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`,
                    borderColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                })
            }}
            ariaLiveMessages={ariaMessages}
            onChange={(e) => {
                if (e?.value !== undefined) {
                    setSelectedProjection(e);
                    onCoordinateInput(
                        intl,
                        coordinateSearchInput,
                        e?.value,
                        mapProjection,
                        onSelect
                    );
                }
            }}
            onKeyDown={keyDown}
            menuIsOpen={isOpenSelect}
            onMenuOpen={() => setIsOpenSelect(true)}
            onMenuClose={() => setIsOpenSelect(false)}
        />
    );
}

/**
 * Provides custom aria messages for select of the coordinate input component.
 */
function useAriaMessages(
    intl: PackageIntl
): AriaLiveMessages<Required<ProjectionOption>, false, GroupBase<Required<ProjectionOption>>> {
    return useMemo(() => {
        /**
         * Method to create Aria-String for focus-Event
         */
        const onFocus: AriaOnFocus<ProjectionOption> = () => {
            //no aria string for focus-events because in some screen readers (NVDA) and browsers (Chrome) updating the aria string causes the instructions to be read out again each time a select option is focused
            return "";
        };

        /**
         * Method to create Aria-String for value-change-Event
         */
        const onChange: AriaOnChange<ProjectionOption, boolean> = (props) => {
            if (props.action == "select-option" || props.action == "initial-input-focus")
                return props.label + " " + intl.formatMessage({ id: "selected" });
            else return "";
        };

        /**
         * Method to create Aria-String for instruction
         */
        const guidance = () => {
            return "";
        };

        /**
         * Method to create Aria-String for result length
         */
        const onFilter = () => {
            return "";
        };

        return {
            onFocus,
            onChange,
            guidance,
            onFilter
        };
    }, [intl]);
}

/**
 * Returns the current text input and a callback to change it (used for interactive user input).
 * The current text may also change if the input prop changes (controlled usage).
 */
function useInput(
    inputProp: Coordinate | undefined,
    mapProjection: Projection | undefined,
    selectedProjection: ProjectionItem,
    onSelect: ((selectProps: CoordinatesEvent) => void) | undefined
): [string, (value: string) => void] {
    const intl = useIntl();
    const [coordinateSearchInput, setCoordinateSearchInput] = useState<string>(""); // coordinate input field
    const inputFromOutside = useMemo(() => {
        if (!inputProp || !mapProjection) {
            return "";
        }
        const transformed = transformCoordinates(
            inputProp,
            mapProjection,
            selectedProjection.value
        );
        return formatCoordinates(transformed, selectedProjection.precision, intl);
    }, [inputProp, mapProjection, selectedProjection, intl]);

    const callback = useEvent((selectedProps: CoordinatesEvent) => {
        onSelect?.(selectedProps);
    });
    useEffect(() => {
        if (inputProp != undefined) {
            setCoordinateSearchInput(inputFromOutside);
            onCoordinateInput(
                intl,
                inputFromOutside,
                selectedProjection.value,
                mapProjection,
                callback
            );
        }
    }, [inputProp, inputFromOutside, callback, intl, mapProjection, selectedProjection]);
    return [coordinateSearchInput, setCoordinateSearchInput];
}

/**
 * Parses the projections defined by the user.
 */
function useProjectionItems(projections: ProjectionInput[]) {
    return useMemo(() => {
        const availableProjections: ProjectionItem[] = projections.flatMap((ele) => {
            if (getProjection(ele.value) != null)
                return {
                    label: ele.label,
                    value: getProjection(ele.value)!,
                    precision: ele.precision ?? DEFAULT_PRECISION
                };
            return [];
        });
        return availableProjections;
    }, [projections]);
}

/**
 * Returns the current placeholder string.
 */
export function usePlaceholder(
    placeholderProp: string | Coordinate,
    mapProjection: Projection | undefined,
    selectedProjection: ProjectionItem
) {
    const intl = useIntl();
    return useMemo(() => {
        let placeholder: string;
        if (typeof placeholderProp === "string") {
            placeholder = placeholderProp;
        } else if (!mapProjection) {
            placeholder = "";
        } else {
            const coords = transformCoordinates(
                placeholderProp as Coordinate,
                mapProjection,
                selectedProjection.value
            );
            placeholder = formatCoordinates(coords, selectedProjection.precision, intl);
        }
        return placeholder;
    }, [placeholderProp, mapProjection, selectedProjection, intl]);
}

function validateInput(
    intl: PackageIntl,
    inputString: string,
    projection: Projection
): ValidationResult {
    if (inputString == "") return "success";

    if (!inputString.includes(" ")) {
        return "tooltip.space";
    }
    if (inputString.indexOf(" ") != inputString.lastIndexOf(" ")) {
        return "tooltip.spaceOne";
    }

    const coordsString = inputString.split(" ");
    if (coordsString.length != 2 || coordsString[0] == "" || coordsString[1] == "") {
        return "tooltip.2coords";
    }

    // TODO: NumberParser in core
    let thousandSeparator = "";
    if (/^de-?/.test(intl.locale)) {
        thousandSeparator = ".";

        const inputStringWithoutThousandSeparator = inputString.replaceAll(thousandSeparator, "");

        if (!/^-?\d+(,\d+)? -?\d+(,\d+)?$/.test(inputStringWithoutThousandSeparator)) {
            return "tooltip.dividerDe";
        }
    } else if (/en-?/.test(intl.locale)) {
        thousandSeparator = ",";

        const inputStringWithoutThousandSeparator = inputString.replaceAll(thousandSeparator, "");

        if (!/^-?\d+(.\d+)? -?\d+(.\d+)?$/.test(inputStringWithoutThousandSeparator)) {
            return "tooltip.dividerEn";
        }
    }

    const coords = parseCoords(inputString, thousandSeparator);

    try {
        if (!checkIfCoordsInProjectionsExtent(projection, coords)) return "tooltip.extent";
    } catch (e) {
        console.log();
    }
    try {
        if (
            !checkIfCoordsInProjectionsExtent(
                getProjection("EPSG:4326")!,
                transformCoordinates(coords, projection, "EPSG:4326")
            )
        )
            return "tooltip.extent";
    } catch (e) {
        console.log(e);
        return "tooltip.projection";
    }
    return "success";
}

function checkIfCoordsInProjectionsExtent(projection: Projection, coords: number[]): boolean {
    return (
        projection!.getExtent().length == 4 &&
        projection!.getExtent()[0]! <= coords[0]! &&
        projection!.getExtent()[1]! <= coords[1]! &&
        projection!.getExtent()[2]! >= coords[0]! &&
        projection!.getExtent()[3]! >= coords[1]!
    );
}

function parseCoords(inputString: string, thousandSeparator: string) {
    const inputStringWithoutThousandSeparator = inputString.replaceAll(thousandSeparator, "");
    const coordsString = inputStringWithoutThousandSeparator.replaceAll(",", ".");

    const splitCoords = coordsString.split(" ");
    return [parseFloat(splitCoords[0]!), parseFloat(splitCoords[1]!)];
}

function onCoordinateInput(
    intl: PackageIntl,
    coordinateString: string,
    projection: Projection,
    mapProjection: Projection | undefined,
    onSelect: ((selectProps: CoordinatesEvent) => void) | undefined
) {
    if (
        projection == undefined ||
        coordinateString == "" ||
        validateInput(intl, coordinateString, projection) !== "success"
    )
        return;

    // TODO: Number parse from core and unify with the validation code above
    let inputStringWithoutHundredDivider = coordinateString;
    if (/^de-?/.test(intl.locale)) {
        inputStringWithoutHundredDivider = coordinateString.replaceAll(".", "");
    } else if (/^en-?/.test(intl.locale)) {
        inputStringWithoutHundredDivider = coordinateString.replaceAll(",", "");
    }
    const coordsForZoom = getCoordsForZoom(
        inputStringWithoutHundredDivider,
        projection,
        mapProjection
    );
    if (onSelect && mapProjection) {
        onSelect({ coords: coordsForZoom, projection: mapProjection });
    }
}

/* returns the given coordinates in the projection of the map */
function getCoordsForZoom(
    coordinateString: string,
    projection: Projection | undefined,
    mapProjection: Projection | undefined
): Coordinate {
    const coordsString = coordinateString.split(" ");
    const coords = [
        parseFloat(coordsString[0]!.replace(",", ".")),
        parseFloat(coordsString[1]!.replace(",", "."))
    ];
    return transformCoordinates(coords, projection, mapProjection);
}

/* transforms the given coordinates in the given destination projection */
function transformCoordinates(
    coordinates: number[],
    source: ProjectionLike,
    destination: ProjectionLike
): number[] {
    return transform(coordinates, source, destination);
}

/* formats the coordinates into a string with x withspace y */
function formatCoordinates(coordinates: number[], precision: number, intl: PackageIntl): string {
    if (coordinates[0] == null || coordinates[1] == null) {
        return "";
    }

    const [x, y] = coordinates;

    const xString = intl.formatNumber(x, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision
    });
    const yString = intl.formatNumber(y, {
        maximumFractionDigits: precision,
        minimumFractionDigits: precision
    });

    return xString + " " + yString;
}
