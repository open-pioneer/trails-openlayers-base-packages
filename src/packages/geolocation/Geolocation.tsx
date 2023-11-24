// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { MapModel, useMapModel } from "@open-pioneer/map";
import {
    CommonComponentProps,
    ToolButton,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { StyleLike } from "ol/style/Style";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, RefAttributes, forwardRef, useEffect, useState } from "react";
import { MdMyLocation } from "react-icons/md";
import { GeolocationController } from "./GeolocationController";

// TODO: Workaround for https://github.com/open-pioneer/trails-build-tools/issues/47
import {} from "@open-pioneer/notifier";

/**
 * These are properties supported by the {@link Geolocation} component.
 */
export interface GeolocationProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The id of the map.
     */
    mapId: string;
    /**
     * The default maximal zoom level
     */
    maxZoom?: number;
    /**
     * Style to be applied for the positioning highlight feature.
     */
    positionFeatureStyle?: StyleLike;
    /**
     * Style to be applied for the accuracy highlight of the positioning feature.
     */
    accuracyFeatureStyle?: StyleLike;
    /**
     * Position options for the Geolocation-Object.
     * See [PositionOptions](https://www.w3.org/TR/geolocation/#position_options_interface) for more details.
     *
     * NOTE: Changing the tracking options at runtime will reset the component's state.
     */
    trackingOptions?: PositionOptions;
}

export const Geolocation: FC<GeolocationProps> = forwardRef(function Geolocation(
    props: GeolocationProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const { mapId, maxZoom, positionFeatureStyle, accuracyFeatureStyle, trackingOptions } = props;
    const { containerProps } = useCommonComponentProps("geolocation", props);

    const supportsGeolocation = !!navigator.geolocation;
    const [isActive, setActive] = useState<boolean>(false);
    const [isLoading, setLoading] = useState<boolean>(false);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    const [label, setLabel] = useState<string>(
        !supportsGeolocation
            ? intl.formatMessage({ id: "locateNotSupported" })
            : intl.formatMessage({ id: "locateMeStart" })
    );

    const notificationService = useService("notifier.NotificationService");

    const controller = useController(
        map,
        maxZoom,
        trackingOptions,
        positionFeatureStyle,
        accuracyFeatureStyle
    );

    useEffect(() => {
        if (controller === undefined) {
            return;
        }

        const eventsKey = controller.on("error", function (error) {
            const title = intl.formatMessage({ id: "error" });
            const description = (() => {
                switch (error) {
                    case "permission-denied":
                        return intl.formatMessage({ id: "permissionDenied" });
                    case "position-unavailable":
                        return intl.formatMessage({ id: "positionUnavailable" });
                    case "timeout":
                        return intl.formatMessage({ id: "timeout" });
                    case "unknown":
                        return intl.formatMessage({ id: "unknownError" });
                }
            })();

            setLoading(false);
            setActive(false);

            notificationService.notify({
                level: "error",
                title: title,
                message: description
            });
        });
        return () => {
            eventsKey.destroy();
        };
    }, [controller, intl, notificationService]);

    useEffect(() => {
        if (!controller) {
            setLoading(false);
            return;
        }
        if (isActive) {
            setLoading(true);
            controller.startGeolocation().then(() => {
                setLoading(false);
            });
        }
        return () => {
            controller?.stopGeolocation();
            setLoading(false);
        };
    }, [controller, isActive]);

    useEffect(() => {
        if (!supportsGeolocation) {
            setLabel(intl.formatMessage({ id: "locateNotSupported" }));
        } else {
            if (isActive) {
                setLabel(intl.formatMessage({ id: "locateMeEnd" }));
            } else {
                setLabel(intl.formatMessage({ id: "locateMeStart" }));
            }
        }
    }, [intl, isActive, supportsGeolocation]);

    const toggleActiveState = () => {
        if (!map) {
            return;
        }
        setActive(!isActive);
    };

    return (
        <ToolButton
            ref={ref}
            label={label}
            icon={<MdMyLocation />}
            onClick={() => toggleActiveState()}
            isActive={isActive}
            isLoading={isLoading}
            isDisabled={!supportsGeolocation}
            {...containerProps}
        />
    );
});

function useController(
    map: MapModel | undefined,
    maxZoom: number | undefined,
    trackingOptions: PositionOptions | undefined,
    positionFeatureStyle: StyleLike | undefined,
    accuracyFeatureStyle: StyleLike | undefined
): GeolocationController | undefined {
    const [controller, setController] = useState<GeolocationController>();
    useEffect(() => {
        if (!map) {
            return;
        }
        const geolocationController = new GeolocationController(
            map.olMap,
            maxZoom,
            trackingOptions
        );
        setController(geolocationController);

        return () => {
            geolocationController.destroy();
            setController(undefined);
        };
    }, [map, maxZoom, trackingOptions]);
    useEffect(() => {
        controller?.setPositionFeatureStyle(positionFeatureStyle);
    }, [controller, positionFeatureStyle]);
    useEffect(() => {
        controller?.setAccuracyFeatureStyle(accuracyFeatureStyle);
    }, [controller, accuracyFeatureStyle]);
    useEffect(() => {
        controller?.setMaxZoom(maxZoom);
    }, [controller, maxZoom]);
    return controller;
}
