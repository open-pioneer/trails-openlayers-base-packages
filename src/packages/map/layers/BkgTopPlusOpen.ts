// SPDX-FileCopyrightText: con terra GmbH and contributors
// SPDX-License-Identifier: Apache-2.0
import WMTS from "ol/source/WMTS";
import WMTSTileGrid from "ol/tilegrid/WMTS";

/** @internal */
export interface BkgTopPlusOpenProps {
    /**
     * The name of the requesting layer.
     * @default "web"
     */
    layer?: "web" | "web_grau" | "web_light";
}

/**
 * Layer source for BKG TopPlus Open.
 *
 * Used for @open-pioneer unit tests: not part of the public interface.
 *
 * @see https://gdz.bkg.bund.de/index.php/default/wmts-topplusopen-wmts-topplus-open.html
 *
 * @internal
 */
export class BkgTopPlusOpen extends WMTS {
    constructor(options?: BkgTopPlusOpenProps) {
        const topLeftCorner = [-3803165.98427299, 8805908.08284866];

        /**
         * Resolutions taken from AdV WMTS-Profil
         * @see https://www.adv-online.de/AdV-Produkte/Standards-und-Produktblaetter/AdV-Profile/
         */
        const resolutions = [
            4891.96981025128, // AdV-Level 0  (1:17471320.7508974)
            2445.98490512564, // AdV-Level 1  (1:8735660.37544872)
            1222.99245256282, // AdV-Level 2  (1:4367830.18772436)
            611.49622628141, // AdV-Level 3   (1:2183915.09386218)
            305.748113140705, // AdV-Level 4  (1:1091957.54693109)
            152.874056570353, // AdV-Level 5  (1:545978.773465545)
            76.4370282851763, // AdV-Level 6  (1:272989,386732772)
            38.2185141425881, // AdV-Level 7  (1:136494,693366386)
            19.1092570712941, // AdV-Level 8  (1:68247,3466831931)
            9.55462853564703, // AdV-Level 9  (1:34123,6733415966)
            4.77731426782352, // AdV-Level 10 (1:17061,8366707983)
            2.38865713391176, // AdV-Level 11 (1:8530,91833539914)
            1.19432856695588, // AdV-Level 12 (1:4265,45916769957)
            0.59716428347794 // AdV-Level 13 (1:2132,72958384978)
        ];

        /**
         * The length of matrixIds needs to match the length of the resolutions array
         * @see https://openlayers.org/en/latest/apidoc/module-ol_tilegrid_WMTS-WMTSTileGrid.html
         */
        const matrixIds = new Array(resolutions.length);
        for (let i = 0; i < resolutions.length; i++) {
            matrixIds[i] = i;
        }

        const layer = options?.layer ?? "web";

        super({
            url: `https://sgx.geodatenzentrum.de/wmts_topplus_open/tile/1.0.0/${layer}/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png`,
            layer: layer,
            matrixSet: "EU_EPSG_25832_TOPPLUS",
            format: "image/png",
            projection: "EPSG:25832",
            requestEncoding: "REST",
            tileGrid: new WMTSTileGrid({
                origin: topLeftCorner,
                resolutions: resolutions,
                matrixIds: matrixIds
            }),
            style: "default",
            attributions: `Kartendarstellung und Präsentationsgraphiken: © Bundesamt für Kartographie und Geodäsie ${new Date().getFullYear()}, <a href="https://sg.geodatenzentrum.de/web_public/gdz/datenquellen/Datenquellen_TopPlusOpen.html" target="_blank">Datenquellen</a>`
        });
    }
}
