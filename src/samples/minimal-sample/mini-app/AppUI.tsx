// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0


import { ToolButton } from "@open-pioneer/map-ui-components";
import { useState } from "react";
import { FiVideo } from "react-icons/fi";


export function AppUI(){
    const icon = <FiVideo></FiVideo>;
    const [active, setActive] = useState(false);
    return (
        <>
            <ToolButton label="Test test Test" icon={icon} active={active} onClick={() => setActive(!active)} buttonProps={{m: 25}}></ToolButton>
        </>
    );
}
