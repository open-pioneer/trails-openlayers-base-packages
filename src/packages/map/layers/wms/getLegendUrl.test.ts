// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "fs";
import WMSCapabilities from "ol/format/WMSCapabilities";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { expect, it } from "vitest";
import { getLegendUrl } from "./getLegendUrl";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

// happy dom does not implement a good XML parser
import jsdom from "jsdom";
window.DOMParser = new jsdom.JSDOM().window.DOMParser;

it("should retrieve the legendURL from the WMS service capabilities, if available", async () => {
    const capabilitiesXML = readFileSync(
        resolve(THIS_DIR, "./test-data/SimpleWMSCapas.xml"),
        "utf-8"
    );
    const parser = new WMSCapabilities();
    const wmsCapabilities = parser.read(capabilitiesXML);

    const legendURLRoads = getLegendUrl(wmsCapabilities, "ROADS_1M");
    expect(legendURLRoads).toEqual("http://www.university.edu/legends/atlas.gif");

    const legendURLClouds = getLegendUrl(wmsCapabilities, "Clouds");
    expect(legendURLClouds).toBeUndefined();
});
