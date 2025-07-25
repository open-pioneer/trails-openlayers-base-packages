// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Icon, Menu, Portal } from "@chakra-ui/react";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { FC, useMemo } from "react";
import { LuChevronDown } from "react-icons/lu";

const DEFAULT_SCALES = [
    17471320, 8735660, 4367830, 2183915, 1091957, 545978, 272989, 136494, 68247, 34123, 17061, 8530,
    4265, 2132
];

/**
 * These are the properties supported by the {@link ScaleSetter}.
 */
export interface ScaleSetterProps extends CommonComponentProps, MapModelProps {
    /**
     * The set of scales that can be selected by the user.
     */
    scales?: number[];
}

/**
 * Displays the current scale and allows the user to change it.
 */
export const ScaleSetter: FC<ScaleSetterProps> = (props) => {
    const { scales = DEFAULT_SCALES } = props;
    const { containerProps } = useCommonComponentProps("scale-setter", props);
    const { map } = useMapModel(props);
    const intl = useIntl();

    const scaleSelectOptions = useMemo(
        () =>
            scales.map((scaleValue) => {
                return (
                    <Menu.Item
                        className="scale-setter-option"
                        aria-label={intl.formatMessage(
                            {
                                id: "option.ariaLabel"
                            },
                            { scale: scaleValue }
                        )}
                        value={String(scaleValue)}
                        key={scaleValue}
                        onClick={() => map?.setScale(scaleValue)}
                        onFocus={(e) => {
                            // Not available in unit tests
                            e.target?.scrollIntoView?.({
                                block: "nearest"
                            });
                        }}
                    >
                        {renderScaleText(intl, scaleValue)}
                    </Menu.Item>
                );
            }),
        [intl, map, scales]
    );

    const activeScale = useReactiveSnapshot(() => map?.scale ?? 1, [map]);
    return (
        <Box {...containerProps}>
            <Menu.Root>
                <Menu.Trigger asChild>
                    <Button
                        className="scale-setter-menubutton"
                        aria-label={intl.formatMessage(
                            {
                                id: "button.ariaLabel"
                            },
                            {
                                scale: activeScale
                            }
                        )}
                        aria-description={intl.formatMessage({
                            id: "button.ariaDescription"
                        })}
                    >
                        {renderScaleText(intl, activeScale)}
                        <Icon>
                            <LuChevronDown />
                        </Icon>
                    </Button>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content
                            className="scale-setter-menuoptions"
                            maxHeight="20em"
                            overflowY="auto"
                        >
                            {scaleSelectOptions}
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
        </Box>
    );
};

function renderScaleText(intl: PackageIntl, rawScale: number): string {
    return "1 : " + intl.formatNumber(rawScale);
}
