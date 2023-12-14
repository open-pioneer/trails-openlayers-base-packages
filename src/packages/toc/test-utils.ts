// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { screen } from "@testing-library/react";

export async function findToc() {
    const tocDiv = await screen.findByTestId("toc");
    return tocDiv;
}
