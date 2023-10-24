// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { Button, Flex, VisuallyHidden, Tooltip } from "@open-pioneer/chakra-integration";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useMapModel } from "@open-pioneer/map";
import { unByKey } from "ol/Observable";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, ForwardedRef, forwardRef, RefAttributes, useEffect, useState } from "react";
import { MdLocationOn, MdLocationOff } from "react-icons/md";
import { GeolocationController } from "./GeolocationController";
import { useService } from "open-pioneer:react-hooks";

/**
 * These are special properties for the Geolocation.
 */
export interface GeolocationProps extends CommonComponentProps, RefAttributes<HTMLButtonElement> {
    /**
     * The id of the map.
     */
    mapId: string;
}

export const Geolocation: FC<GeolocationProps> = forwardRef(function Geolocation(
    props: GeolocationProps,
    ref: ForwardedRef<HTMLButtonElement>
) {
    const logger = createLogger("ol-geolocation:" + Geolocation.name);

    const { mapId, ...rest } = props;
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
        const geolocationController = new GeolocationController(map.olMap);
        setController(geolocationController);

        return () => {
            geolocationController.destroy();
            setController(undefined);
        };
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

    // show button only, if geolocation is supported by web browser / device
    if (navigator.geolocation) {
        // todo: Was soll gerendert werden, wenn die Karte noch nicht da ist?
        return (
            <Flex direction={"column"} gap="1" {...rest}>
                <Tooltip
                    label={intl.formatMessage({ id: "buttonTooltip" })}
                    placement="auto"
                    openDelay={500}
                >
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
                        {...containerProps}
                    />
                </Tooltip>
            </Flex>
        );
    } else {
        // todo: so oder z.B. Log oder Button disabled
        return (
            <div {...rest}>
                <VisuallyHidden>{intl.formatMessage({ id: "locateNotSupported" })}</VisuallyHidden>
            </div>
        );
    }
});
