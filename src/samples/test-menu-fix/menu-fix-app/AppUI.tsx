// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    Container,
    Menu,
    MenuButton,
    MenuItem,
    MenuList
} from "@open-pioneer/chakra-integration";

export function AppUI() {
    return (
        <>
            <Container p={5}>
                <Menu>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Actions
                    </MenuButton>
                    <MenuList>
                        <MenuItem>Download</MenuItem>
                        <MenuItem>Create a Copy</MenuItem>
                        <MenuItem>Mark as Draft</MenuItem>
                        <MenuItem>Delete</MenuItem>
                        <MenuItem>Attend a Workshop</MenuItem>
                    </MenuList>
                </Menu>
            </Container>
        </>
    );
}
