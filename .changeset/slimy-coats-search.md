---
"@open-pioneer/map": patch
---

Add new map anchor positioning options.

The following positions are now supported:

```ts
export type MapAnchorPosition =
    | "manual"
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center"
    | "left-center"
    | "right-center"
    | "center";
```

You can use `manual` positioning to position an anchor using CSS.
For example:

```tsx
<MapAnchor className="manual-position" position="manual">
    <Box
        backgroundColor="whiteAlpha.800"
        borderWidth="1px"
        borderRadius="lg"
        padding={2}
        boxShadow="lg"
    >
        Manually positioned anchor
    </Box>
```

Combined with css:

```css
.manual-position {
    left: 200px;
    top: 200px;
}
```
