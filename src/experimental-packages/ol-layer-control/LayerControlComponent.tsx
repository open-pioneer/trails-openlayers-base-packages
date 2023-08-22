// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import {
    Checkbox,
    ScaleFade,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Tooltip
} from "@open-pioneer/chakra-integration";
import { MapModel, useMapModel } from "@open-pioneer/ol-map";
import Layer from "ol/layer/Layer";
import { unByKey } from "ol/Observable";
import { useIntl } from "open-pioneer:react-hooks";
import { useEffect, useMemo, useState } from "react";
import { useTimeout } from "react-use";

export interface LayerControlProps {
    /**
     * The id of the map.
     */
    mapId: string;

    /**
     * Sets visibility of opacity slider
     */
    showOpacitySlider?: boolean;
}

export function LayerControlComponent(props: LayerControlProps) {
    const intl = useIntl();
    const { loading, error, map } = useMapModel(props.mapId);
    const layers = useMemo(() => map?.olMap.getAllLayers().reverse() ?? [], [map]); // TODO: Does not react to layer changes

    // Small timeout before "Loading..." to optimize for the common case where the map
    // is available almost immediately. This prevents some flickering in the UI.
    const [hasTimeoutElapsed] = useTimeout(100);
    const fadeIn = !loading || hasTimeoutElapsed() || false;
    return (
        <ScaleFade in={fadeIn}>
            {loading ? (
                <div>{intl.formatMessage({ id: "loading" })}</div>
            ) : error ? (
                <div>
                    {intl.formatMessage({ id: "error" })} {error.message}
                </div>
            ) : (
                <div>
                    {layers.map((layer, i) => (
                        <div key={i} className="layer-entry">
                            <LayerVisibilityTogglerComponent
                                map={map!}
                                layer={layer}
                            ></LayerVisibilityTogglerComponent>
                            {props.showOpacitySlider && (
                                <LayerOpacitySliderComponent
                                    layer={layer}
                                ></LayerOpacitySliderComponent>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </ScaleFade>
    );
}

function LayerVisibilityTogglerComponent(props: { map: MapModel; layer: Layer }) {
    const intl = useIntl();
    const [visibility, setVisibility] = useState<boolean>(props.layer.getVisible());
    const title =
        props.map.layers.getLayerByRawInstance(props.layer)?.title ??
        intl.formatMessage({ id: "undefined-layer-title" });

    const changeVisibility = () => {
        setVisibility(!visibility);
        props.layer.setVisible(!visibility);
    };

    return (
        <Checkbox
            className="layer-select"
            size="lg"
            isChecked={visibility}
            onChange={changeVisibility}
        >
            {title}
        </Checkbox>
    );
}

function LayerOpacitySliderComponent(props: { layer: Layer }) {
    const [sliderValue, setSliderValue] = useState(props.layer.getOpacity() * 100);
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        const opacityChangeListener = props.layer.on("change:opacity", () => {
            const opacity = props.layer.getOpacity() * 100;
            if (opacity !== sliderValue) {
                setSliderValue(Math.round(opacity));
            }
        });
        return () => unByKey(opacityChangeListener);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Slider
            id="slider"
            value={sliderValue}
            min={0}
            max={100}
            colorScheme="teal"
            onChange={(v) => props.layer.setOpacity(v / 100)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <SliderTrack>
                <SliderFilledTrack />
            </SliderTrack>
            <Tooltip
                hasArrow
                bg="teal.500"
                color="white"
                placement="top"
                isOpen={showTooltip}
                label={`${sliderValue}%`}
            >
                <SliderThumb bg="teal.500"></SliderThumb>
            </Tooltip>
        </Slider>
    );
}
