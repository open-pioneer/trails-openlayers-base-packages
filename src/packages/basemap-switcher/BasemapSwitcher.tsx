// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, createListCollection } from "@chakra-ui/react";
import { Tooltip } from "@open-pioneer/chakra-snippets";
import { Layer, MapModel, useMapModel, MapModelProps } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { Select } from "@chakra-ui/react";

/*import {
    chakraComponents,
    ChakraStylesConfig,
    GroupBase,
    OptionProps,
    SingleValueProps
} from "chakra-react-select";*/
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useMemo, useState } from "react";
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

    label: string;
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
    // TODO aria labels
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

    const activateLayer = (layerId: string[]) => {
        map?.layers.activateBaseLayer(layerId[0] === NO_BASEMAP_ID ? undefined : layerId[0]);
    };

    const { selectedOption, optionsListCollection } = useMemo(() => {
        const options: SelectOption[] = baseLayers.map<SelectOption>((layer) => {
            return { value: layer.id, layer: layer, label: layer.title }; // TODO add disable attribute
        });

        if (allowSelectingEmptyBasemap || activeBaseLayer == null) {
            const emptyOption: SelectOption = {
                value: NO_BASEMAP_ID,
                layer: undefined,
                label: emptyBasemapLabel
            };
            options.push(emptyOption);
        }

        const optionsListCollection = createListCollection({ items: options });

        const selectedLayer = options.find((l) => l.layer === activeBaseLayer);
        const selectedOption = selectedLayer ? [selectedLayer?.value] : [NO_BASEMAP_ID]; // TODO is that in sync with the options?
        return { selectedOption, optionsListCollection };
    }, [baseLayers, allowSelectingEmptyBasemap, activeBaseLayer, emptyBasemapLabel]);

    //const chakraStyles = useChakraStyles();
    const [isOpenSelect, setIsOpenSelect] = useState(false);
    /*const components = useMemo(() => {
        return {
            Option: BasemapSelectOption,
            SingleValue: BasemapSelectValue
        };
    }, []);
*/

    return (
        <Box {...containerProps}>
            <Tooltip
                content="test123"
                aria-label="test123"
                positioning={{ placement: "right" }}
                showArrow
            >
                <span>
                    <FiAlertTriangle
                        color={"red"}
                        aria-label={intl.formatMessage({
                            id: "layerNotAvailable"
                        })}
                    />
                </span>
            </Tooltip>
            <Select.Root
                collection={optionsListCollection}
                value={selectedOption}
                onValueChange={(option) => option && activateLayer(option.value)}
                positioning={{ strategy: "fixed", sameWidth: true }}
            >
                <Select.Control>
                    <Select.Trigger>
                        <Select.ValueText placeholder={"Test"} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                        <Select.Indicator />
                    </Select.IndicatorGroup>
                </Select.Control>

                <Select.Positioner>
                    <Select.Content>
                        {optionsListCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value} justifyContent="flex-start">
                                {item.label}
                                {item.layer?.loadState === "error" && (
                                    <Box ml={2}>
                                        {/*TODO: tooltip does not work*/}
                                        <Tooltip
                                            content="test123"
                                            aria-label="test123"
                                            positioning={{ placement: "right" }}
                                            showArrow
                                        >
                                            <span>
                                                <FiAlertTriangle
                                                    color={"red"}
                                                    aria-label={intl.formatMessage({
                                                        id: "layerNotAvailable"
                                                    })}
                                                />
                                            </span>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Select.Root>
            {/* {map ? (
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
            ) : null}*/}
        </Box>
    );
};

function useBaseLayers(mapModel: MapModel | undefined): Layer[] {
    return useReactiveSnapshot(() => mapModel?.layers.getBaseLayers() ?? [], [mapModel]);
}

/*
function BasemapSelectOption(props: OptionProps<SelectOption>): ReactNode {
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

function BasemapSelectValue(props: SingleValueProps<SelectOption>): ReactNode {
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
*/

/*function useBasemapItem(layer: Layer | undefined) {
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
                        <Tooltip content={notAvailableLabel} placement="right" openDelay={500}>
                            <span>
                                <FiAlertTriangle color={"red"} aria-label={notAvailableLabel} />
                            </span>
                        </Tooltip>
                    </Box>
                )}
            </Flex>
        )
    };
}*/

/**
 * Customizes components styles within the select component.
 */
/*function useChakraStyles() {
    const [dropDownBackground, borderColor] = useToken("colors", ["bg", "border"]);
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
}*/
