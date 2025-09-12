// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "fs";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { dirname, resolve } from "path";
import { expect, it } from "vitest";
import { getLegendUrl } from "./getLegendUrl";
import { fileURLToPath } from "url";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

it("should retrieve the legendURL from the WMTS service capabilities, if available", async () => {
    const capabilitiesXML = readFileSync(
        resolve(THIS_DIR, "./test-data/SimpleWMTSCapasWithLegend.xml"),
        "utf-8"
    );
    const parser = new WMTSCapabilities();
    const wmtsCapabilities = parser.read(capabilitiesXML);

    const legendURL = getLegendUrl(wmtsCapabilities, "wmts_nw_landbedeckung", "default");
    expect(legendURL).toEqual(
        "https://www.wmts.nrw.de/legends/geobasis/wmts_nw_landbedeckung/nw_landbedeckung.png"
    );
});
