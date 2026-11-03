// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

/**
 * @vitest-environment node
 */
import { reactive, watch, watchValue } from "@conterra/reactivity-core";
import { on } from "@conterra/reactivity-events";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapModel } from "../model/MapModel";
import { INTERNAL_CONSTRUCTOR_TAG } from "../utils/InternalConstructorTag";
import { AbstractLayerBase, AbstractLayerBaseOptions } from "./AbstractLayerBase";
import { GroupLayerCollection } from "./group/GroupLayerCollection";
import { GroupLayer } from "./GroupLayer";
import {
    ATTACH_TO_GROUP,
    ATTACH_TO_MAP,
    CHECK_EFFECTIVE_VISIBILITY,
    DETACH_FROM_GROUP
} from "./shared/internals";
import { SublayersCollection } from "./shared/SublayersCollection";

const SYNC_DISPATCH = { dispatch: "sync" } as const;

afterEach(() => {
    vi.restoreAllMocks();
});

it("emits a destroy event when destroyed", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "Foo"
    });

    let destroyed = 0;
    on(
        layer.destroyed,
        () => {
            destroyed++;
        },
        SYNC_DISPATCH
    );

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
        `[Error: Layer 'a' has not been attached to a map yet.]`
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
    watch(
        () => [layer.title],
        () => {
            ++changedTitle;
        },
        SYNC_DISPATCH
    );

    layer.setTitle("B");
    expect(layer.title).toBe("B");
    expect(changedTitle).toBe(1);
});

it("supports the description attribute", async () => {
    const layer = new LayerImpl({
        id: "a",
        title: "A"
    });
    expect(layer.description).toBe("");

    let changedDescription = 0;
    watch(
        () => [layer.description],
        () => {
            ++changedDescription;
        },
        SYNC_DISPATCH
    );

    layer.setDescription("Description");
    expect(layer.description).toBe("Description");
    expect(changedDescription).toBe(1);
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
    watch(
        () => [layer.attributes],
        () => {
            ++changedAttributes;
        },
        SYNC_DISPATCH
    );

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
    watch(
        () => [layer.attributes],
        () => {
            ++changedAttributes;
        },
        SYNC_DISPATCH
    );

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
});

it("supports initial empty attribute object and empty attribute object after updating/deleting", async () => {
    const hidden = Symbol("hidden");
    const layer = new LayerImpl({
        id: "a",
        title: "A"
    });

    let changedAttributes = 0;
    watch(
        () => [layer.attributes],
        () => {
            ++changedAttributes;
        },
        SYNC_DISPATCH
    );
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

    // delete layer attributes and check, if layer attributes is empty object
    layer.deleteAttribute(hidden);
    expect(layer.attributes).toMatchInlineSnapshot(`
      {}
    `);
    expect(changedAttributes).toBe(2);
});

describe("visibility in hierarchy", () => {
    it("is visible in hierarchy when visible without any parents", () => {
        const layer = new LayerImpl({
            id: "a",
            title: "A"
        });
        expect(layer.visible).toBe(true);
        expect(layer.visibleInHierarchy).toBe(true);

        layer.setVisible(false);
        expect(layer.visibleInHierarchy).toBe(false);
    });

    it("is not visible in hierarchy when the parent layer is invisible", () => {
        const parentLayer = new LayerImpl({
            id: "parent",
            title: "Parent"
        });
        const childLayer = new LayerImpl({
            id: "child",
            title: "Child"
        });
        attachToParent(childLayer, parentLayer);
        expect(childLayer.parent).toBe(parentLayer);
        expect(parentLayer.visible).toBe(true);
        expect(childLayer.visibleInHierarchy).toBe(true);

        parentLayer.setVisible(false);
        expect(childLayer.visibleInHierarchy).toBe(false);
    });

    it("is not visible in hierarchy when the grandparent layer is invisible", () => {
        const grandparentLayer = new LayerImpl({
            id: "grandparent",
            title: "Grandparent"
        });
        const parentLayer = new LayerImpl({
            id: "parent",
            title: "Parent"
        });
        const childLayer = new LayerImpl({
            id: "child",
            title: "Child"
        });
        attachToParent(parentLayer, grandparentLayer);
        attachToParent(childLayer, parentLayer);
        expect(childLayer.visibleInHierarchy).toBe(true);

        grandparentLayer.setVisible(false);
        expect(parentLayer.visible).toBe(true);
        expect(parentLayer.visibleInHierarchy).toBe(false);
        expect(childLayer.visible).toBe(true);
        expect(childLayer.visibleInHierarchy).toBe(false);

        grandparentLayer.setVisible(true);
        expect(childLayer.visibleInHierarchy).toBe(true);
    });

    it("updates when the parent changes", () => {
        const visibleParent = new LayerImpl({
            id: "parent1",
            title: "Parent1"
        });
        const invisibleParent = new LayerImpl({
            id: "parent2",
            title: "Parent2"
        });
        invisibleParent.setVisible(false);

        const childLayer = new LayerImpl({
            id: "child",
            title: "Child"
        });
        attachToParent(childLayer, visibleParent);
        expect(childLayer.visibleInHierarchy).toBe(true);

        detachFromParent(childLayer);
        attachToParent(childLayer, invisibleParent);
        expect(childLayer.visibleInHierarchy).toBe(false);
    });
});

