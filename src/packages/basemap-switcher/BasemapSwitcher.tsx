// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Flex, Tooltip, useToken } from "@open-pioneer/chakra-integration";
import { Layer, MapModel, useMapModel, MapModelProps } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps, useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import {
    chakraComponents,
    ChakraStylesConfig,
    GroupBase,
    OptionProps,
    Select,
    SingleValueProps
} from "chakra-react-select";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, KeyboardEvent, useMemo, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

/*
    Exported for tests. Feels a bit hacky but should be fine for now.
    Originally was using the empty string, but that doesn't work well with happy-dom.
*/
export const NO_BASEMAP_ID = "___NO_BASEMAP___";

/**
 * Properties for single select options.
 */
export interface SelectOption {
    /**
     * The id of the basemap for the select option.
     */
    value: string;

    /**
     * The layer object for the select option.
     */
    layer: Layer | undefined;
}

/**
 * These are special properties for the BasemapSwitcher.
 */
export interface BasemapSwitcherProps extends CommonComponentProps, MapModelProps {
    /**
     * Additional css class name(s) that will be added to the BasemapSwitcher component.
     */
    className?: string;

    /**
     * Specifies whether an option to deactivate all basemap layers is available in the BasemapSwitcher.
     * Defaults to `false`.
     */
    allowSelectingEmptyBasemap?: boolean | undefined;

    /**
     * Optional aria-labelledby property.
     * Do not use together with aria-label.
     */
    "aria-labelledby"?: string;

    /**
     * Optional aria-label property.
     * Do not use together with aria-label.
     */
    "aria-label"?: string;
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const BasemapSwitcher: FC<BasemapSwitcherProps> = (props) => {
    const intl = useIntl();
    const {
        allowSelectingEmptyBasemap = false,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy
    } = props;
    const { containerProps } = useCommonComponentProps("basemap-switcher", props);
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const { map } = useMapModel(props);
    const baseLayers = useBaseLayers(map);
    const activeBaseLayer = useReactiveSnapshot(() => map?.layers.getActiveBaseLayer(), [map]);

    const activateLayer = (layerId: string) => {
        map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
    };

    const { options, selectedLayer } = useMemo(() => {
        const options: SelectOption[] = baseLayers.map<SelectOption>((layer) => {
            return { value: layer.id, layer: layer };
        });

        if (allowSelectingEmptyBasemap || activeBaseLayer == null) {
            const emptyOption: SelectOption = { value: NO_BASEMAP_ID, layer: undefined };
            options.push(emptyOption);
        }

        const selectedLayer = options.find((l) => l.layer === activeBaseLayer);
        return { options, selectedLayer };
    }, [allowSelectingEmptyBasemap, baseLayers, activeBaseLayer]);

    const chakraStyles = useChakraStyles();
    const [isOpenSelect, setIsOpenSelect] = useState(false);
    const components = useMemo(() => {
        return {
            Option: BasemapSelectOption,
            SingleValue: BasemapSelectValue
        };
    }, []);
    const keyDown = useEvent((event: KeyboardEvent<HTMLDivElement>) => {
        //if the menu is already open, do noting
        if (!isOpenSelect && event.key === "Enter") {
            setIsOpenSelect(true);
        }
    });

    return (
        <Box {...containerProps}>
            {map ? (
                <Select<SelectOption>
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    className="basemap-switcher-select"
                    classNamePrefix="react-select"
                    options={options}
                    value={selectedLayer}
                    onChange={(option) => option && activateLayer(option.value)}
                    isClearable={false}
                    isSearchable={false}
                    menuPosition="fixed"
                    // optionLabel is used by screenreaders
                    getOptionLabel={(option) =>
                        option.layer !== undefined
                            ? option.layer.title +
                              (option.layer.loadState === "error"
                                  ? " " + intl.formatMessage({ id: "layerNotAvailable" })
                                  : "")
                            : emptyBasemapLabel
                    }
                    isOptionDisabled={(option) => option?.layer?.loadState === "error"}
                    components={components}
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
            ) : null}
        </Box>
    );
};

function useBaseLayers(mapModel: MapModel | undefined): Layer[] {
    return useReactiveSnapshot(() => mapModel?.layers.getBaseLayers() ?? [], [mapModel]);
}

function BasemapSelectOption(props: OptionProps<SelectOption>): JSX.Element {
    const { layer } = props.data;
    const { isAvailable, content } = useBasemapItem(layer);

    return (
        <chakraComponents.Option
            {...props}
            isDisabled={!isAvailable}
            className="basemap-switcher-option"
        >
            {content}
        </chakraComponents.Option>
    );
}

function BasemapSelectValue(props: SingleValueProps<SelectOption>): JSX.Element {
    const { layer } = props.data;
    const { isAvailable, content } = useBasemapItem(layer);

    return (
        <chakraComponents.SingleValue
            {...props}
            isDisabled={!isAvailable}
            className="basemap-switcher-value"
        >
            {content}
        </chakraComponents.SingleValue>
    );
}

function useBasemapItem(layer: Layer | undefined) {
    const intl = useIntl();
    const notAvailableLabel = intl.formatMessage({ id: "layerNotAvailable" });
    const { label, isAvailable } = useReactiveSnapshot(() => {
        if (!layer) {
            // undefined layer -> empty basemap entry
            return { label: intl.formatMessage({ id: "emptyBasemapLabel" }), isAvailable: true };
        }

        return {
            label: layer.title,
            isAvailable: layer.loadState !== "error"
        };
    }, [layer, intl]);

    return {
        isAvailable,
        content: (
            <Flex direction="row" alignItems="center">
                {label}
                {!isAvailable && (
                    <Box ml={2}>
                        <Tooltip label={notAvailableLabel} placement="right" openDelay={500}>
                            <span>
                                <FiAlertTriangle color={"red"} aria-label={notAvailableLabel} />
                            </span>
                        </Tooltip>
                    </Box>
                )}
            </Flex>
        )
    };
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
        const chakraStyles: ChakraStylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
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
