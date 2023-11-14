// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import {
    CommonComponentProps,
    ToolButton,
    useCommonComponentProps
} from "@open-pioneer/react-utils";
import { useMapModel } from "@open-pioneer/map";
import { unByKey } from "ol/Observable";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, forwardRef, RefAttributes, useEffect, useState } from "react";
import { MdLocationOn } from "react-icons/md";
import { GeolocationController } from "./GeolocationController";
import { useService } from "open-pioneer:react-hooks";
import { StyleLike } from "ol/style/Style";

// TODO: Workaround for https://github.com/open-pioneer/trails-build-tools/issues/47
import {} from "@open-pioneer/notifier";

/**
 * Todo: Testen auf mobilen Geräten
 */

/**
 * These are special properties for the Geolocation.
 */
export interface GeolocationProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The id of the map.
     */
    mapId: string;
    /**
     * Style to be applied for the positioning highlight feature.
     * Changing style during runtime is not supported.
     */
    positionFeatureStyle?: StyleLike;
    /**
     * Style to be applied for the accuracy highlight of the positioning feature.
     * Changing style during runtime is not supported.
     */
    accuracyFeatureStyle?: StyleLike;
    /**
     * Position options for the Geolocation-Object.
     * See [PositionOptions](https://www.w3.org/TR/geolocation/#position_options_interface) for more details.
     */
    trackingOptions?: PositionOptions;
}

export const Geolocation: FC<GeolocationProps> = forwardRef(function Geolocation(
    props: GeolocationProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const logger = createLogger("ol-geolocation:" + Geolocation.name);

    const { mapId, positionFeatureStyle, accuracyFeatureStyle, trackingOptions } = props;
    const { containerProps } = useCommonComponentProps("geolocation", props);

    const supportsGeolocation = !!navigator.geolocation;
    const [isActive, setActive] = useState<boolean>(false);
    const [isLoading, setLoading] = useState<boolean>(false);
    const { map } = useMapModel(mapId);
    const intl = useIntl();

    const notificationService = useService("notifier.NotificationService");

    const [controller, setController] = useState<GeolocationController>();

    useEffect(() => {
        if (!map) {
            return;
        }
        const geolocationController = new GeolocationController(
            map.olMap,
            positionFeatureStyle,
            accuracyFeatureStyle,
            trackingOptions
        );
        setController(geolocationController);

        return () => {
            geolocationController.destroy();
            setController(undefined);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    /**
     * Move GeolocationController.tsx
     */
    useEffect(() => {
        if (controller === undefined) {
            return;
        }

        const geolocation = controller.getGeolocation();
        const eventsKey = geolocation.on("error", function (evt) {
            const title = intl.formatMessage({ id: "error" });
            let description = "";

            switch (evt.code) {
                case 1:
                    description = intl.formatMessage({ id: "permissionDenied" });
                    break;
                case 2:
                    description = intl.formatMessage({ id: "positionUnavailable" });
                    break;
                case 3:
                    description = intl.formatMessage({ id: "timeout" });
                    break;
                default:
                    description = intl.formatMessage({ id: "unknownError" });
                    break;
            }

            setLoading(false);
            setActive(false);

            logger.error("Error from geolocation API:", evt.message);

            notificationService.notify({
                level: "error",
                title: title,
                message: description
            });
        });
        return () => {
            if (eventsKey) unByKey(eventsKey);
        };
    }, [logger, controller, intl, notificationService]);

    useEffect(() => {
        if (!map) {
            setLoading(false);
            return;
        }
        if (isActive) {
            setLoading(true);
            const geolocationPromise: Promise<boolean> | undefined = controller?.startGeolocation(
                map.olMap
            );
            if (geolocationPromise) {
                geolocationPromise.then(() => {
                    setLoading(false);
                });
            }
        }
        return () => {
            controller?.stopGeolocation(map.olMap);
            setLoading(false);
        };
    }, [controller, map, isActive]);

    const toggleActiveState = () => {
        if (!map) {
            return;
        }
        setActive(!isActive);
    };

    return (
        <ToolButton
            ref={ref}
            label={
                isActive
                    ? intl.formatMessage({ id: "locateMeEnd" })
                    : intl.formatMessage({ id: "locateMeStart" })
            }
            icon={
                <MdLocationOn
                    className={isActive ? "toggle-tool-active" : "toggle-tool-inactive"}
                />
            }
            onClick={() => toggleActiveState()}
            isLoading={isLoading}
            isDisabled={!supportsGeolocation}
            {...containerProps}
        />
    );
});
