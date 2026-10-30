// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import WMSCapabilities from "ol/format/WMSCapabilities";
import { expect, it } from "vitest";
import { getLegendUrl } from "./getLegendUrl";

const THIS_DIR = dirname(fileURLToPath(import.meta.url));

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

it("returns the legend of a named root layer without child layers", () => {
    const parser = new WMSCapabilities();
    const wmsCapabilities = parser.read(SINGLE_LAYER_CAPAS);

    expect(getLegendUrl(wmsCapabilities, "single")).toEqual("http://example.com/legend.png");
    expect(getLegendUrl(wmsCapabilities, "other")).toBeUndefined();
});

const SINGLE_LAYER_CAPAS = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service>
    <Name>WMS</Name>
    <Title>Single layer service</Title>
  </Service>
  <Capability>
    <Layer>
      <Name>single</Name>
      <Title>Single layer</Title>
      <Style>
        <Name>default</Name>
        <Title>Default</Title>
        <LegendURL width="20" height="20">
          <Format>image/png</Format>
          <OnlineResource xlink:type="simple" xlink:href="http://example.com/legend.png"/>
        </LegendURL>
      </Style>
    </Layer>
  </Capability>
</WMS_Capabilities>`;
