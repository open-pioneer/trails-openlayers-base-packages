// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "fs";
import WMSCapabilities from "ol/format/WMSCapabilities";
import { resolve } from "path";
import { expect, it } from "vitest";
import { getAttributions } from "./getAttributions";

// happy dom does not implement a good XML parser
import jsdom from "jsdom";
window.DOMParser = new jsdom.JSDOM().window.DOMParser;

it("should return undefined if no attribution is configured in service metadata", async () => {
    const attribution = readAttribution("./test-data/SimpleWMSCapas.xml");
    expect(attribution).toBeUndefined();
});

it("should return automatic attribution if service metadata are present", async () => {
    const attribution = readAttribution("./test-data/wms_nw_dgk5.xml");
    expect(attribution).toMatchInlineSnapshot(
        `"Die Geobasisdaten des amtlichen Vermessungswesens werden als öffentliche Aufgabe gem. VermKatG NRW und gebührenfrei nach Open Data-Prinzipien über online-Verfahren bereitgestellt. Nutzungsbedingungen: Es gelten die durch den IT-Planungsrat im Datenportal für Deutschland (GovData) veröffentlichten einheitlichen Lizenzbedingungen „Datenlizenz Deutschland – Zero“ (https://www.govdata.de/dl-de/zero-2-0). Jede Nutzung ist ohne Einschränkungen oder Bedingungen zulässig. Eine Haftung für die zur Verfügung gestellten Daten und Dienste wird ausgeschlossen. Dies gilt insbesondere für deren Aktualität, Richtigkeit, Verfügbarkeit, Qualität und Vollständigkeit sowie die Kompatibilität und Interoperabilität mit den Systemen des Nutzers. Vom Haftungsausschluss ausgenommen sind gesetzliche Schadensersatzansprüche für eine Verletzung des Lebens, des Körpers und der Gesundheit sowie die gesetzliche Haftung für sonstige Schäden, soweit diese auf einer vorsätzlichen oder grob fahrlässigen Pflichtverletzung beruhen."`
    );
});

function readAttribution(file: string) {
    const capabilitiesXML = readFileSync(resolve(import.meta.dirname, file), "utf-8");

    const parser = new WMSCapabilities();
    const wmtsCapabilities = parser.read(capabilitiesXML);
    return getAttributions(wmtsCapabilities);
}
