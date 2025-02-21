---
"@open-pioneer/map": patch
---

Add a generic type parameter `PropertiesType` to the `BaseFeature` interface.
This allows specifying the type of the `properties` attribute.
The default type is `Readonly<Record<string, unknown>>` for backwards compatibility.

Example:

```ts
interface MyFeatureProperties {
    name: string;
}

const feature: BaseFeature<MyFeatureProperties> = {
    id: 123,
    properties: {
        name: "Example Feature"
    }
};

// string | undefined instead of `unknown`
const name = feature.properties?.name;
```
