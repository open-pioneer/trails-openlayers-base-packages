// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { Resource } from "@open-pioneer/core";
import BaseLayer from "ol/layer/Base";
import { LayerLoadState, MapModel, LayerBaseEvents, SublayersCollection, AnyLayer, Layer, Sublayer, SublayerBaseType, SimpleLayerConfig } from "../../api";
import { GroupLayer, GroupLayerConfig, GroupSublayer } from "../../api/layers/GroupLayer";
import { AbstractLayer } from "../AbstractLayer";
import { Group } from "ol/layer";
import { AbstractLayerBase } from "../AbstractLayerBase";
import { reactive, Reactive } from "@conterra/reactivity-core";
import { GroupSublayersCollectionImpl, SublayersCollectionImpl } from "../SublayersCollectionImpl";

export class GroupLayerImpl extends AbstractLayer implements GroupLayer {
    #sublayers: GroupSublayersCollectionImpl;
    #olGroupLayer: Group;

    constructor(config: GroupLayerConfig){
        const olGroup = new Group({layers: config.sublayers.map(sublayer => sublayer.olLayer)});
        super({...config, olLayer: olGroup});
        this.#olGroupLayer = olGroup;
        const sublayerList = constructSublayers(this, config.sublayers);
        this.#sublayers = new GroupSublayersCollectionImpl(sublayerList);
        this.#olGroupLayer = olGroup;
    }

    get isBaseLayer() {
        return false;
    }

    get type() {
        return "group" as const;
    }
    get legend() {
        return undefined;
    }

    get sublayers(): GroupSublayersCollectionImpl{
        return this.#sublayers;
    }


}

function constructSublayers(parent: GroupLayer, sublayers: AbstractLayer[]): GroupSublayer[] {
    const groupSubLayers: GroupSublayer[] = [];
    for(const sublayer of sublayers){
        groupSubLayers.push(new GroupSublayerImpl(sublayer, parent));
    }
    return groupSubLayers;
}


/* export abstract class AbstractGroupSublayer extends AbstractLayer implements SublayerBaseType{
    #parentGroup: GroupLayer;

    constructor(config: SimpleLayerConfig, parentGroup: GroupLayer){
        super(config);
        this.#parentGroup = parentGroup;
    }

    get parent(): GroupLayer{
        return this.#parentGroup;
    }

    get parentLayer(): GroupLayer{
        return this.#parentGroup;
    }

    get type(): string {
        return "group-sublayer";
    }
} */


export class GroupSublayerImpl implements GroupSublayer {

    #layer: AbstractLayer;
    #parentGroup: GroupLayer;

    constructor(layer: AbstractLayer, parentGroup: GroupLayer){
        this.#layer = layer;
        this.#parentGroup = parentGroup;
    }

    get layer(){
        return this.#layer;
    }

    get parent(){
        return this.#parentGroup;
    }

    get parentLayer(){
        return this.#parentGroup;
    }

    get type() {
        return "group-sublayer" as const;
    }


    get map(){
        return this.#layer.map;
    }

    get id(){
        return this.#layer.id;
    }

    get title(){
        return this.#layer.title;
    }

    get description(){
        return this.#layer.description;
    }

    get visible(){
        return this.#layer.visible;
    }

    get legend(){
        return this.#layer.legend;
    }

    get sublayers(){
        return this.#layer.sublayers;
    }

    get attributes(){
        return this.#layer.attributes;
    }
    setTitle(newTitle: string): void {
        this.#layer.setTitle(newTitle);
    }
    setDescription(newDescription: string): void {
        this.#layer.setDescription(newDescription);
    }
    setVisible(newVisibility: boolean): void {
        this.#layer.setVisible(newVisibility);
    }
    updateAttributes(newAttributes: Record<string | symbol, unknown>): void {
        this.#layer.updateAttributes(newAttributes);
    }
    deleteAttribute(deleteAttribute: string | symbol): void {
        this.#layer.deleteAttribute(deleteAttribute);
    }
    on<Name extends "destroy">(eventName: Name, listener: (...args: [LayerBaseEvents[Name]] extends [void] ? [] : [event: LayerBaseEvents[Name]]) => void): Resource {
        return this.#layer.on(eventName, listener);
    }
    once<Name extends "destroy">(eventName: Name, listener: (...args: [LayerBaseEvents[Name]] extends [void] ? [] : [event: LayerBaseEvents[Name]]) => void): Resource {
        return this.#layer.once(eventName, listener);
    }
}
