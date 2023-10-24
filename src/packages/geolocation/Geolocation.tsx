// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { Button, Tooltip } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useMapModel } from "@open-pioneer/map";
import { unByKey } from "ol/Observable";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, forwardRef, RefAttributes, useEffect, useState } from "react";
import { MdLocationOn, MdLocationOff } from "react-icons/md";
import { GeolocationController } from "./GeolocationController";
import { useService } from "open-pioneer:react-hooks";
import { StyleLike } from "ol/style/Style";

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
}

export const Geolocation: FC<GeolocationProps> = forwardRef(function Geolocation(
    props: GeolocationProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const logger = createLogger("ol-geolocation:" + Geolocation.name);

    const { mapId, positionFeatureStyle, accuracyFeatureStyle } = props;
    const { containerProps } = useCommonComponentProps("geolocation", props);

    const [isActive, setActive] = useState<boolean>(false);
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
            accuracyFeatureStyle
        );
        setController(geolocationController);

        return () => {
            geolocationController.destroy();
            setController(undefined);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

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
            return;
        }
        if (isActive) controller?.startGeolocation(map.olMap);
        return () => {
            controller?.stopGeolocation(map.olMap);
        };
    }, [controller, map, isActive]);

    const toggleActiveState = () => {
        if (!map) {
            return;
        }
        setActive(!isActive);
    };

    return (
        <Tooltip
            label={intl.formatMessage({ id: "buttonTooltip" })}
            placement="auto"
            openDelay={500}
        >
            {/*todo is the disabling working with screen reader?*/}
            <Button
                className="geolocation-toggle-button"
                aria-label={
                    isActive
                        ? intl.formatMessage({ id: "locateMeStart" })
                        : intl.formatMessage({ id: "locateMeEnd" })
                }
                leftIcon={isActive ? <MdLocationOff /> : <MdLocationOn />}
                onClick={() => toggleActiveState()}
                iconSpacing={0}
                padding={0}
                ref={ref}
                isDisabled={!navigator.geolocation} // show button only, if geolocation is supported by web browser / device
                {...containerProps}
            />
        </Tooltip>
    );
});
