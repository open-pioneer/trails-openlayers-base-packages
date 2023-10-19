// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import { createLogger } from "@open-pioneer/core";
import { Button, Flex, useToast, VisuallyHidden } from "@open-pioneer/chakra-integration";
import { CommonComponentProps } from "@open-pioneer/react-utils";
import { useMapModel } from "@open-pioneer/map";
import Geolocation from "ol/Geolocation";
import { unByKey } from "ol/Observable";
import { Coordinate } from "ol/coordinate";
import { Projection } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useEffect, useState } from "react";
import { MdLocationOn } from "react-icons/md";

// TODO: adding / remove marker

/**
 * These are special properties for the BasemapSwitcher.
 */
export interface GeolocationProps extends CommonComponentProps {
    /**
     * The id of the map.
     */
    mapId: string;
}

export const GeolocationC: FC<GeolocationProps> = (props) => {
    const logger = createLogger("ol-geolocation:" + Geolocation.name);

    const { mapId, ...rest } = props;

    const [isActive, setActive] = useState<boolean>(false);

    const { map } = useMapModel(mapId);
    const intl = useIntl();

    // This is not 100% correct because we only ever use the initial projection value, which is likely to be undefined if
    // the map is not ready yet. In a real application we should listen to changes on the view's projection (e.g. openlayers "on(...)").
    // Changes to "isActive" are correctly applied however, because isActive is a state value and state changes always trigger a rerender.
    const timeout = 30000;
    const geolocation = useGeolocation(map?.olMap.getView()?.getProjection(), timeout, isActive);
    const position = useCurrentPosition(geolocation);
    useEffect(() => {
        /**
         * Center map to position whenever map or position changes.
         * If one or the other is not present, do nothing.
         */
        if (map && position) {
            logger.debug("Set center:", position);
            map.olMap.getView().setCenter(position);
        }
    }, [logger, map, position]);

    /**
     * toggle active state
     */
    const toggle = () => {
        logger.debug("Set isActive:", !isActive);
        setActive(!isActive); // change to isActive is handled in `useGeolocation`
    };

    /**
     * show button only, if geolocation is supported by web browser / device
     */
    if (navigator.geolocation) {
        return (
            <Flex direction={"column"} gap="1" {...rest}>
                <Button
                    className="initial-extent-button"
                    aria-label={intl.formatMessage({ id: "LOCATE_ME" })}
                    leftIcon={<MdLocationOn />}
                    onClick={() => toggle()}
                    iconSpacing={0}
                    padding={0}
                />
            </Flex>
        );
    } else {
        return (
            <div {...rest}>
                <VisuallyHidden>
                    {intl.formatMessage({ id: "LOCATE_NOT_SUPPORTED" })}
                </VisuallyHidden>
            </div>
        );
    }
};

/**
 * Manages and exposes a Geolocation object.
 */
function useGeolocation(
    projection: Projection | undefined,
    timeout: number,
    tracking: boolean
): Geolocation | undefined {
    const logger = createLogger("ol-geolocation:" + useGeolocation.name);

    const [geolocation, setGeolocation] = useState<Geolocation>();

    useEffect(() => {
        /**
         * OpenLayers Geolocation
         * https://openlayers.org/en/latest/apidoc/module-ol_Geolocation-Geolocation.html
         */

        // Init
        logger.debug("Init geolocation");
        const location = new Geolocation({
            tracking,
            trackingOptions: {
                enableHighAccuracy: true,
                timeout,
                maximumAge: 2000
            },
            projection
        });
        setGeolocation(location);

        // Destroy
        return () => {
            logger.debug("Destroy geolocation");
            setGeolocation(undefined);
            location.dispose();
        };
        // Initial values are applied here, granular prop changes are applied below
        // without creating a new instance.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        logger.debug("Applying timeout:", timeout);
        if (geolocation instanceof Geolocation) {
            geolocation?.setTrackingOptions({
                // No idea whether passing existing options is needed here
                ...geolocation.getTrackingOptions(),
                timeout
            });
        }
    }, [logger, geolocation, timeout]);

    useEffect(() => {
        logger.debug("Applying projection:", projection);
        geolocation?.setProjection(projection);
    }, [logger, geolocation, projection]);

    useEffect(() => {
        logger.debug("Applying tracking:", tracking);
        geolocation?.setTracking(tracking);
    }, [logger, geolocation, tracking]);
    return geolocation;
}

/**
 * Returns the current position (if tracking is active) or undefined.
 *
 * Also shows a toast if an error is encountered.
 */
function useCurrentPosition(geolocation: Geolocation | undefined): Coordinate | undefined {
    const logger = createLogger("ol-geolocation:" + useCurrentPosition.name);

    const intl = useIntl(); // could also accept this as a function parameter; doesn't matter much here.
    const toast = useToast();
    const [position, setPosition] = useState<Coordinate>();

    // Watch for changes by registering an event handler.
    // Calling setPosition from the event handler will automatically trigger rerenders etc, so the calling
    // component will receive the up-to-date position.
    // Don't forget to unregister event handlers, otherwise we might leak!
    useEffect(() => {
        if (!geolocation) {
            return;
        }

        // Apply initial position.
        const position = geolocation.getTracking() ? geolocation.getPosition() : undefined;
        logger.debug("Update position:", position);
        setPosition(position);

        // Apply position updates.
        const eventsKey = geolocation.on("change", () => {
            const position = geolocation.getTracking() ? geolocation.getPosition() : undefined;
            logger.debug("Update position:", position);
            setPosition(position);
        });
        return () => unByKey(eventsKey);
    }, [logger, geolocation]);

    // Watch for errors.
    useEffect(() => {
        if (!geolocation) {
            return;
        }

        /**
         * Geolocation API
         * https://www.w3.org/TR/geolocation/#webidl-1281871320
         */
        const eventsKey = geolocation.on("error", function (evt) {
            const title = intl.formatMessage({ id: "ERROR" });
            let description = "";

            switch (evt.code) {
                case 1:
                    description = intl.formatMessage({ id: "PERMISSION_DENIED" });
                    break;
                case 2:
                    description = intl.formatMessage({ id: "POSITION_UNAVAILABLE" });
                    break;
                case 3:
                    description = intl.formatMessage({ id: "TIMEOUT" });
                    break;
                default:
                    description = intl.formatMessage({ id: "UNKNOWN_ERROR" });
                    break;
            }

            logger.debug("Error:", evt.message);

            toast({
                title,
                description,
                status: "error",
                duration: 5000,
                position: "bottom",
                isClosable: false
            });
        });
        () => unByKey(eventsKey);
    }, [logger, geolocation, intl, toast]);

    return position;
}
