// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed, Reactive, reactive } from "@conterra/reactivity-core";
import {
    Box,
    Flex,
    InputGroup,
    InputRightAddon,
    Portal,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { NumberParserService, PackageIntl } from "@open-pioneer/runtime";
import { Coordinate } from "ol/coordinate";
import { get as getProjection, Projection, ProjectionLike, transform } from "ol/proj";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CoordinateInputField } from "./CoordinateInputField";
import { formatCoordinates, parseCoordinates, ParseResult } from "./coordinates";
import { ProjectionSelect } from "./ProjectionSelect";
import { usePlaceholder } from "./usePlaceholder";

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
 * Dropdown item of projection selection with an optional coordinate precision
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
 * Internal view of a (normalized) projection.
 * The projection has been looked up and optional values have been filled in.
 */
export interface ProjectionItem {
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
    precision: number;
}

/**
 * Event type emitted when the user enters new coordinates or projection is changed by the user.
 */
export interface CoordinatesSelectEvent {
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
     * List of projection options, only projections that are known by the map as projection are shown.
     * Each projection can have an individual precision of coordinates.
     *
     * If no precision is given, the default precision is used.
     */
    projections?: ProjectionInput[];

    /**
     * Optional event that gets called if (valid) coordinates are entered or projection is changed by the user.
     */
    onSelect?: (event: CoordinatesSelectEvent) => void;

    /**
     * Optional event that gets called if the input is cleared.
     */
    onClear?: () => void;

    /**
     * Insert input value and overwrite user input.
     */
    input?: Coordinate;

    /**
     * Placeholder text to display when no input is present. Common usages:
     * * hint for the user ("enter coordinate here")
     * * example coordinate ("12.345 67.890")
     * * current mouse position
     *
     * If a coordinate is given, it has to be in the current projection of the map.
     */
    placeholder?: string | Coordinate;
}

/**
 * The `CoordinateInput` component can be used in an app to provide a validated input field for coordinates in a selected projection
 */
