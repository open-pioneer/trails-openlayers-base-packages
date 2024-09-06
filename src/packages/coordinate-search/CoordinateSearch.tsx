// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Flex,
    IconButton,
    Input,
    InputGroup,
    InputRightAddon,
    InputRightElement
} from "@open-pioneer/chakra-integration";
import {useMapModel, useProjection} from "@open-pioneer/map";
import {CommonComponentProps, useCommonComponentProps} from "@open-pioneer/react-utils";
import {get as getProjection, transform} from "ol/proj";
import {useIntl} from "open-pioneer:react-hooks";
import {FC, useEffect, useState} from "react";
import {Select} from "chakra-react-select";
import {Coordinate} from "ol/coordinate";
import {CloseIcon} from "@chakra-ui/icons";
import {PackageIntl} from "@open-pioneer/runtime";
import {EventsKey} from "ol/events";
import {unByKey} from "ol/Observable";
import OlMap from "ol/Map";

const DEFAULT_PRECISION = 3;

/**
 * Event type emitted when the user selects an item.
 */
export interface CoordsSelectEvent {
    /** The selected coordinates in the projection of the map */
    coords: Coordinate;
    /** The current map projection and projection of the coords. */
    projection: string;
}

/**
 * These are special properties for the CoordinateSearch.
 */
export interface CoordinateSearchProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Function that gets called if some cordinates or projection is called.
     */
    onSelect: (selectProps: CoordsSelectEvent) => void;

    /**
     * Function, that gets called, if the search is cleared.
     */
    onClear: () => void;
}

/**
 * The `CoordinateSearch`component can be used in an app to render the coordinates at the current mouse position.
 */
export const CoordinateSearch: FC<CoordinateSearchProps> = (props) => {
    const { mapId, onSelect, onClear } = props;
    const { containerProps } = useCommonComponentProps("coordinate-search", props);
    const { map } = useMapModel(mapId);
    const intl = useIntl();
    const olMap = map?.olMap;
    const mapProjectionCode = useProjection(olMap)?.getCode() ?? "";
    const availableCoordinateSystems = [
        {
            label: "EPSG:25832",
            value: "EPSG:25832"
        },
        {
            label: "EPSG:4326",
            value: "EPSG:4326"
        },
        {
            label: "EPSG:3857",
            value: "EPSG:3857"
        },
        {
            label: "EPSG:25833",
            value: "EPSG:25833"
        }
        /*{
            label: "EPSG:31466",
            value: "EPSG:31466"
        },
        {
            label: "EPSG:31467",
            value: "EPSG:31467"
        },
        {
            label: "EPSG:3035",
            value: "EPSG:3035"
        }*/
    ];
    const [coordinateSearchSystem, setCoordinateSearchSystem] = useState<{
        label: string;
        value: string;
    }>(availableCoordinateSystems[0]!);
    const [coordinateSearchInput, setCoordinateSearchInput] = useState<string>("");
    let { coordinates } = useCoordinates(olMap);
    coordinates =
        coordinates && mapProjectionCode
            ? transformCoordinates(coordinates, mapProjectionCode, coordinateSearchSystem.value)
            : coordinates;
    const coordinatesString = useCoordinatesString(coordinates, DEFAULT_PRECISION);
    const displayString = coordinatesString ? coordinatesString : "";

    return (
        <Box {...containerProps}>
            <Flex flexDirection={"row"} flexDir={"row"}>
                <InputGroup className="coordinateSearchGroup">
                    <InputGroup className="coordinateInputGroup">
                        <Input
                            type="text"
                            value={coordinateSearchInput}
                            id="coordinateInput"
                            onChange={(eve) => {
                                setCoordinateSearchInput(eve.target.value);
                            }}
                            isInvalid={checkIfStringInvalid(
                                coordinateSearchInput,
                                coordinateSearchSystem.value
                            )}
                            backgroundColor={
                                checkIfStringInvalid(
                                    coordinateSearchInput,
                                    coordinateSearchSystem.value
                                )
                                    ? "red.100"
                                    : "unset"
                            }
                            placeholder={displayString}
                            errorBorderColor="red.500"
                            aria-label={intl.formatMessage({ id: "coordinateSearch.ariaLabel" })}
                            onKeyDown={(eve) => {
                                if (eve.key == "Enter") {
                                    onCoordinateSearch(
                                        coordinateSearchInput,
                                        coordinateSearchSystem.value,
                                        mapProjectionCode,
                                        onSelect
                                    );
                                }
                            }}
                        />
                        <InputRightElement>
                            <IconButton
                                id="clearCoordinateSearch"
                                size="sm"
                                onClick={() => {
                                    setCoordinateSearchInput("");
                                    onClear();
                                }}
                                isDisabled={coordinateSearchInput == ""}
                                padding={"0px"}
                                icon={<CloseIcon />}
                                aria-label={intl.formatMessage({
                                    id: "coordinateSearch.ariaLabel"
                                })}
                            />
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
                            aria-label={intl.formatMessage({ id: "coordinateSearch.ariaLabel" })}
                            classNamePrefix={"coordinate-Search-Select"}
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
            </Flex>
        </Box>
    );
};

function checkIfStringInvalid(inputString: string, coordinateSystem: string) {
    if (inputString == "") return false;
    if (!inputString.includes(" ")) return true;
    if (inputString.split(" ").length != 2) return true;
    if (!/^\d+$/.test(inputString.replace(" ", ""))) return true;
    const choosenProjection = getProjection(coordinateSystem);
    if (choosenProjection !== null && choosenProjection.getExtent() !== null) {
        if (
            choosenProjection.getExtent().length == 4 &&
            choosenProjection.getExtent()[0]! > parseFloat(inputString.split(" ")[0]!) &&
            choosenProjection.getExtent()[1]! > parseFloat(inputString.split(" ")[1]!) &&
            choosenProjection.getExtent()[2]! < parseFloat(inputString.split(" ")[0]!) &&
            choosenProjection.getExtent()[3]! < parseFloat(inputString.split(" ")[1]!)
        ) {
            return true;
        }
    }
    const coordsString = inputString.split(" ");
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
                return true;
            }
        }
    } catch (e) {
        return true;
    }
    return false;
}

function onCoordinateSearch(
    coordinateString: string,
    coordinateSystem: string | undefined,
    mapCoordinateSystem: string,
    onSelect: (selectProps: CoordsSelectEvent) => void
) {
    if (
        coordinateSystem == undefined ||
        coordinateString == "" ||
        checkIfStringInvalid(coordinateString, coordinateSystem)
    )
        return;
    const coordsForZoom = getCoordsForZoom(coordinateString, coordinateSystem, mapCoordinateSystem);
    onSelect({ coords: coordsForZoom, projection: mapCoordinateSystem });
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
