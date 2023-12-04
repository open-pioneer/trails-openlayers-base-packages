// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { expect, it } from "vitest";
import { OgcFeatureSearchSource, SearchResponse } from "./OgcFeatureSearchSource";
import { SearchSource } from "@open-pioneer/search";
import { get as getProjection } from "ol/proj";
import { SearchController } from "@open-pioneer/search/SearchController";

const response = {
    type: "FeatureCollection",
    numberReturned: 2,
    numberMatched: 2,
    timeStamp: "2023-12-01T12:28:16Z",
    features: [
        {
            type: "Feature",
            id: "4000075001",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [6.180881022282916, 50.93753948577338],
                        [6.177655835238146, 50.935783536765214],
                        [6.1753887702287855, 50.93348923474242],
                        [6.171611066378628, 50.929665132410996],
                        [6.170217580810749, 50.923855205124035],
                        [6.172889445874459, 50.92460754225249],
                        [6.175265868463677, 50.924095364152805],
                        [6.201271999211225, 50.92009575190638],
                        [6.201279738610664, 50.91595148262405],
                        [6.20336995428963, 50.91598028560698],
                        [6.203361160256082, 50.920847351746],
                        [6.199045406868226, 50.92425189809344],
                        [6.186766104814082, 50.933235731724466],
                        [6.185043058718805, 50.93449599955021],
                        [6.180881022282916, 50.93753948577338]
                    ]
                ]
            },
            properties: { name: "Aldenhoven 6" }
        },
        {
            type: "Feature",
            id: "4000050002",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [7.455268177793453, 51.48668294227042],
                        [7.459308045576077, 51.48450065302553],
                        [7.460820941611737, 51.4837387159833],
                        [7.463644254483711, 51.48231698319372],
                        [7.465594624018868, 51.48329437569526],
                        [7.467671676923377, 51.48390227149009],
                        [7.468849510709505, 51.484156407864994],
                        [7.472827508700579, 51.48451960484009],
                        [7.478739819258874, 51.4854776297849],
                        [7.476108161955665, 51.49092678898278],
                        [7.472496170784802, 51.48999079929369],
                        [7.468128790680447, 51.49041366436515],
                        [7.458954317165723, 51.48614090871683],
                        [7.455268177793453, 51.48668294227042]
                    ]
                ]
            },
            properties: { name: "Glückaufssegen" }
        }
    ]
} as SearchResponse;

const rewriteUrlFunctionSource = new OgcFeatureSearchSource("Bergbauberechtigungen", {
    baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
    collectionId: "managementrestrictionorregulationzone",
    searchProperty: "thematicId",
    rewriteUrlFunction(url) {
        url.searchParams.set("foo", "bar");
        return url;
    }
});

const renderLabelFunctionSource = new OgcFeatureSearchSource("Bergbauberechtigungen", {
    baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
    collectionId: "managementrestrictionorregulationzone",
    searchProperty: "thematicId",
    labelProperty: "name",
    renderLabelFunction(feature) {
        return feature?.properties?.name + " (" + feature?.id + ")";
    },
    request() {
        return Promise.resolve(response);
    }
});

const labelPropertySource = new OgcFeatureSearchSource("Bergbauberechtigungen", {
    baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
    collectionId: "managementrestrictionorregulationzone",
    searchProperty: "thematicId",
    labelProperty: "name",
    request() {
        return Promise.resolve(response);
    }
});

const searchPropertySource = new OgcFeatureSearchSource("Bergbauberechtigungen", {
    baseUrl: "https://ogc-api.nrw.de/inspire-am-bergbauberechtigungen/v1",
    collectionId: "managementrestrictionorregulationzone",
    searchProperty: "thematicId",
    request() {
        return Promise.resolve(response);
    }
});

it("expect search source to use the rewriteUrlFunction", async () => {
    const expected = "https://www.google.com/?foo=bar";

    const urlObject = rewriteUrlFunctionSource?.options?.rewriteUrlFunction?.(
        new URL("https://www.google.com")
    );

    expect(urlObject?.href).toBe(expected);
});

it("expect search source to use the renderLabelFunction", async () => {
    const { controller } = setup([renderLabelFunctionSource]);
    const searchResponse = await controller.search("500");

    const results = searchResponse[0]?.results;

    expect(results?.[0]?.label).toBe("Aldenhoven 6 (4000075001)");
    expect(results?.[1]?.label).toBe("Glückaufssegen (4000050002)");
});

it("expect search source to use the labelProperty", async () => {
    const { controller } = setup([labelPropertySource]);
    const searchResponse = await controller.search("500");

    const results = searchResponse[0]?.results;

    expect(results?.[0]?.label).toBe("Aldenhoven 6");
    expect(results?.[1]?.label).toBe("Glückaufssegen");
});

it("expect search source to use the searchProperty", async () => {
    const { controller } = setup([searchPropertySource]);
    const searchResponse = await controller.search("500");

    const results = searchResponse[0]?.results;

    expect(results?.[0]?.label).toBe("");
    expect(results?.[1]?.label).toBe("");
});

function setup(sources: SearchSource[]) {
    // Map Model mock (just as needed for the controller)
    let mapProjection = getProjection("EPSG:4326");
    const mapModel: any = {
        olMap: {
            getView() {
                return {
                    getProjection() {
                        return mapProjection;
                    }
                };
            }
        }
    };
    const controller = new SearchController(mapModel, sources);
    controller.searchTypingDelay = 10;

    const changeProjection = (code: string) => {
        mapProjection = getProjection(code);
    };
    return { controller, changeProjection };
}
