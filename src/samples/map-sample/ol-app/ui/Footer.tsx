// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { Flex } from "@open-pioneer/chakra-integration";
import { CoordinateViewer } from "@open-pioneer/coordinate-viewer";
import { ScaleBar } from "@open-pioneer/scale-bar";
import { ScaleViewer } from "@open-pioneer/scale-viewer";
import { useIntl } from "open-pioneer:react-hooks";

export function Footer() {
    const intl = useIntl();

    return (
        <Flex
            role="region"
            aria-label={intl.formatMessage({ id: "ariaLabel.footer" })}
            gap={3}
            alignItems="center"
            justifyContent="center"
        >
            <CoordinateViewer precision={2} displayProjectionCode="EPSG:4326" />
            <ScaleBar />
            <ScaleViewer />
        </Flex>
    );
}
