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
import { Select } from "chakra-react-select";
import { Coordinate } from "ol/coordinate";
import { get as getProjection, transform } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PRECISION = 3;
const DEFAULT_PROJECTIONS = [
    {
        label: "WGS 84",
        value: "EPSG:4326",
        precision: 3
    },
    {
        label: "Web Mercator",
        value: "EPSG:3857",
        precision: 2
    }
];

/**
 * dropdown items of projection selection with an optional coordinate precision
 */
export interface ProjectionOption {
    /**
     * Label to show the user.
     */
    label: string;

    /**
     * The map projection code.
     */
    value: string;

    /**
     * The number of displayed decimal places.
     */
    precision?: number;
}

/**
 * dropdown items of projection selection, must have a specified precision
 */
type ProjectionItem = Required<ProjectionOption>;

/**
 * Event type emitted when the user enters new coordinates or projection is changed by the user.
 */
export interface CoordsInputEvent {
    /** The entered coordinates in the projection of the map */
    coords: Coordinate;

    /** The current map projection and projection of the coords. */
    projection: string;
}

/**
 * Props for the {@link CoordinateInput} component.
 */
export interface CoordinateInputProps extends CommonComponentProps, MapModelProps {
    /**
     * Searchable projections, only projections that are known by the map as projection are shown.
     * Each projection can have an individual precision of coordinates. If no precision is given, the default precision is used.
     */
    projections?: ProjectionOption[];

    /**
     * Function that gets called if some coordinates are entered or projection is changed by the user.
     */
    onSelect?: (selectProps: CoordsInputEvent) => void;

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
    const mapProjCode = useProjection(olMap)?.getCode() ?? ""; // projection of the map

    // Projection items (dropdown)
    const availableProjections = useProjectionItems(projections); // filter for projections that are known
    const [selectedProjection, setSelectedProjection] = useState<ProjectionItem>(
        // set projection select initial on first one in list
        availableProjections[0]!
    );

    // Input state
    const [coordinateSearchInput, setCoordinateSearchInput] = useInput(
        input,
        mapProjCode,
        selectedProjection
    );
    const placeholderString = usePlaceholder(placeholder, mapProjCode, selectedProjection);
    const validationResult = validateInput(intl, coordinateSearchInput, selectedProjection.value);
    const isInputValid = validationResult === "success";

