// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ButtonProps } from "@chakra-ui/react";
import { LayerFactory, MapModel, MapModelProps, useMapModelValue } from "@open-pioneer/map";
import { ToolButton } from "@open-pioneer/map-ui-components";
import { NotificationService } from "@open-pioneer/notifier";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { StyleLike } from "ol/style/Style";
import { useIntl, useService } from "open-pioneer:react-hooks";
import { FC, RefAttributes, useEffect, useState } from "react";
import { LuLocateFixed } from "react-icons/lu";
import { GeolocationController, OnErrorCallback } from "./GeolocationController";

/**
 * These are properties supported by the {@link Geolocation} component.
 */
export interface GeolocationProps
    extends CommonComponentProps, RefAttributes<HTMLButtonElement>, MapModelProps {
    /**
     * Additional properties for the `Button` element.
     *
     * Note that the ToolButton also defines some of these props.
     */
    buttonProps?: Partial<ButtonProps>;
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

export const Geolocation: FC<GeolocationProps> = function Geolocation(props: GeolocationProps) {
    const { maxZoom, positionFeatureStyle, accuracyFeatureStyle, trackingOptions, ref } = props;
    const map = useMapModelValue(props);
    const controller = useController(
        map,
        maxZoom,
        trackingOptions,
        positionFeatureStyle,
        accuracyFeatureStyle
    );
    return controller && <GeolocationImpl {...props} controller={controller} ref={ref} />;
};

// This is a separate component so we can act like the controller is always present.
// This is the case in practice (except for the initial loading phase where the component is not-yet-mounted).
const GeolocationImpl = function GeolocationImpl(
    props: GeolocationProps & { controller: GeolocationController }
) {
    const { controller, buttonProps, ref } = props;
    const { containerProps } = useCommonComponentProps("geolocation", props);
    const { isLoading, isActive } = useReactiveSnapshot(() => {
        return {
            isLoading: controller.loading,
            isActive: controller.active
        };
    }, [controller]);

    const intl = useIntl();
    const label = (() => {
        if (!controller.supported) {
            return intl.formatMessage({ id: "locateNotSupported" });
        }

        if (isActive) {
            return intl.formatMessage({ id: "locateMeEnd" });
        } else {
            return intl.formatMessage({ id: "locateMeStart" });
        }
    })();

    const toggleActiveState = () => {
        if (controller.active) {
            controller.stopGeolocation();
        } else {
            controller.startGeolocation();
        }
    };

    return (
        <ToolButton
            ref={ref}
            buttonProps={buttonProps}
            label={label}
            icon={<LuLocateFixed />}
            onClick={() => toggleActiveState()}
            active={isActive}
            loading={isLoading}
            disabled={!controller.supported}
            {...containerProps}
        />
    );
};

function useController(
    map: MapModel,
    maxZoom: number | undefined,
    trackingOptions: PositionOptions | undefined,
    positionFeatureStyle: StyleLike | undefined,
    accuracyFeatureStyle: StyleLike | undefined
): GeolocationController | undefined {
    const intl = useIntl();
    const notificationService = useService<NotificationService>("notifier.NotificationService");
    const layerFactory = useService<LayerFactory>("map.LayerFactory");
    const [controller, setController] = useState<GeolocationController>();
    useEffect(() => {
        const onError: OnErrorCallback = (error) => {
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

            notificationService.notify({
                level: "error",
                title: title,
                message: description
            });
        };

        const geolocationController = new GeolocationController(
            map,
            layerFactory,
            onError,
            trackingOptions
        );
        setController(geolocationController);

        return () => {
            geolocationController.destroy();
            setController(undefined);
        };
    }, [map, trackingOptions, intl, notificationService, layerFactory]);
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
