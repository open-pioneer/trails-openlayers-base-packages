// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "fs";
import WMTSCapabilities from "ol/format/WMTSCapabilities";
import { resolve } from "path";
import { expect, it } from "vitest";
import { getAttributions } from "./getAttributions";

it("should return undefined if no attribution is configured in service metadata", async () => {
    const attribution = readAttribution("./test-data/SimpleWMTSCapas.xml");
    expect(attribution).toBeUndefined();
});

it("should return automatic attribution if service metadata are present", async () => {
    const attribution = readAttribution("./test-data/SimpleWMTSCapasWithLegend.xml");
    expect(attribution).toMatchInlineSnapshot(
        `"Die Daten der Landbedeckung können unter der Datenlizenz Deutschland – Namensnennung – Version 2.0 genutzt werden. Dabei ist folgender Quellenvermerk anzugeben: "Enthält modifizierte Copernicus Sentinel-2 Daten [2021, 2022], verarbeitet durch Geobasis NRW; dl-de/by-2-0 (www.govdata.de/dl-de/by-2-0); https://www.wms.nrw.de/geobasis/wms_nw_landbedeckung""`
    );
});

function readAttribution(file: string) {
    const capabilitiesXML = readFileSync(resolve(import.meta.dirname, file), "utf-8");

    const parser = new WMTSCapabilities();
    const wmtsCapabilities = parser.read(capabilitiesXML);
    return getAttributions(wmtsCapabilities);
}