    const [isOpenSelect, setIsOpenSelect] = useState(false); // if the select menu is open
    const [menuPlacement, setMenuPlacement] = useState<string>(""); // where is menu is places (top/bottom)

    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        //if the menu is already open, do noting
        if (!isOpenSelect && event.key === "Enter") {
            setIsOpenSelect(true);
        }
    });

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
                >
                    <InputGroup className="coordinateSearchGroup">
                        <InputGroup className="coordinateInputGroup">
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
                                    id: "coordinateSearch.ariaLabel"
                                })}
                                borderRightRadius={0}
                                onKeyDown={(eve) => {
                                    if (eve.key == "Enter") {
                                        onCoordinateInput(
                                            intl,
                                            coordinateSearchInput,
                                            selectedProjection.value,
                                            mapProjCode,
                                            onSelect
                                        );
                                    }
                                }}
                            />
                            {coordinateSearchInput !== "" && (
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
                                            id: "coordinateSearch.ariaLabel"
                                        })}
                                    />
                                </InputRightElement>
                            )}
                            {typeof placeholder === "object" && coordinateSearchInput == "" && (
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
                                            id: "coordinateSearch.copyPlaceholder"
                                        })}
                                    />
                                </InputRightElement>
                            )}
                        </InputGroup>
                        <InputRightAddon padding={"0px"} borderLeft={"0px"}>
                            <Select
                                value={selectedProjection}
                                defaultValue={selectedProjection}
                                options={availableProjections}
                                menuPlacement="auto"
                                menuPortalTarget={portalElement.current}
                                aria-label={intl.formatMessage({
                                    id: "coordinateSearch.ariaLabel"
                                })}
                                classNamePrefix={"coordinate-Search-Select"}
                                isSearchable={false}
                                chakraStyles={{
                                    menu: (base, selectProps) => {
                                        setMenuPlacement(selectProps.placement);
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
                                        //borderColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`,
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
                                        "> svg": {
                                            transitionDuration: "normal",
                                            transform: `rotate(${menuIsOpen && menuPlacement == "top" ? 0 : menuIsOpen && menuPlacement == "bottom" ? -180 : !menuIsOpen && menuPlacement == "top" ? -180 : !menuIsOpen && menuPlacement == "bottom" ? 0 : 0}deg)`
                                        },
                                        backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                                        //borderColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                                    }),
                                    option: (base) => ({
                                        ...base,
                                        _focus: {
                                            background: "var(--chakra-colors-trails-300)"
                                        }
                                    }),
                                    indicatorSeparator: (
                                        base,
                                        { selectProps: { menuIsOpen } }
                                    ) => ({
                                        ...base,
                                        backgroundColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                                        //borderColor: `${menuIsOpen ? "rgb(27, 75, 95)" : "var(--chakra-colors-background_primary)"}`
                                    })
                                }}
                                ariaLiveMessages={{
                                    guidance: () => "",
                                    onChange: (props) => {
                                        if (
                                            props.action == "select-option" ||
                                            props.action == "initial-input-focus"
                                        )
                                            return (
                                                props.label +
                                                " " +
                                                intl.formatMessage({ id: "selected" })
                                            );
                                        else return "";
                                    },
                                    onFilter: () => "",
                                    onFocus: () => ""
                                }}
                                onChange={(e) => {
                                    if (e?.value !== undefined) {
                                        setSelectedProjection(e);
                                        onCoordinateInput(
                                            intl,
                                            coordinateSearchInput,
                                            e?.value,
                                            mapProjCode,
                                            onSelect
                                        );
                                    }
                                }}
                                onKeyDown={keyDown}
                                menuIsOpen={isOpenSelect}
                                onMenuOpen={() => setIsOpenSelect(true)}
                                onMenuClose={() => setIsOpenSelect(false)}
                            />
                        </InputRightAddon>
                    </InputGroup>
                </Tooltip>
            </Flex>
        </Box>
    );
};

/**
 * Returns the current text input and a callback to change it (used for interactive user input).
 * The current text may also change if the input prop changes (controlled usage).
 */
function useInput(
    inputProp: Coordinate | undefined,
    mapProjCode: string,
    selectedProjection: ProjectionItem
): [string, (value: string) => void] {
    const intl = useIntl();
    const [coordinateSearchInput, setCoordinateSearchInput] = useState<string>(""); // coordinate input field
    const inputFromOutside = useMemo(() => {
        if (!inputProp || !mapProjCode) {
            return "";
        }
        const transformed = transformCoordinates(inputProp, mapProjCode, selectedProjection.value);
        return formatCoordinates(transformed, selectedProjection.precision, intl);
    }, [inputProp, mapProjCode, selectedProjection, intl]);

    useEffect(() => {
        if (inputProp != undefined) {
            setCoordinateSearchInput(inputFromOutside);
        }
    }, [inputProp, inputFromOutside]);
    return [coordinateSearchInput, setCoordinateSearchInput];
}

/**
 * Parses the projections defined by the user.
 */
function useProjectionItems(projections: ProjectionOption[]) {
    return useMemo(() => {
        const items: ProjectionItem[] = projections.map((ele) => {
            return {
                label: ele.label,
                value: ele.value,
                precision: ele.precision ?? DEFAULT_PRECISION
                // TODO: Find available projection and store it, or filter the element (e.g. with flatmap or map + filter)
            };
        });
        // filter for projections that are known
        const availableProjections = items.filter((cs) => getProjection(cs.value) != null);
        return availableProjections;
    }, [projections]);
}