export const CoordinateInput: FC<CoordinateInputProps> = (props) => {
    const {
        onSelect: onSelectProp,
        onClear,
        projections = DEFAULT_PROJECTIONS,
        input,
        placeholder = ""
    } = props;
    const { containerProps } = useCommonComponentProps("coordinate-input", props);
    const { map } = useMapModel(props);
    const intl = useIntl();
    const mapProjection = useReactiveSnapshot(() => map?.projection, [map]);

    // Projection items (dropdown)
    const availableProjections = useProjectionItems(projections);
    const [selectedProjection, setSelectedProjection] = useState<ProjectionItem>(
        // choose first option initially
        availableProjections[0]!
    );

    // Input state
    const onSelect = useEvent((coordinatesResult: ParseResult) => {
        if (!onSelectProp || coordinatesResult.kind !== "success" || mapProjection == null) {
            return;
        }

        const coords = transform(
            coordinatesResult.coordinates,
            coordinatesResult.projection,
            mapProjection
        );
        onSelectProp({ coords: coords, projection: mapProjection });
    });
    const [coordinateSearchInput, setCoordinateSearchInput, validationResult] = useCoordinateState(
        input,
        mapProjection,
        selectedProjection,
        onSelect
    );
    const placeholderString = usePlaceholder(placeholder, mapProjection, selectedProjection);
    const isInputValid = validationResult.kind === "success" || validationResult.kind === "empty";
    const onEnter = useEvent(() => {
        onSelect(validationResult);
    });

    const portalElement = useRef<HTMLDivElement>(null);
    return (
        <Box {...containerProps}>
            <Portal>
                <div ref={portalElement} />
            </Portal>
            <Flex flexDirection={"row"} flexDir={"row"}>
                <Tooltip
                    label={
                        !isInputValid
                            ? intl.formatMessage({ id: validationResult.kind })
                            : undefined
                    }
                    hasArrow
                    placement="auto"
                    isOpen={!isInputValid}
                    className="coordinate-input-tooltip"
                >
                    <InputGroup className="coordinate-input-group">
                        <CoordinateInputField
                            coordinateSearchInput={coordinateSearchInput}
                            setCoordinateSearchInput={setCoordinateSearchInput}
                            placeholder={placeholder}
                            placeholderString={placeholderString}
                            onClear={onClear}
                            isInputValid={isInputValid}
                            onEnter={onEnter}
                        />
                        <InputRightAddon padding={"0px"} borderLeft={"0px"}>
                            <ProjectionSelect
                                portalElement={portalElement}
                                currentProjection={selectedProjection}
                                projections={availableProjections}
                                onProjectionChange={setSelectedProjection}
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
function useCoordinateState(
    inputProp: Coordinate | undefined,
    mapProjection: Projection | undefined,
    selectedProjection: ProjectionItem,
    onSelect: (validationResult: ParseResult) => void
): [string, (value: string) => void, ParseResult] {
    const intl = useIntl();
    const numberParser = useService<NumberParserService>("runtime.NumberParserService");

    const [model] = useState(() => new StateModel(intl, selectedProjection, numberParser));
    useEffect(() => {
        const triggerSelect =
            inputProp !== model.inputProp || selectedProjection !== model.selectedProjection;

        model.setI18n(intl, numberParser);
        model.setInputProp(inputProp);
        model.setSelectedProjection(selectedProjection);
        model.setMapProjection(mapProjection);

        if (triggerSelect) {
            const validationResult = model.validationResult;
            onSelect(validationResult);
        }
    }, [model, intl, numberParser, inputProp, selectedProjection, mapProjection, onSelect]);

    const { rawInput, validationResult } = useReactiveSnapshot(() => {
        return {
            rawInput: model.rawInput,
            validationResult: model.validationResult
        };
    }, [model]);
    const setInputText = useCallback(
        (inputText: string) => {
            model.setText(inputText);
        },
        [model]
    );
    return [rawInput, setInputText, validationResult];
}

class StateModel {
    #intl: Reactive<PackageIntl>;
    #selectedProjection: Reactive<ProjectionItem>;
    #mapProjection = reactive<Projection | undefined>();
    #inputProp = reactive<Coordinate | undefined>();
    #numberParser: Reactive<NumberParserService>;

    #rawInput = reactive("");
    #validationResult = computed(() => {
        return parseCoordinates(
            this.#rawInput.value,
            this.#numberParser.value,
            this.#selectedProjection.value.value
        );
    });

    constructor(
        intl: PackageIntl,
        selectedProjection: ProjectionItem,
        numberParser: NumberParserService
    ) {
        this.#intl = reactive(intl);
        this.#selectedProjection = reactive(selectedProjection);
        this.#numberParser = reactive(numberParser);
    }

    get inputProp() {
        return this.#inputProp.value;
    }

    get rawInput() {
        return this.#rawInput.value;
    }

    get validationResult() {
        return this.#validationResult.value;
    }

    get selectedProjection() {
        return this.#selectedProjection.value;
    }

    setI18n(intl: PackageIntl, numberParser: NumberParserService) {
        this.#intl.value = intl;
        this.#numberParser.value = numberParser;
    }

    setText(text: string) {
        this.#rawInput.value = text;
    }

    setSelectedProjection(value: ProjectionItem) {
        if (value !== this.#selectedProjection.value) {
            this.#selectedProjection.value = value;
            this.#updateInput();
        }
    }

    setInputProp(value: Coordinate | undefined) {
        if (value !== this.#inputProp.value) {
            this.#inputProp.value = value;
            this.#updateInput();
        }
    }

    setMapProjection(value: Projection | undefined) {
        if (value !== this.#mapProjection.value) {
            this.#mapProjection.value = value;
            this.#updateInput();
        }
    }

    #updateInput() {
        const inputProp = this.#inputProp.value;
        const mapProjection = this.#mapProjection.value;
        const selectedProjection = this.#selectedProjection.value;
        const intl = this.#intl.value;
        if (mapProjection && inputProp) {
            // Update state based on input prop.
            const transformed = transform(inputProp, mapProjection, selectedProjection.value);
            const formatted = formatCoordinates(transformed, selectedProjection.precision, intl);
            this.#rawInput.value = formatted;
        }
    }
}

/**
 * Builds the list of available projection items based on the provided list of projections
 */
function useProjectionItems(projections: ProjectionInput[]) {
    return useMemo(() => {
        // filter out projections that are not known
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
