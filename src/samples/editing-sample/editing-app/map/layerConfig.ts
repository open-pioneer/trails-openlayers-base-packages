// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { FeatureTemplate } from "new-editing";

import { createBox } from "ol/interaction/Draw";
import { Circle, Fill, Stroke, Style } from "ol/style";
import type { StyleLike } from "ol/style/Style";

import { PiRectangleBold } from "react-icons/pi";

export const LAYER_CONFIG: LayerConfig[] = [
    {
        id: "waldschaeden",
        title: "Waldschäden",
        style: new Style({
            image: new Circle({
                fill: new Fill({
                    color: "red"
                }),
                stroke: new Stroke({
                    color: "black",
                    width: 1.0
                }),
                radius: 10.0
            })
        }),
        template: {
            name: "Waldschaden",
            kind: "declarative",
            geometryType: "Point",
            prototype: {
                saniert: false
            },
            fields: [
                {
                    label: "Baumart",
                    type: "text-field",
                    propertyName: "baumart",
                    isRequired: true
                },
                {
                    label: "Schadursache",
                    type: "select",
                    propertyName: "schadursache",
                    valueType: "number",
                    isRequired: true,
                    options: [
                        {
                            label: "abiotische Ursache",
                            value: 1
                        },
                        {
                            label: "Bakterienerkrankung",
                            value: 2
                        },
                        {
                            label: "Insektenbefall",
                            value: 3
                        },
                        {
                            label: "Pilzbefall",
                            value: 4
                        },
                        {
                            label: "Wildverbiss",
                            value: 5
                        }
                    ]
                },
                {
                    label: "Schadmenge",
                    type: "number-field",
                    propertyName: "schadmenge",
                    isRequired: true,
                    min: 1,
                    formatOptions: {
                        maximumFractionDigits: 0
                    },
                    step: 1,
                    showSteppers: true
                },
                {
                    label: "Schadumfang [%]",
                    type: "number-field",
                    propertyName: "schadumfang",
                    min: 0,
                    max: 100,
                    formatOptions: {
                        maximumFractionDigits: 1
                    },
                    showSteppers: false
                },
                {
                    label: "Sanierungszustand",
                    type: "check-box",
                    propertyName: "saniert",
                    checkBoxLabel: "Saniert"
                }
            ]
        }
    },
    {
        id: "waldwege",
        title: "Waldwege",
        style: new Style({
            stroke: new Stroke({
                color: "blue",
                width: 3.0
            })
        }),
        template: {
            name: "Waldweg",
            kind: "declarative",
            geometryType: "LineString",
            fields: [
                {
                    label: "Wegtyp",
                    type: "select",
                    propertyName: "wegtyp",
                    valueType: "number",
                    isRequired: true,
                    options: [
                        {
                            label: "Abfuhrweg",
                            value: 1
                        },
                        {
                            label: "Forstbetriebsweg",
                            value: 2
                        },
                        {
                            label: "Maschinenweg",
                            value: 3
                        },
                        {
                            label: "Rückegasse",
                            value: 4
                        },
                        {
                            label: "Seiltrasse",
                            value: 5
                        }
                    ]
                },
                {
                    label: "Befahrbarkeit",
                    type: "select",
                    propertyName: "befahrbarkeit",
                    valueType: "string",
                    options: [
                        {
                            label: "gut",
                            value: "gut"
                        },
                        {
                            label: "mittel",
                            value: "mittel"
                        },
                        {
                            label: "schlecht",
                            value: "schlecht"
                        }
                    ]
                },
                {
                    label: "Wegbreite [m]",
                    type: "number-field",
                    propertyName: "wegbreite",
                    min: 0,
                    formatOptions: {
                        maximumFractionDigits: 2
                    },
                    step: 1,
                    showSteppers: true
                }
            ]
        }
    },
    {
        id: "schutzgebiete",
        title: "Schutzgebiete",
        style(feature) {
            return new Style({
                fill: new Fill({
                    color: feature.get("farbe") ?? "#808080aa"
                }),
                stroke: new Stroke({
                    color: "black",
                    width: 1.0
                })
            });
        },
        template: {
            name: "Schutzgebiet",
            kind: "declarative",
            geometryType: "Polygon",
            prototype: {
                farbe: "#2196f3"
            },
            fields: [
                {
                    label: "Schutzgebietsart",
                    type: "select",
                    propertyName: "schutzgebietsart",
                    valueType: "number",
                    isRequired: true,
                    options: [
                        {
                            label: "Bannwald",
                            value: 1
                        },
                        {
                            label: "Biosphärenreservat",
                            value: 2
                        },
                        {
                            label: "Biotop",
                            value: 3
                        },
                        {
                            label: "Erholungswald",
                            value: 4
                        },
                        {
                            label: "FFH-Gebiet",
                            value: 5
                        },
                        {
                            label: "Landschaftsschutzgebiet",
                            value: 6
                        },
                        {
                            label: "Naturdenkmal",
                            value: 7
                        },
                        {
                            label: "Nationalpark",
                            value: 8
                        },
                        {
                            label: "Naturschutzgebiet",
                            value: 9
                        },
                        {
                            label: "Vogelschutzgebiet",
                            value: 10
                        },
                        {
                            label: "Wasserschutzgebiet",
                            value: 11
                        },
                        {
                            label: "Wildnisentwicklungsgebiet",
                            value: 12
                        }
                    ]
                },
                {
                    label: "Farbe",
                    type: "color-picker",
                    propertyName: "farbe",
                    isRequired: true,
                    swatchColors: [
                        "#000000",
                        "#4A5568",
                        "#F56565",
                        "#ED64A6",
                        "#9F7AEA",
                        "#6B46C1",
                        "#4299E1",
                        "#0BC5EA",
                        "#00B5D8",
                        "#38B2AC",
                        "#48BB78",
                        "#68D391",
                        "#ECC94B",
                        "#DD6B20"
                    ]
                }
            ]
        }
    },
    {
        id: "bodenproben",
        title: "Bodenproben",
        style: new Style({
            fill: new Fill({
                color: "#ffa500aa"
            }),
            stroke: new Stroke({
                color: "black",
                width: 1.0
            })
        }),
        template: {
            name: "Bodenprobe",
            kind: "declarative",
            geometryType: "Circle",
            fields: [
                {
                    label: "Art der Bodenprobe",
                    type: "select",
                    propertyName: "art",
                    valueType: "number",
                    isRequired: true,
                    options: [
                        {
                            label: "pH-Wert",
                            value: 1
                        },
                        {
                            label: "Nährstoffgehalt",
                            value: 2
                        },
                        {
                            label: "Bodenfeuchte",
                            value: 3
                        },
                        {
                            label: "Bodentemperatur",
                            value: 4
                        },
                        {
                            label: "Organische Substanz",
                            value: 5
                        }
                    ]
                },
                {
                    label: "Probenahmedatum",
                    type: "date-picker",
                    propertyName: "datum",
                    isRequired: true
                },
                {
                    label: "Bemerkung",
                    type: "text-area",
                    propertyName: "bemerkung"
                }
            ]
        }
    },
    {
        id: "aufforstungsflaechen",
        title: "Aufforstungsflächen",
        style(feature) {
            const waldtyp = feature.get("waldtyp") as string;
            const colors: Record<string, string> = {
                laubwald: "#90ee90aa",
                nadelwald: "#006400aa",
                mischwald: "#3cb371aa",
                other: "#808080aa"
            };
            return new Style({
                fill: new Fill({
                    color: colors[waldtyp] ?? colors.other
                }),
                stroke: new Stroke({
                    color: "black",
                    width: 1.0
                })
            });
        },
        template: {
            name: "Aufforstungsfläche",
            kind: "declarative",
            geometryType: "Circle",
            icon: PiRectangleBold({ size: 20 }),
            prototype: {
                aufforstungsjahr: new Date().getFullYear()
            },
            drawingOptions: {
                geometryFunction: createBox()
            },
            fields: [
                {
                    label: "Waldtyp",
                    type: "select",
                    propertyName: "waldtyp",
                    valueType: "string",
                    isRequired: true,
                    options: [
                        {
                            label: "Laubwald",
                            value: "laubwald"
                        },
                        {
                            label: "Nadelwald",
                            value: "nadelwald"
                        },
                        {
                            label: "Mischwald",
                            value: "mischwald"
                        }
                    ]
                },
                {
                    label: "Pflanzendichte [#/ha]",
                    type: "number-field",
                    propertyName: "pflanzendichte",
                    min: 0,
                    formatOptions: {
                        maximumFractionDigits: 0
                    }
                },
                {
                    label: "Aufforstungsjahr",
                    type: "number-field",
                    propertyName: "aufforstungsjahr",
                    min: 1900,
                    max: 2100,
                    showSteppers: true,
                    formatOptions: {
                        maximumFractionDigits: 0,
                        useGrouping: false
                    }
                }
            ]
        }
    }
];

interface LayerConfig {
    readonly id: string;
    readonly title: string;
    readonly style: StyleLike;
    readonly template: FeatureTemplate;
}
