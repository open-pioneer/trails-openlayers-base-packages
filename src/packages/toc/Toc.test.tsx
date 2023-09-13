// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment jsdom
 */

import { expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PackageContextProvider } from "@open-pioneer/test-utils/react";
import { Toc } from "./Toc";
import { createPackageContextProviderProps, setupMap } from "@open-pioneer/map/test-utils";
it("should successfully create a toc component", async () => {
    const { mapId, registry } = await setupMap();

    render(
        <PackageContextProvider {...createPackageContextProviderProps(registry)}>
            <div data-testid="base">
                <Toc mapId={mapId}></Toc>
            </div>
        </PackageContextProvider>
    );

    // toc is mounted
    const { tocDiv, tocHeader } = await waitForToc();
    expect(tocDiv).toMatchSnapshot();

    // check scale viewer box is available
    expect(tocHeader).toBeInstanceOf(HTMLDivElement);
});

async function waitForToc() {
    const { tocDiv, tocHeader } = await waitFor(async () => {
        const domElement = await screen.findByTestId("base");

        const tocDiv = domElement.querySelector(".toc");
        if (!tocDiv) {
            throw new Error("Toc not rendered");
        }

        const tocHeader = tocDiv.querySelector(".toc-header");
        if (!tocHeader) {
            throw new Error("Toc header not rendered");
        }

        return { tocDiv, tocHeader };
    });

    return { tocDiv, tocHeader };
}
