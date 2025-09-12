// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "fs";
import WMSCapabilities from "ol/format/WMSCapabilities";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { expect, it } from "vitest";
import { getWMSLegendUrl } from "./WMSLayerImpl";
import { getWMTSLegendUrl } from "./WMTSLayerImpl";

// happy dom does not implement an XML parser
// https://github.com/capricorn86/happy-dom/issues/282
import jsdom from "jsdom";
window.DOMParser = new jsdom.JSDOM().window.DOMParser;

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

it("should retrieve the legendURL from the WMS service capabilities, if available", async () => {
    const capabilitiesXML = readFileSync(
        resolve(THIS_DIR, "./test-data/SimpleWMSCapas.xml"),
        "utf-8"
    );
    const parser = new WMSCapabilities();
    const wmsCapabilities = parser.read(capabilitiesXML);

    const legendURLRoads = getWMSLegendUrl(wmsCapabilities, "ROADS_1M");
    expect(legendURLRoads).toEqual("http://www.university.edu/legends/atlas.gif");

    const legendURLClouds = getWMSLegendUrl(wmsCapabilities, "Clouds");
    expect(legendURLClouds).toBeUndefined();
});

it("should retrieve the legendURL from the WMTS service capabilities, if available", async () => {
    const capabilitiesXML = readFileSync(
        resolve(THIS_DIR, "./test-data/SimpleWMTSCapasWithLegend.xml"),
        "utf-8"
    );
    const parser = new WMTSCapabilities();
    const wmtsCapabilities = parser.read(capabilitiesXML);

    const legendURL = getWMTSLegendUrl(wmtsCapabilities, "wmts_nw_landbedeckung", "default");
    expect(legendURL).toEqual(
        "https://www.wmts.nrw.de/legends/geobasis/wmts_nw_landbedeckung/nw_landbedeckung.png"
    );
});
