// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { computed } from "@conterra/reactivity-core";
import { Button, Flex } from "@chakra-ui/react";
import {
    CoordinateInput,
    CoordinateSearch,
    ProjectionInput
} from "@open-pioneer/coordinate-search";
import { NotificationService } from "@open-pioneer/notifier";
import { Coordinate } from "ol/coordinate";
import { Projection } from "ol/proj";
import { useIntl } from "open-pioneer:react-hooks";
import { useState } from "react";
import { Demo, SharedDemoOptions } from "./Demo";
import { DemoDescription } from "./DemoDescription";

const PROJECTIONS: ProjectionInput[] = [
    {
        label: "EPSG:25832",
        value: "EPSG:25832"
    },
    {
        label: "WGS 84",
        value: "EPSG:4326"
    },
    {
        label: "Web Mercator",
        value: "EPSG:3857"
    },
    {
        label: "EPSG:25833",
        value: "EPSG:25833"
    },
    {
        label: "EPSG:31466",
        value: "EPSG:31466"
    },
    {
        label: "EPSG:31467",
        value: "EPSG:31467"
    },
    {
        label: "EPSG:3035",
        value: "EPSG:3035"
    }
];

export function createCoordinateInputDemo({
    currentIntl,
    notificationService
}: SharedDemoOptions): Demo {
    return {
        id: "coordinateInput",
        title: computed(() =>
            currentIntl.value.formatMessage({ id: "demos.coordinateInput.title" })
        ),
        createModel() {
            return {
                description: <DemoDescription messageId="demos.coordinateInput.description" />,
                mainWidget: <CoordinateInputComponent notificationService={notificationService} />
            };
        }
    };
}

function CoordinateInputComponent(props: { notificationService: NotificationService }) {
    const { notificationService } = props;
    const intl = useIntl();
    const [input, setInput] = useState<Coordinate | undefined>();

    function onCoordinateInput(coords: Coordinate, projection: Projection) {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage(
                { id: "demos.coordinateInput.entered" },
                { coordinates: coords.toString(), projection: projection.getCode() }
            ),
            displayDuration: 4000
        });
    }

    function onSearchCleared() {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage({ id: "demos.coordinateSearch.cleared" }),
            displayDuration: 4000
        });
        setInput(undefined);
    }

    return (
        <Flex direction={"column"} gap={10}>
            <CoordinateInput
                input={input}
                placeholder={intl.formatMessage({ id: "demos.coordinateInput.placeholder" })}
                projections={PROJECTIONS}
                onSelect={({ coords, projection }) => onCoordinateInput(coords, projection)}
                onClear={onSearchCleared}
            />
            <Button
                onClick={() => {
                    setInput([761166, 6692084]);
                }}
            >
                {intl.formatMessage({ id: "demos.coordinateInput.setInput" })}
            </Button>
        </Flex>
    );
}

export function createCoordinateSearchDemo({
    currentIntl,
    notificationService
}: SharedDemoOptions): Demo {
    return {
        id: "coordinateSearch",
        title: computed(() =>
            currentIntl.value.formatMessage({ id: "demos.coordinateSearch.title" })
        ),
        createModel() {
            return {
                description: <DemoDescription messageId="demos.coordinateSearch.description" />,
                mainWidget: <CoordinateSearchComponent notificationService={notificationService} />
            };
        }
    };
}

function CoordinateSearchComponent(props: { notificationService: NotificationService }) {
    const { notificationService } = props;
    const intl = useIntl();

    function onCoordinateSearch(coords: Coordinate, projection: Projection) {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage(
                { id: "demos.coordinateSearch.entered" },
                { coordinates: coords.toString(), projection: projection.getCode() }
            ),
            displayDuration: 4000
        });
    }

    function onSearchCleared() {
        notificationService.notify({
            level: "info",
            message: intl.formatMessage({ id: "demos.coordinateSearch.cleared" }),
            displayDuration: 4000
        });
    }

    return (
        <Flex direction={"column"} gap={10}>
            <CoordinateSearch
                projections={PROJECTIONS}
                onSelect={({ coords, projection }) => onCoordinateSearch(coords, projection)}
                onClear={onSearchCleared}
            />
        </Flex>
    );
}
