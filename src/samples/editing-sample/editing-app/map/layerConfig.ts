// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import type { FeatureTemplate } from "new-editing";

import { createRegularPolygon } from "ol/interaction/Draw";
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
            geometryType: "Point",
            prototype: {
                saniert: false
            },
            fieldInputs: [
                {
                    label: "Baumart",
                    fieldName: "baumart",
                    inputType: "textField",
                    required: true
                },
                {
                    label: "Schadursache",
                    fieldName: "schadursache",
                    inputType: "select",
                    required: true,
                    valueType: "number",
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
                    fieldName: "schadmenge",
                    inputType: "number",
                    required: true,
                    min: 1,
                    precision: 0,
                    step: 1,
                    showSteppers: true
                },
                {
                    label: "Schadumfang [%]",
                    fieldName: "schadumfang",
                    inputType: "number",
                    min: 0,
                    max: 100,
                    precision: 1,
                    showSteppers: false
                },
                {
                    label: "Sanierungszustand",
                    fieldName: "saniert",
                    inputType: "checkBox",
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
            geometryType: "LineString",
            fieldInputs: [
                {
                    label: "Wegtyp",
                    fieldName: "wegtyp",
                    inputType: "select",
                    required: true,
                    valueType: "number",
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
                    fieldName: "befahrbarkeit",
                    inputType: "select",
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
                    fieldName: "wegbreite",
                    inputType: "number",
                    min: 0,
                    precision: 2,
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
            const color = feature.get("farbe");
            return new Style({
                fill: new Fill({
                    color: color != null ? `${color}aa` : "#808080aa"
                }),
                stroke: new Stroke({
                    color: "black",
                    width: 1.0
                })
            });
        },
        template: {
            name: "Schutzgebiet",
            geometryType: "Polygon",
            prototype: {
                farbe: "#2196f3"
            },
            fieldInputs: [
                {
                    label: "Schutzgebietsart",
                    fieldName: "schutzgebietsart",
                    inputType: "select",
                    required: true,
                    valueType: "number",
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
                    fieldName: "farbe",
                    inputType: "color",
                    required: true
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
            geometryType: "Circle",
            fieldInputs: [
                {
                    label: "Art der Bodenprobe",
                    fieldName: "art",
                    inputType: "select",
                    required: true,
                    valueType: "number",
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
                    fieldName: "datum",
                    inputType: "date",
                    required: true
                },
                {
                    label: "Bemerkung",
                    fieldName: "bemerkung",
                    inputType: "textArea"
                }
            ]
        }
    },
    {
        id: "aufforstungsflaechen",
        title: "Aufforstungsflächen",
        style: new Style({
            fill: new Fill({
                color: "#00aa00aa"
            }),
            stroke: new Stroke({
                color: "black",
                width: 1.0
            })
        }),
        template: {
            name: "Aufforstungsfläche",
            geometryType: "Circle",
            icon: PiRectangleBold({ size: 20 }),
            prototype: {
                aufforstungsjahr: new Date().getFullYear()
            },
            drawOptions: {
                geometryFunction: createRegularPolygon(4)
            },
            fieldInputs: [
                {
                    label: "Waldtyp",
                    fieldName: "waldtyp",
                    inputType: "select",
                    required: true,
                    valueType: "string",
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
                    fieldName: "pflanzendichte",
                    inputType: "number",
                    min: 0,
                    precision: 0
                },
                {
                    label: "Aufforstungsjahr",
                    fieldName: "aufforstungsjahr",
                    inputType: "number",
                    min: 1900,
                    max: 2100,
                    precision: 0
                }
            ]
        }
    }
];

interface LayerConfig {
    readonly id: string;
    readonly title: string;
    readonly style: StyleLike;
    readonly template: Omit<FeatureTemplate, "id">;
}
