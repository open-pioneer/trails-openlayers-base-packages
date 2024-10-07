// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    IconButton,
    Input,
    InputGroup,
    InputRightAddon,
    InputRightElement,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { MapModelProps, useMapModel, useProjection } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { get as getProjection, transform } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { Select } from "chakra-react-select";
import { Coordinate } from "ol/coordinate";
import { CloseIcon } from "@chakra-ui/icons";
import { PackageIntl } from "@open-pioneer/runtime";
import { EventsKey } from "ol/events";
import { unByKey } from "ol/Observable";
import OlMap from "ol/Map";
import { KeyboardEvent } from "react";

const DEFAULT_PRECISION = 3;

/**
 * Event type emitted when the user enters new coordinates or projection is changed by the user.
 */
export interface CoordsSelectEvent {
    /** The entered coordinates in the projection of the map */
    coords: Coordinate;

    /** The current map projection and projection of the coords. */
    projection: string;
}

/**
 * These are special properties for the CoordinateSearch.
 */
export interface CoordinateSearchProps extends CommonComponentProps, MapModelProps {
    /**
     * Searchable coordinate Systems, only coordinate systems that are known as projection are shown.
     * Each System can have an individual precision. If no precision is given, the default Presision is used.
     */
    coordinateSystems?: { label: string; value: string; precision?: number }[];

    /**
     * Function that gets called if some coordinates are entered or projection is changed by the user.
     */
    onSelect?: (selectProps: CoordsSelectEvent) => void;

    /**
     * Function that gets called if the input is cleared.
     */
    onClear?: () => void;
}

/**
 * The `CoordinateSearch`component can be used in an app to search for entered coordinates on the choosen projection
 */
