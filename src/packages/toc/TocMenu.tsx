// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { IconButton, Menu, MenuButton, MenuList } from "@open-pioneer/chakra-integration";
import { CommonComponentProps } from "@open-pioneer/react-utils";
import { FC, ReactNode } from "react";
import { FiMoreVertical } from "react-icons/fi";

export interface TocMenuProps extends CommonComponentProps {
    children?: ReactNode | undefined;
}

export const TocMenu: FC<TocMenuProps> = (props: TocMenuProps) => {
    const { children, ...rest } = props;

    return (
        <Menu>
            <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<FiMoreVertical />}
                borderRadius="full"
                variant="ghost"
            />
            <MenuList {...rest}>{children}</MenuList>
        </Menu>
    );
};
