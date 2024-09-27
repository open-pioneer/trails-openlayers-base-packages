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
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
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
    coordinateSystems?: { label: string; value: string }[];

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
 * The `CoordinateSearch`component can be used in an app to center the map to entered coordinates
 */
export const CoordinateSearch: FC<CoordinateSearchProps> = (props) => {
    const {
        onSelect,
        onClear,
        coordinateSystems = [
            {
                label: "EPSG:4326",
                value: "EPSG:4326"
            },
            {
                label: "EPSG:3857",
                value: "EPSG:3857"
            }
        ]
    } = props;
    const { containerProps } = useCommonComponentProps("coordinate-search", props);
    const { map } = useMapModel(props);
    const intl = useIntl();
    const olMap = map?.olMap;
    const mapProjectionCode = useProjection(olMap)?.getCode() ?? "";
    const availableCoordinateSystems = coordinateSystems.filter(
        (cs) => getProjection(cs.value) != null
    );
    const [coordinateSearchSystem, setCoordinateSearchSystem] = useState<{
        label: string;
        value: string;
    }>(availableCoordinateSystems[0]!);
    const [coordinateSearchInput, setCoordinateSearchInput] = useState<string>("");
    let tooltipMessage = "tooltip.basic";
    let { coordinates } = useCoordinates(olMap);
    coordinates =
        coordinates && mapProjectionCode
            ? transformCoordinates(coordinates, mapProjectionCode, coordinateSearchSystem.value)
            : coordinates;
    const coordinatesString = useCoordinatesString(coordinates, DEFAULT_PRECISION);
    const displayString = coordinatesString ? coordinatesString : "";
    const [displayPlaceholder, setDisplayPlaceholder] = useState<boolean>(false);
    const stringInvalid =
        !displayPlaceholder &&
        checkIfStringInvalid(
            intl,
            coordinateSearchInput,
            coordinateSearchSystem.value,
            setTooltipMessage
        );

    useEffect(() => {
        if (coordinateSearchInput === "") setDisplayPlaceholder(true);
        if (coordinateSearchInput !== "") setDisplayPlaceholder(false);
    }, [coordinateSearchInput]);

    function setTooltipMessage(newId: string) {
        tooltipMessage = newId;
    }

    return (
        <Box {...containerProps}>
            <Flex flexDirection={"row"} flexDir={"row"}>
                <Tooltip
                    label={intl.formatMessage({ id: tooltipMessage })}
                    hasArrow
                    placement="top"
                    isOpen={stringInvalid}
                >
                    <InputGroup className="coordinateSearchGroup">
                        <InputGroup className="coordinateInputGroup">
                            <Input
                                type="text"
                                value={displayPlaceholder ? displayString : coordinateSearchInput}
                                id="coordinateInput"
                                onChange={(eve) => {
                                    setCoordinateSearchInput(eve.target.value);
                                }}
                                isInvalid={stringInvalid}
                                backgroundColor={stringInvalid ? "red.100" : "unset"}
                                placeholder={displayString}
                                errorBorderColor="red.500"
                                aria-label={intl.formatMessage({
                                    id: "coordinateSearch.ariaLabel"
                                })}
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
                            <InputRightElement>
                                {coordinateSearchInput !== "" && (
                                    <IconButton
                                        id="clearCoordinateSearch"
                                        size="sm"
                                        onClick={() => {
                                            setCoordinateSearchInput("");
                                            if (onClear) {
                                                onClear();
                                            }
                                        }}
                                        isDisabled={coordinateSearchInput == ""}
                                        padding={"0px"}
                                        icon={<CloseIcon />}
                                        aria-label={intl.formatMessage({
                                            id: "coordinateSearch.ariaLabel"
                                        })}
                                    />
                                )}
                            </InputRightElement>
                        </InputGroup>
                        <InputRightAddon padding={"0px"} borderLeft={"0px"}>
                            <Select
                                {...containerProps}
                                id="selectCoordinateSystem"
                                value={coordinateSearchSystem}
                                defaultValue={coordinateSearchSystem}
                                options={availableCoordinateSystems}
                                menuPlacement="top"
                                aria-label={intl.formatMessage({
                                    id: "coordinateSearch.ariaLabel"
                                })}
                                classNamePrefix={"coordinate-Search-Select"}
                                isSearchable={false}
                                chakraStyles={{
                                    menu: (base) => ({
                                        ...base,
                                        width: "max-content",
                                        minWidth: "100%"
                                    }),
                                    control: (base) => ({
                                        ...base,
                                        width: "max-content",
                                        minWidth: "100%",
                                        color: "white",
                                        borderleftstyle: "none",
                                        borderLeftRadius: 0,
                                        padding: 0
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
                                            transform: `rotate(${menuIsOpen ? 0 : -180}deg)`
                                        }
                                    })
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

function transformCoordinates(
    coordinates: number[],
    source: string,
    destination: string
): number[] {
    return transform(coordinates, source, destination);
}

/* Separate function for easier testing */
export function useCoordinatesString(
    coordinates: number[] | undefined,
    precision: number | undefined
): string {
    const intl = useIntl();
    return coordinates ? formatCoordinates(coordinates, precision, intl) : "";
}

function formatCoordinates(
    coordinates: number[],
    configuredPrecision: number | undefined,
    intl: PackageIntl
) {
    if (coordinates[0] == null || coordinates[1] == null) {
        return "";
    }

    const precision = configuredPrecision ?? DEFAULT_PRECISION;
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