export const CoordinateSearch: FC<CoordinateSearchProps> = (props) => {
    const {
        onSelect,
        onClear,
        coordinateSystems = [
            {
                label: "EPSG:4326",
                value: "EPSG:4326",
                precision: 3
            },
            {
                label: "EPSG:3857",
                value: "EPSG:3857",
                precision: 2
            }
        ]
    } = props;
    const { containerProps } = useCommonComponentProps("coordinate-search", props);
    const { map } = useMapModel(props);
    const intl = useIntl();
    const olMap = map?.olMap;
    const mapProjectionCode = useProjection(olMap)?.getCode() ?? ""; //projection of the map
    const coordinateSystemsWithPrec: { label: string; value: string; precision: number }[] = [];
    coordinateSystems.forEach(
        (ele) =>
            coordinateSystemsWithPrec.push({
                label: ele.label,
                value: ele.value,
                precision: ele.precision || DEFAULT_PRECISION
            }) // add precision to every projection, if nothing is set
    );
    const availableCoordinateSystems: { label: string; value: string; precision: number }[] =
        coordinateSystemsWithPrec.filter((cs) => getProjection(cs.value) != null); // filter for projections that are known
    const [coordinateSearchSystem, setCoordinateSearchSystem] = useState<{
        label: string;
        value: string;
        precision: number;
    }>({
        label: availableCoordinateSystems[0]!.label,
        value: availableCoordinateSystems[0]!.value,
        precision: availableCoordinateSystems[0]!.precision
    }); // set projection select initial on first one in list
    const [coordinateSearchInput, setCoordinateSearchInput] = useState<string>(""); // coordinate input field
    let tooltipMessage = "tooltip.basic";
    let { coordinates } = useCoordinates(olMap); //coordinates of the pointer in the map
    coordinates =
        coordinates && mapProjectionCode
            ? transformCoordinates(coordinates, mapProjectionCode, coordinateSearchSystem.value)
            : coordinates;
    const displayString = useCoordinatesString(coordinates, coordinateSearchSystem.precision);
    const [displayPlaceholder, setDisplayPlaceholder] = useState<boolean>(false);
    const stringInvalid =
        !displayPlaceholder &&
        checkIfStringInvalid(
            intl,
            coordinateSearchInput,
            coordinateSearchSystem.value,
            setTooltipMessage
        );
    const [isOpenSelect, setIsOpenSelect] = useState(false); // if the select menu is open
    const [menuPlacement, setMenuPlacement] = useState<string>(""); // where is menu is places (top/bottom)

    useEffect(() => {
        if (coordinateSearchInput === "") setDisplayPlaceholder(true);
        if (coordinateSearchInput !== "") setDisplayPlaceholder(false);
    }, [coordinateSearchInput]);

    function setTooltipMessage(newId: string) {
        tooltipMessage = newId;
    }

    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        //if the menu is already open, do noting
        if (!isOpenSelect && event.key === "Enter") {
            setIsOpenSelect(true);
        }
    });

    return (
        <Box {...containerProps}>
            <Flex flexDirection={"row"} flexDir={"row"}>
                <Tooltip
                    label={intl.formatMessage({ id: tooltipMessage })}
                    hasArrow
                    placement="auto"
                    isOpen={stringInvalid}
                >
                    <InputGroup className="coordinateSearchGroup">
                        <InputGroup className="coordinateInputGroup">
                            <Input
                                type="text"
                                value={displayPlaceholder ? displayString : coordinateSearchInput}
                                onChange={(eve) => {
                                    setCoordinateSearchInput(eve.target.value);
                                }}
                                isInvalid={stringInvalid}
                                backgroundColor={stringInvalid ? "red.100" : "undefined"}
                                placeholder={displayString}
                                errorBorderColor="red.500"
                                aria-label={intl.formatMessage({
                                    id: "coordinateSearch.ariaLabel"
                                })}
                                borderRightRadius={0}
                                onKeyDown={(eve) => {
                                    if (displayPlaceholder && !eve.ctrlKey)
                                        setDisplayPlaceholder(false);
                                    if (eve.key == "Enter") {
                                        onCoordinateSearch(
                                            intl,
                                            coordinateSearchInput,
                                            coordinateSearchSystem.value,
                                            mapProjectionCode,
                                            onSelect
                                        );
                                    }
                                }}
                            />
                            {coordinateSearchInput !== "" && (
                                <InputRightElement>
                                    <IconButton
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
                        </InputGroup>
                        <InputRightAddon padding={"0px"} borderLeft={"0px"}>
                            <Select
                                value={coordinateSearchSystem}
                                defaultValue={coordinateSearchSystem}
                                options={availableCoordinateSystems}
                                menuPlacement="auto"
                                aria-label={intl.formatMessage({
                                    id: "coordinateSearch.ariaLabel"
                                })}
                                aria-labelledby={intl.formatMessage({
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
                                        paddingEnd: 0
                                    }),
                                    dropdownIndicator: (base, { selectProps: { menuIsOpen } }) => ({
                                        ...base,
                                        paddingStart: 0,
                                        "> svg": {
                                            transitionDuration: "normal",
                                            transform: `rotate(${menuIsOpen && menuPlacement == "top" ? 0 : menuIsOpen && menuPlacement == "bottom" ? -180 : !menuIsOpen && menuPlacement == "top" ? -180 : !menuIsOpen && menuPlacement == "btoom" ? 0 : 0}deg)`
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
                                        setCoordinateSearchSystem(e);
                                        onCoordinateSearch(
                                            intl,
                                            coordinateSearchInput,
                                            e?.value,
                                            mapProjectionCode,
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

function checkIfStringInvalid(
    intl: PackageIntl,
    inputString: string,
    coordinateSystem: string,
    setTooltipMessage?: (newId: string) => void
) {
    if (inputString == "") return false;

    if (!inputString.includes(" ")) {
        if (setTooltipMessage) setTooltipMessage("tooltip.space");
        return true;
    }
    if (inputString.indexOf(" ") != inputString.lastIndexOf(" ")) {
        if (setTooltipMessage) setTooltipMessage("tooltip.spaceOne");
        return true;
    }
    if (
        inputString.split(" ").length != 2 ||
        inputString.split(" ")[0] == "" ||
        inputString.split(" ")[1] == ""
    ) {
        if (setTooltipMessage) setTooltipMessage("tooltip.2coords");
        return true;
    }
    let inputStringWithoutHundredDivider = inputString;
    if (intl.locale === "de") {
        if (!/^\d+(,\d+)? \d+(,\d+)?$/.test(inputString.replaceAll(".", ""))) {
            if (setTooltipMessage) setTooltipMessage("tooltip.dividerDe");
            return true;
        }
        inputStringWithoutHundredDivider = inputString.replaceAll(".", "");
    } else if (intl.locale === "en") {
        if (!/^\d+(.\d+)? \d+(.\d+)?$/.test(inputString.replaceAll(",", ""))) {
            if (setTooltipMessage) setTooltipMessage("tooltip.dividerEn");
            return true;
        }
        inputStringWithoutHundredDivider = inputString.replaceAll(",", "");
    }
    const chosenProjection = getProjection(coordinateSystem);
    if (chosenProjection !== null && chosenProjection.getExtent() !== null) {
        if (
            chosenProjection.getExtent().length == 4 &&
            chosenProjection.getExtent()[0]! >
                parseFloat(inputStringWithoutHundredDivider.split(" ")[0]!) &&
            chosenProjection.getExtent()[1]! >
                parseFloat(inputStringWithoutHundredDivider.split(" ")[1]!) &&
            chosenProjection.getExtent()[2]! <
                parseFloat(inputStringWithoutHundredDivider.split(" ")[0]!) &&
            chosenProjection.getExtent()[3]! <
                parseFloat(inputStringWithoutHundredDivider.split(" ")[1]!)
        ) {
            if (setTooltipMessage) setTooltipMessage("tooltip.extent");
            return true;
        }
    }
    const coordsString = inputStringWithoutHundredDivider.split(" ");
    const coords = [
        parseFloat(coordsString[0]!.replace(",", ".")),
        parseFloat(coordsString[1]!.replace(",", "."))
    ];
    try {
        const tempCoords = transformCoordinates(coords, coordinateSystem, "EPSG:4326");
        const proj4326 = getProjection(coordinateSystem);
        if (proj4326 !== null && proj4326.getExtent() !== null) {
            if (
                proj4326.getExtent().length == 4 &&
                proj4326.getExtent()[0]! > tempCoords[0]! &&
                proj4326.getExtent()[1]! > tempCoords[1]! &&
                proj4326.getExtent()[2]! < tempCoords[0]! &&
                proj4326.getExtent()[3]! < tempCoords[1]!
            ) {
                if (setTooltipMessage) setTooltipMessage("tooltip.extent");
                return true;
            }
        }
    } catch (e) {
        if (setTooltipMessage) setTooltipMessage("tooltip.projection");
        return true;
    }
    return false;
}

function onCoordinateSearch(
    intl: PackageIntl,
    coordinateString: string,
    coordinateSystem: string | undefined,
    mapCoordinateSystem: string,
    onSelect?: (selectProps: CoordsSelectEvent) => void
) {
    if (
        coordinateSystem == undefined ||
        coordinateString == "" ||
        checkIfStringInvalid(intl, coordinateString, coordinateSystem)
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
        coordinateSystem,
        mapCoordinateSystem
    );
    if (onSelect) {
        onSelect({ coords: coordsForZoom, projection: mapCoordinateSystem });
    }
}

/* gives back the given coordinates in the projection of the map */
function getCoordsForZoom(
    coordinateString: string,
    coordinateSystem: string,
    mapCoordinateSystem: string
): Coordinate {
    const coordsString = coordinateString.split(" ");
    const coords = [
        parseFloat(coordsString[0]!.replace(",", ".")),
        parseFloat(coordsString[1]!.replace(",", "."))
    ];
    return transformCoordinates(coords, coordinateSystem, mapCoordinateSystem);
}

/* transforms the given coordinates in the given destination projection */
function transformCoordinates(
    coordinates: number[],
    source: string,
    destination: string
): number[] {
    return transform(coordinates, source, destination);
}

/* Separate function for easier testing */
export function useCoordinatesString(coordinates: number[] | undefined, precision: number): string {
    const intl = useIntl();
    return coordinates ? formatCoordinates(coordinates, precision, intl) : "";
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

/** function to get the coordinates of the pointer in the map */
function useCoordinates(map: OlMap | undefined): { coordinates: Coordinate | undefined } {
    const [coordinates, setCoordinates] = useState<Coordinate | undefined>();

    useEffect(() => {
        if (!map) {
            return;
        }

        const eventsKey: EventsKey = map.on("pointermove", (evt) => {
            setCoordinates(evt.coordinate);
        });

        return () => unByKey(eventsKey);
    }, [map]);

    return { coordinates };
}
