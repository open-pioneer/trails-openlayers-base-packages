// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
/**
 * @vitest-environment node
 */
import { afterEach, expect, it, vi } from "vitest";
import { Sublayer } from "../api/layers/base";
import { AbstractLayerBase, AbstractLayerBaseOptions } from "./AbstractLayerBase";
import { MapModelImpl } from "./MapModelImpl";
import { SublayersCollectionImpl } from "./SublayersCollectionImpl";

afterEach(() => {
    vi.restoreAllMocks();
});

it("emits a destroy event when destroyed", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "Foo"
    });

    let destroyed = 0;
    layer.on("destroy", () => {
        destroyed++;
    });

    layer.destroy();
    expect(destroyed).toBe(1);
});

it("destroys all sublayers when destroyed", async () => {
    const nestedSublayer = new SublayerImpl({
        title: "Nested Sublayer"
    });
    const sublayer = new SublayerImpl({
        title: "Sublayer",
        sublayer: nestedSublayer
    });
    const layer = new LayerImpl({
        title: "Foo",
        sublayer: sublayer
    });

    // Calls destroy on all items in `this.sublayers`
    layer.destroy();

    expect(sublayer.$destroyCalled).toBe(true);
    expect(nestedSublayer.$destroyCalled).toBe(true);
});

it("throws when 'map' is accessed before the layer has been attached", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "Foo"
    });
    expect(() => layer.map).toThrowErrorMatchingInlineSnapshot(
        "\"Layer 'a' has not been attached to a map yet.\""
    );
});

it("supports access to the map", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "Foo"
    });
    const map = {} as any;
    layer.__attach(map);
    expect(layer.map).toBe(map);
});

it("supports the title attribute", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "A"
    });
    expect(layer.title).toBe("A");

    let changedTitle = 0;
    let changed = 0;
    layer.on("changed:title", () => ++changedTitle);
    layer.on("changed", () => ++changed);

    layer.setTitle("B");
    expect(layer.title).toBe("B");
    expect(changedTitle).toBe(1);
    expect(changed).toBe(1);
});

it("supports the description attribute", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "A"
    });
    expect(layer.description).toBe("");

    let changedDesc = 0;
    let changed = 0;
    layer.on("changed:description", () => ++changedDesc);
    layer.on("changed", () => ++changed);

    layer.setDescription("Description");
    expect(layer.description).toBe("Description");
    expect(changedDesc).toBe(1);
    expect(changed).toBe(1);
});

it("supports arbitrary additional attributes", async () => {
    const hidden = Symbol("hidden");
    const layer = new LayerImpl({
        id: "a",
        title: "A",
        attributes: {
            foo: "bar",
            [hidden]: "hidden"
        }
    });

    // String and symbol properties are supported
    expect(layer.attributes).toMatchInlineSnapshot(`
      {
        "foo": "bar",
        Symbol(hidden): "hidden",
      }
    `);

    let changedAttributes = 0;
    let changed = 0;
    layer.on("changed:attributes", () => ++changedAttributes);
    layer.on("changed", () => ++changed);

    layer.updateAttributes({
        foo: "baz",
        additional: "new-value",
        [hidden]: "still-hidden"
    });

    // Symbols are also applied on update
    expect(layer.attributes).toMatchInlineSnapshot(`
      {
        "additional": "new-value",
        "foo": "baz",
        Symbol(hidden): "still-hidden",
      }
    `);
    expect(changedAttributes).toBe(1);
    expect(changed).toBe(1);
});

it("supports deletion of attributes", async () => {
    const hidden = Symbol("hidden");
    const layer = new LayerImpl({
        id: "a",
        title: "A",
        attributes: {
            foo: "bar",
            bar: "foo",
            [hidden]: "hidden"
        }
    });

    // String and symbol properties are supported
    expect(layer.attributes).toMatchInlineSnapshot(`
      {
        "bar": "foo",
        "foo": "bar",
        Symbol(hidden): "hidden",
      }
    `);

    let changedAttributes = 0;
    let changed = 0;
    layer.on("changed:attributes", () => ++changedAttributes);
    layer.on("changed", () => ++changed);

    layer.deleteAttribute("foo");
    layer.deleteAttribute(hidden);
    layer.deleteAttribute("foo"); // already delete, will not trigger change event

    // Symbols are also applied on update
    expect(layer.attributes).toMatchInlineSnapshot(`
      {
        "bar": "foo",
      }
    `);
    expect(changedAttributes).toBe(2);
    expect(changed).toBe(2);
});

it("supports initial empty attribute object and empty attribute object after updating/deleting", async () => {
    const hidden = Symbol("hidden");
    const layer = new LayerImpl({
        id: "a",
        title: "A"
    });
    let changedAttributes = 0;
    let changed = 0;
    layer.on("changed:attributes", () => ++changedAttributes);
    layer.on("changed", () => ++changed);

    // check layer attributes is empty object
    expect(layer.attributes).toMatchInlineSnapshot(`
      {}
    `);

    // update layer attributes
    layer.updateAttributes({
        [hidden]: "still-hidden"
    });
    expect(layer.attributes).toMatchInlineSnapshot(`
    {
      Symbol(hidden): "still-hidden",
    }
    `);
    expect(changedAttributes).toBe(1);
    expect(changed).toBe(1);

    // delete layer attributes and check, if layer attributes is empty object
    layer.deleteAttribute(hidden);
    expect(layer.attributes).toMatchInlineSnapshot(`
      {}
    `);
    expect(changedAttributes).toBe(2);
    expect(changed).toBe(2);
});

class LayerImpl extends AbstractLayerBase {
    private _sublayers: SublayersCollectionImpl<SublayerImpl> | undefined;

    constructor(options: AbstractLayerBaseOptions & { sublayer?: SublayerImpl }) {
        super(options);
        if (options.sublayer) {
            this._sublayers = new SublayersCollectionImpl([options.sublayer]);
        }
    }

    __attach(map: MapModelImpl): void {
        this.__attachToMap(map);
    }

    get visible(): boolean {
        throw new Error("Method not implemented.");
    }

    get legend(): string | undefined {
        return undefined;
    }

    get sublayers() {
        return this._sublayers;
    }

    setVisible(_: boolean): void {
        throw new Error("Method not implemented.");
    }
}

class SublayerImpl extends LayerImpl implements Sublayer {
    $destroyCalled = false;

    destroy(): void {
        super.destroy();
        this.$destroyCalled = true;
    }

    get parent(): never {
        throw new Error("not implemented");
    }

    get parentLayer(): never {
        throw new Error("not implemented");
    }
}
