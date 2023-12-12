// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Tooltip } from "@open-pioneer/chakra-integration";
import { Layer, MapModel, useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { Select, OptionProps, chakraComponents } from "chakra-react-select";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
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
export interface BasemapSwitcherProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;

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
        mapId,
        allowSelectingEmptyBasemap = false,
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy
    } = props;
    const { containerProps } = useCommonComponentProps("basemap-switcher", props);
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const { map } = useMapModel(mapId);
    const baseLayers = useBaseLayers(map);

    const activateLayer = (layerId: string) => {
        map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
    };

    const { options, selectedLayer } = useMemo(() => {
        const options: SelectOption[] = baseLayers.map<SelectOption>((layer) => {
            return { value: layer.id, layer: layer };
        });

        const activeBaseLayer = map?.layers.getActiveBaseLayer();
        if (allowSelectingEmptyBasemap || activeBaseLayer == undefined) {
            const emptyOption: SelectOption = { value: NO_BASEMAP_ID, layer: undefined };
            options.push(emptyOption);
        }

        const selectedLayer = options.filter((l) => l.layer === activeBaseLayer)[0];
        return { options, selectedLayer };
    }, [allowSelectingEmptyBasemap, baseLayers, map?.layers]);

    const components = useMemo(() => {
        return {
            Option: BasemapSelectOption
        };
    }, []);

    return (
        <Box {...containerProps}>
            {map ? (
                <Select<SelectOption>
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    className="basemap-switcher-select"
                    classNamePrefix="react-select"
                    value={selectedLayer}
                    onChange={(option) => option && activateLayer(option.value)}
                    isClearable={false}
                    isSearchable={false}
                    getOptionLabel={(option) =>
                        option.layer !== undefined ? option.layer.title : emptyBasemapLabel
                    }
                    isOptionDisabled={(option) => option?.layer?.loadState === "error"}
                    components={components}
                    options={options}
                />
            ) : null}
        </Box>
    );
};

function useBaseLayers(mapModel: MapModel | undefined): Layer[] {
    // Caches potentially expensive layers arrays.
    // Not sure if this is a good idea, but getSnapshot() should always be fast.
    // If this is a no-go, make getAllLayers() fast instead.
    const baseLayers = useRef<Layer[] | undefined>();
    const subscribe = useCallback(
        (cb: () => void) => {
            // Reset cache when (re-) subscribing
            baseLayers.current = undefined;

            if (!mapModel) {
                return () => undefined;
            }
            const resource = mapModel.layers.on("changed", () => {
                // Reset cache content so getSnapshot() fetches basemaps again.
                baseLayers.current = undefined;
                cb();
            });
            return () => resource.destroy();
        },
        [mapModel]
    );
    const getSnapshot = useCallback(() => {
        if (baseLayers.current) {
            return baseLayers.current;
        }
        return (baseLayers.current = mapModel?.layers.getBaseLayers() ?? []);
    }, [mapModel]);
    return useSyncExternalStore(subscribe, getSnapshot);
}

function BasemapSelectOption(props: OptionProps<SelectOption>): JSX.Element {
    const { layer } = props.data;
    const intl = useIntl();
    const notAvailableLabel = intl.formatMessage({ id: "layerNotAvailable" });
    const label = useTitle(layer);
    const isAvailable = useLoadState(layer) !== "error";

    return (
        <chakraComponents.Option
            {...props}
            isDisabled={!isAvailable}
            className="basemap-switcher-option"
        >
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
        </chakraComponents.Option>
    );
}

function useTitle(layer: Layer | undefined): string {
    const intl = useIntl();
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const getSnapshot = useCallback(() => {
        return layer === undefined ? emptyBasemapLabel : layer.title; // undefined == empty basemap
    }, [layer, emptyBasemapLabel]);
    const subscribe = useCallback(
        (cb: () => void) => {
            if (layer !== undefined) {
                const resource = layer.on("changed:title", cb);
                return () => resource.destroy();
            }
            return () => {};
        },
        [layer]
    );

    return useSyncExternalStore(subscribe, getSnapshot);
}

function useLoadState(layer: Layer | undefined): string {
    const getSnapshot = useCallback(() => {
        return layer === undefined ? "loaded" : layer.loadState; // undefined == empty basemap
    }, [layer]);
    const subscribe = useCallback(
        (cb: () => void) => {
            if (layer !== undefined) {
                const resource = layer.on("changed:loadState", cb);
                return () => resource.destroy();
            }
            return () => {};
        },
        [layer]
    );

    return useSyncExternalStore(subscribe, getSnapshot);
}
