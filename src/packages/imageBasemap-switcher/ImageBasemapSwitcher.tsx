// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    Box,
    Button,
    Flex,
    Menu,
    MenuButton,
    MenuList,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { Image, MenuItem } from "@chakra-ui/react";
import { Layer, MapModel, useMapModel } from "@open-pioneer/map";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";

import defaultImage from "./assets/map_699730.png"; // https://de.freepik.com/icon/karte_699730#fromView=search&page=1&position=9&uuid=affc743f-cf4c-4469-8919-f587e95295db
import emptyImage from "./assets/cancel_4968337.png"; // https://de.freepik.com/icon/stornieren_4968337#fromView=search&page=1&position=13&uuid=8105ed6b-5f5a-41e2-b0df-392a9013a711

const NO_BASEMAP_ID = "___NO_BASEMAP___";

export interface ImageLabelSwitchObject {
    image: string;
    label: string;
    callBack: () => void;
}

export interface BaselayerImageBasemapSwitcherProps {
    image: string;
    label: string;
}

/**
 * These are special properties for the BasemapSwitcher.
 */
export interface ImageBasemapSwitcherProps extends CommonComponentProps {
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
     * Optional map of images and labels to the specific basemaps layers.
     * Alternatively, the image and label can be set in the layer attributes.
     * If no images are set, the default image will be used.
     */
    imageMap?: Map<string, BaselayerImageBasemapSwitcherProps>;

    /**
     * Optional filter to exclude basemaps from the switcher.
     */
    excludeBasemapWithIdFilter?: string[];
}

/**
 * The `BasemapSwitcher` component can be used in an app to switch between the different basemaps.
 */
export const ImageBasemapSwitcher: FC<ImageBasemapSwitcherProps> = (props) => {
    const intl = useIntl();
    const {
        mapId,
        allowSelectingEmptyBasemap = false,
        imageMap,
        excludeBasemapWithIdFilter
    } = props;
    const { containerProps } = useCommonComponentProps("image-basemap-switcher", props);
    const emptyBasemapLabel = intl.formatMessage({ id: "emptyBasemapLabel" });

    const { map } = useMapModel(mapId);
    const baseLayers = useBaseLayers(map);

    const setImageLabelObject = useCallback(
        (selectedLayer: Layer | undefined) => {
            const activateLayer = (layerId: string) => {
                map?.layers.activateBaseLayer(layerId === NO_BASEMAP_ID ? undefined : layerId);
            };

            const basemap = selectedLayer?.attributes
                ?.imageBasemapSwitcher as BaselayerImageBasemapSwitcherProps;
            const parameter = imageMap?.get(selectedLayer?.id || NO_BASEMAP_ID);
            const image =
                basemap?.image || parameter?.image || (!selectedLayer ? emptyImage : defaultImage);
            const label =
                basemap?.label ||
                parameter?.label ||
                selectedLayer?.title ||
                (!selectedLayer ? emptyBasemapLabel : "basemap");

            return {
                image: image,
                label: label,
                callBack: () => activateLayer(selectedLayer?.id || NO_BASEMAP_ID)
            };
        },
        [emptyBasemapLabel, imageMap, map?.layers]
    );

    const { selectedImageLabel, choosableImageLabel } = useMemo(() => {
        const activeBaseLayer = map?.layers.getActiveBaseLayer();
        const selectedLayer = baseLayers.find((l) => l === activeBaseLayer);

        const selectedImageLabel = setImageLabelObject(selectedLayer);

        const choosableImageLabel = [] as ImageLabelSwitchObject[];
        baseLayers.forEach((layer) => {
            if (
                excludeBasemapWithIdFilter &&
                !excludeBasemapWithIdFilter.includes(layer.id || "")
            ) {
                return;
            }
            choosableImageLabel.push(setImageLabelObject(layer));
        });
        if (allowSelectingEmptyBasemap) {
            choosableImageLabel.push(setImageLabelObject(undefined));
        }

        return { selectedImageLabel, choosableImageLabel };
    }, [
        map?.layers,
        baseLayers,
        setImageLabelObject,
        allowSelectingEmptyBasemap,
        excludeBasemapWithIdFilter
    ]);

    return (
        <Box {...containerProps}>
            {
                <Menu>
                    <Flex>
                        <Tooltip label={selectedImageLabel?.label}>
                            <MenuButton as={Button} className={"image-basemap-front-image"}>
                                <Image width={"40px"} src={selectedImageLabel?.image}></Image>
                            </MenuButton>
                        </Tooltip>
                    </Flex>
                    <MenuList display={"contents"} overflowY={"auto"}>
                        {choosableImageLabel.map((imageLabel, index) => {
                            return (
                                <BasemapOnMapSwitcherElement
                                    key={imageLabel.label + index}
                                    src={imageLabel.image}
                                    label={imageLabel.label}
                                    callback={imageLabel.callBack}
                                />
                            );
                        })}
                    </MenuList>
                </Menu>
            }
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

interface BasemapOnMapSwitcherElementProps {
    src: string;
    label: string;
    callback: () => void;
    width?: string;
    height?: string;
}

export function BasemapOnMapSwitcherElement(props: BasemapOnMapSwitcherElementProps) {
    const { src, label, callback, width, height } = props;
    return (
        <MenuItem onClick={() => callback()}>
            <Tooltip label={label}>
                <Image src={src} width={width || "60px"} height={height || "40px"}></Image>
            </Tooltip>
        </MenuItem>
    );
}
