// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronUpIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Portal
} from "@open-pioneer/chakra-integration";
import { MapModelProps, useMapModel } from "@open-pioneer/map";
import { CommonComponentProps, useCommonComponentProps } from "@open-pioneer/react-utils";
import { useReactiveSnapshot } from "@open-pioneer/reactivity";
import { PackageIntl } from "@open-pioneer/runtime";
import { useIntl } from "open-pioneer:react-hooks";
import { FC } from "react";

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

    const activeScale = useReactiveSnapshot(() => map?.scale ?? 1, [map]);

    const scaleSelectOptions = scales.map((scaleValue) => {
        return (
            <MenuItem
                value={scaleValue}
                key={scaleValue}
                onClick={() => map?.setScale(scaleValue)}
                onFocus={(e) => {
                    // Not available in unit tests
                    e.target?.scrollIntoView?.({
                        block: "nearest"
                    });
                }}
                className="scale-setter-option"
            >
                {renderDisplayScale(intl, scaleValue)}
            </MenuItem>
        );
    });

    const renderedScale = renderDisplayScale(intl, activeScale);
    return (
        <Box {...containerProps}>
            <Menu isLazy>
                <MenuButton
                    as={Button}
                    rightIcon={<ChevronUpIcon />}
                    className="scale-setter-menubutton"
                    aria-label={intl.formatMessage(
                        {
                            id: "button.ariaLabel"
                        },
                        { scale: renderedScale }
                    )}
                    // eslint-disable-next-line jsx-a11y/aria-props
                    aria-description={intl.formatMessage({
                        id: "button.ariaDescription"
                    })}
                >
                    {renderedScale}
                </MenuButton>
                <Portal>
                    <MenuList
                        className="scale-setter-menuoptions"
                        maxHeight="20em"
                        overflowY="auto"
                    >
                        {scaleSelectOptions}
                    </MenuList>
                </Portal>
            </Menu>
        </Box>
    );
};

function renderDisplayScale(intl: PackageIntl, rawScale: number): string {
    return "1 : " + intl.formatNumber(rawScale);
}