/**
 * Returns the current placeholder string.
 */
function usePlaceholder(
    placeholderProp: string | Coordinate,
    mapProjectionCode: string,
    selectedProjection: ProjectionItem
) {
    const intl = useIntl();
    return useMemo(() => {
        let placeholder: string;
        if (typeof placeholderProp === "string") {
            placeholder = placeholderProp;
        } else if (!mapProjectionCode) {
            placeholder = "";
        } else {
            const coords = transformCoordinates(
                placeholderProp as Coordinate,
                mapProjectionCode,
                selectedProjection.value
            );
            placeholder = formatCoordinates(coords, selectedProjection.precision, intl);
        }
        return placeholder;
    }, [placeholderProp, mapProjectionCode, selectedProjection, intl]);
}

type ValidationResult =
    | "success"
    | "tooltip.space"
    | "tooltip.spaceOne"
    | "tooltip.2coords"
    | "tooltip.dividerDe"
    | "tooltip.dividerEn"
    | "tooltip.extent"
    | "tooltip.projection";

function validateInput(
    intl: PackageIntl,
    inputString: string,
    projection: string
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
    if (intl.locale === "de") {
        thousandSeparator = ".";

        const inputStringWithoutThousandSeparator = inputString.replaceAll(thousandSeparator, "");

        if (!/^-?\d+(,\d+)? -?\d+(,\d+)?$/.test(inputStringWithoutThousandSeparator)) {
            return "tooltip.dividerDe";
        }
    } else if (intl.locale === "en") {
        thousandSeparator = ",";

        const inputStringWithoutThousandSeparator = inputString.replaceAll(thousandSeparator, "");

        if (!/^-?\d+(.\d+)? -?\d+(.\d+)?$/.test(inputStringWithoutThousandSeparator)) {
            return "tooltip.dividerEn";
        }
    }

    let coords = parseCoords(inputString, thousandSeparator);
    try {
        let chosenProjection = getProjection(projection);
        if (chosenProjection === null || chosenProjection.getExtent() === null) {
            chosenProjection = getProjection("EPSG:4326");

            coords = transformCoordinates(coords, projection, "EPSG:4326");
        }

        if (
            chosenProjection!.getExtent().length == 4 &&
            chosenProjection!.getExtent()[0]! > coords[0]! &&
            chosenProjection!.getExtent()[1]! > coords[1]! &&
            chosenProjection!.getExtent()[2]! < coords[0]! &&
            chosenProjection!.getExtent()[3]! < coords[1]!
        ) {
            return "tooltip.extent";
        }
    } catch (e) {
        return "tooltip.projection";
    }
    return "success";
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
    projection: string | undefined,
    mapProjection: string,
    onSelect?: (selectProps: CoordsInputEvent) => void
) {
    if (
        projection == undefined ||
        coordinateString == "" ||
        validateInput(intl, coordinateString, projection) !== "success"
    )
        return;
    let inputStringWithoutHundredDivider = coordinateString;
    if (intl.locale === "de") {
        inputStringWithoutHundredDivider = coordinateString.replaceAll(".", "");
    } else if (intl.locale === "en") {
        inputStringWithoutHundredDivider = coordinateString.replaceAll(",", "");
    }
    const coordsForZoom = getCoordsForZoom(
        inputStringWithoutHundredDivider,
        projection,
        mapProjection
    );
    if (onSelect) {
        onSelect({ coords: coordsForZoom, projection: mapProjection });
    }
}

/* returns the given coordinates in the projection of the map */
function getCoordsForZoom(
    coordinateString: string,
    projection: string,
    mapProjection: string
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
    source: string,
    destination: string
): number[] {
    return transform(coordinates, source, destination);
}

/* formats the coordinates into a string with x withspace y */
function formatCoordinates(coordinates: number[], precision: number, intl: PackageIntl) {
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