describe("effective visibility", () => {
    it("is effectively visible when visible without any parents", () => {
        const layer = new LayerImpl({
            id: "a",
            title: "A"
        });
        expect(layer.effectivelyVisible).toBe(true);

        layer.setVisible(false);
        expect(layer.effectivelyVisible).toBe(false);
    });

    it("is not effectively visible when a parent layer is invisible", () => {
        const grandparentLayer = new LayerImpl({
            id: "grandparent",
            title: "Grandparent"
        });
        const parentLayer = new LayerImpl({
            id: "parent",
            title: "Parent"
        });
        const childLayer = new LayerImpl({
            id: "child",
            title: "Child"
        });
        attachToParent(parentLayer, grandparentLayer);
        attachToParent(childLayer, parentLayer);
        expect(childLayer.effectivelyVisible).toBe(true);

        grandparentLayer.setVisible(false);
        expect(childLayer.effectivelyVisible).toBe(false);
    });

    it("is not effectively visible if the layer has a display problem", () => {
        const layer = new LayerImpl({
            id: "a",
            title: "A"
        });

        const changes: boolean[] = [];
        const handle = watchValue(
            () => layer.effectivelyVisible,
            (effectivelyVisible) => {
                changes.push(effectivelyVisible);
            },
            SYNC_DISPATCH
        );

        layer.setDisplayProblem(true);
        expect(layer.visible).toBe(true);
        expect(layer.effectivelyVisible).toBe(false);
        expect(changes).toEqual([false]);

        layer.setDisplayProblem(false);
        expect(layer.effectivelyVisible).toBe(true);
        expect(changes).toEqual([false, true]);
        handle.destroy();
    });

    it("is not effectively visible when a parent layer has a display problem", () => {
        const parentLayer = new LayerImpl({
            id: "parent",
            title: "Parent"
        });
        const childLayer = new LayerImpl({
            id: "child",
            title: "Child"
        });
        attachToParent(childLayer, parentLayer);
        expect(childLayer.effectivelyVisible).toBe(true);

        parentLayer.setDisplayProblem(true);
        expect(parentLayer.visibleInHierarchy).toBe(true);
        expect(childLayer.visibleInHierarchy).toBe(true);
        expect(parentLayer.effectivelyVisible).toBe(false);
        expect(childLayer.effectivelyVisible).toBe(false);
    });
});

/**
 * Sets `parent` as the parent of `child`.
 *
 * The parent is not a real group layer, but the base class only needs it for the `parent` link.
 */
function attachToParent(child: LayerImpl, parent: LayerImpl): void {
    child[ATTACH_TO_GROUP](parent as unknown as GroupLayer);
}

function detachFromParent(child: LayerImpl): void {
    child[DETACH_FROM_GROUP]();
}

abstract class SharedParent extends AbstractLayerBase {
    // xxx lying to the compiler (not a real sublayer)
    #sublayers: SublayersCollection<any> | undefined;

    #visible = reactive(true);

    // Simulates a display problem
    #hasDisplayProblem = reactive(false);

    constructor(options: AbstractLayerBaseOptions & { sublayer?: SublayerImpl }) {
        super(options);
        if (options.sublayer) {
            this.#sublayers = new SublayersCollection([options.sublayer], INTERNAL_CONSTRUCTOR_TAG);
        }
    }

    __attach(map: MapModel): void {
        this[ATTACH_TO_MAP](map);
    }

    get visible(): boolean {
        return this.#visible.value;
    }

    get legend(): string | undefined {
        return undefined;
    }

    get layers(): GroupLayerCollection | undefined {
        return undefined;
    }

    get sublayers() {
        return this.#sublayers;
    }

    setVisible(v: boolean): void {
        this.#visible.value = v;
    }

    setDisplayProblem(blocked: boolean): void {
        this.#hasDisplayProblem.value = blocked;
    }

    protected override [CHECK_EFFECTIVE_VISIBILITY](): boolean {
        return super[CHECK_EFFECTIVE_VISIBILITY]() && !this.#hasDisplayProblem.value;
    }
}

class LayerImpl extends SharedParent {
    type = "simple" as const;
}

class SublayerImpl extends SharedParent {
    type = "wms-sublayer" as const;

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

    get loadState() {
        return "loaded" as const;
    }

    get loadError(): Error | undefined {
        return undefined;
    }
}
