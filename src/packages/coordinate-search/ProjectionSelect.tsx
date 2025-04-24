// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { createListCollection, Portal, Select, VisuallyHidden } from "@chakra-ui/react";
import { memo, useMemo } from "react";
import { ProjectionItem } from "./CoordinateInput";
import { useIntl } from "open-pioneer:react-hooks";

export const ProjectionSelect = memo(function ProjectionSelect(props: {
    currentProjection: ProjectionItem;
    projections: ProjectionItem[];
    onProjectionChange: (proj: ProjectionItem) => void;
}) {
    const { currentProjection, projections, onProjectionChange } = props;
    const intl = useIntl();

    const projectionsCollection = useMemo(() => {
        return createListCollection({
            items: projections,
            isItemDisabled: () => false,
            itemToString: (p) => p.label,
            itemToValue: projectionCode
        });
    }, [projections]);

    return (
        <Select.Root
            className="coordinate-input-select-root"
            width="14em"
            collection={projectionsCollection}
            value={[projectionCode(currentProjection)]}
            onValueChange={(value) => {
                const projection = value.items[0];
                if (projection) {
                    onProjectionChange(projection);
                }
            }}
            lazyMount={true}
            unmountOnExit={true}
        >
            <Select.Control className="coordinate-input-select">
                <VisuallyHidden asChild>
                    <Select.Label>
                        {intl.formatMessage({ id: "projections.ariaLabel" })}
                    </Select.Label>
                </VisuallyHidden>
                <Select.Trigger
                    className="coordinate-input-select-trigger"
                    borderLeftRadius={0}
                    background="colorPalette.solid"
                    color="colorPalette.contrast"
                    focusVisibleRing="outside"
                >
                    <Select.ValueText className="coordinate-input-select-value" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                    <Select.Indicator color="colorPalette.contrast" />
                </Select.IndicatorGroup>
            </Select.Control>

            <Portal>
                <Select.Positioner>
                    <Select.Content className="coordinate-input-select-content">
                        {projectionsCollection.items.map((item) => (
                            <Select.Item
                                className="coordinate-input-select-item"
                                item={item}
                                key={projectionCode(item)}
                                _highlighted={{
                                    background: "colorPalette.muted"
                                }}
                            >
                                {item.label}
                            </Select.Item>
                        ))}
                    </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    );

    // TODO
    // - return props.label + " " + intl.formatMessage({ id: "selected" });
});

function projectionCode(item: ProjectionItem) {
    return item.value.getCode();
}
