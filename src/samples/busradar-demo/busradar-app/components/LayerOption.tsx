// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Flex } from "@chakra-ui/react";
import { Switch } from "@open-pioneer/chakra-snippets/switch";
import { InfoTip } from "@open-pioneer/chakra-snippets/toggle-tip";
import { useIntl } from "open-pioneer:react-hooks";

export function LayerOption(props: {
    label: string;
    info: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (isActive: boolean) => void;
}) {
    return (
        <Flex alignItems="center" gap={1} flexWrap="wrap" minW={0} position="relative">
            <Switch
                size="sm"
                checked={props.checked}
                disabled={props.disabled}
                onCheckedChange={(details) => props.onChange(details.checked)}
            >
                {props.label}
            </Switch>
            <InfoButton label={props.label} text={props.info} />
        </Flex>
    );
}

function InfoButton(props: { label: string; text: string }) {
    const intl = useIntl();
    return (
        <InfoTip
            content={props.text}
            buttonProps={{
                "aria-label": intl.formatMessage(
                    { id: "layerPanel.infoAriaLabel" },
                    { label: props.label }
                )
            }}
        />
    );
}
