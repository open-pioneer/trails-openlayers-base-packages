// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { OgcFeatureSearchSource } from "@open-pioneer/ogc-features";
import { PackageIntl, ServiceOptions } from "@open-pioneer/runtime";
import { SearchSource } from "@open-pioneer/search";
import { PhotonGeocoder } from "./sources/searchSources";

export class AppConfig {
    private intl: PackageIntl;

    constructor({ intl }: ServiceOptions) {
        this.intl = intl;
    }

    getSearchSources(): SearchSource[] {
        const sources = [
            // new OgcFeatureSearchSource("Feldblöcke", {
            //     baseUrl: "https://ogc-api.nrw.de/inspire-lc-fb/v1",
            //     collectionId: "landcoverunit",
            //     searchProperty: "flik"
            // }),
            // new OgcFeatureSearchSource("Weinberge", {
            //     baseUrl: "https://demo.ldproxy.net/vineyards",
            //     collectionId: "vineyards",
            //     searchProperty: "name"
            // }),
            new OgcFeatureSearchSource({
                label: this.intl.formatMessage({ id: "searchSources.miningPermissions" }),
                baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
                collectionId: "managementrestrictionorregulationzone",
                searchProperty: "thematicId",
                labelProperty: "name",
                renderLabel(feature) {
                    const name = feature?.properties?.name;
                    const id = feature?.id;
                    if (typeof name === "string") {
                        return name + " (" + id + ")";
                    } else {
                        return String(id);
                    }
                },
                rewriteUrl(url) {
                    url.searchParams.set("properties", "name"); // return `name` inside of `features[].properties` only
                    return url;
                }
            }),
            new PhotonGeocoder("Photon Geocoder", ["city", "street"])
        ];
        return sources;
    }
}
