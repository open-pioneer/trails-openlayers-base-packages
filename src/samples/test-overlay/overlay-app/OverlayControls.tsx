// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Checkbox, Flex, Link, Span, Text } from "@chakra-ui/react";
import { useMapModelValue } from "@open-pioneer/map";
import { useEvent } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { ReactNode, useEffect, useState } from "react";
import { createDynamicOverlay } from "./examples/createDynamicOverlay";
import { createMouseFollowingOverlay } from "./examples/createMouseFollowingOverlay";
import { createMovingOverlay, MovingOverlay } from "./examples/createMovingOverlay";
import { createSelfUpdatingOverlay } from "./examples/createSelfUpdatingOverlay";
import { createStaticOverlay } from "./examples/createStaticOverlay";

export function OverlayControls() {
    return (
        <Flex direction="column" gap={3} minWidth="220px">
            <StaticOverlayControl />
            <SelfUpdatingOverlayControl />
            <DynamicOverlayControl />
            <MouseFollowingOverlayControl />
            <MovableOverlayControl />
        </Flex>
    );
}

function StaticOverlayControl() {
    const map = useMapModelValue();
    const [enabled, setEnabled] = useState(true);
    useEffect(() => {
        if (enabled) {
            const overlay = createStaticOverlay(map);
            return () => overlay.destroy();
        }
    }, [map, enabled]);

    return (
        <OverlayControlItem
            label="Static overlay"
            description="A fixed overlay positioned at a geographic coordinate."
            checked={enabled}
            onCheckedChange={setEnabled}
        />
    );
}

function SelfUpdatingOverlayControl() {
    const map = useMapModelValue();
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        if (enabled) {
            const overlay = createSelfUpdatingOverlay(map);
            return () => overlay.destroy();
        }
    }, [map, enabled]);

    return (
        <OverlayControlItem
            label="Self-updating overlay"
            description="A fixed overlay that updates itself internally."
            checked={enabled}
            onCheckedChange={setEnabled}
        />
    );
}

function DynamicOverlayControl() {
    const map = useMapModelValue();
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        if (enabled) {
            const { overlay, update } = createDynamicOverlay(map);
            const timer = setInterval(() => {
                update();
            }, 1000);

            return () => {
                clearTimeout(timer);
                overlay.destroy();
            };
        }
    }, [map, enabled]);

    return (
        <OverlayControlItem
            label="Dynamic overlay"
            description="A dynamic overlay that replaces its own content on a timer."
            checked={enabled}
            onCheckedChange={setEnabled}
        />
    );
}

function MouseFollowingOverlayControl() {
    const map = useMapModelValue();
    const [enabled, setEnabled] = useState(false);
    useEffect(() => {
        if (enabled) {
            const overlay = createMouseFollowingOverlay(map);
            return () => overlay.destroy();
        }
    }, [map, enabled]);

    return (
        <OverlayControlItem
            label="Mouse following overlay"
            description="An overlay that follows the mouse."
            checked={enabled}
            onCheckedChange={setEnabled}
        />
    );
}

function MovableOverlayControl() {
    const map = useMapModelValue();

    const [movingOverlay, setMovingOverlay] = useState<MovingOverlay>();
    const checked = useReactiveSnapshot(
        () => movingOverlay?.overlay.isDestroyed === false,
        [movingOverlay]
    );
    const setChecked = useEvent((newChecked: boolean) => {
        if (newChecked) {
            movingOverlay?.overlay.destroy();
            setMovingOverlay(createMovingOverlay(map));
        } else {
            movingOverlay?.overlay.destroy();
            setMovingOverlay(undefined);
        }
    });

    const buttons = [
        ["left", -500],
        ["right", 500]
    ] as const;
    const controlButtons = buttons.map(([label, offsetX]) => {
        return (
            <Link
                key={label}
                role="button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    movingOverlay?.updatePosition(offsetX);
                }}
            >
                {label}
            </Link>
        );
    });
    const controls = checked && (
        <Span
            css={{
                display: "inline-flex",
                gap: "0.5em",
                paddingInline: "1"
            }}
        >
            {" "}
            {controlButtons}
        </Span>
    );

    return (
        <OverlayControlItem
            label={<>Movable overlay {controls}</>}
            description="An overlay that can re-position itself."
            checked={checked}
            onCheckedChange={setChecked}
        />
    );
}

interface OverlayControlItemProps {
    label: ReactNode;
    description: ReactNode;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}

function OverlayControlItem({
    label,
    description,
    checked,
    onCheckedChange
}: OverlayControlItemProps) {
    return (
        <Checkbox.Root
            checked={checked}
            onCheckedChange={(e) => onCheckedChange(!!e.checked)}
            alignItems="baseline"
            gap={2}
        >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
                <Checkbox.Indicator />
            </Checkbox.Control>
            <Box>
                <Checkbox.Label fontSize="md" lineHeight="short">
                    {label}
                </Checkbox.Label>
                <Text fontSize="sm" color="fg.muted" mt="0.5">
                    {description}
                </Text>
            </Box>
        </Checkbox.Root>
    );
}
