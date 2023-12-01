# @open-pioneer/theme

This package provides a theme that uses the "trails" color scheme.

## Usage

To use the theme in your app, first import:

```jsx
import { theme } from "@open-pioneer/theme";
```

Then pass in the theme in `createCustomElement`:

```jsx
createCustomElement({
    ...,
    theme
});
```

### How to override the `trails` color scheme

Import the `extendTheme` helper function:

```jsx
import { extendTheme } from "@open-pioneer/chakra-integration";
```

Define your custom `trails` (or `trails_alt`) colors:

```jsx
const colors = {
    trails: {
        50: "#f5edfd",
        100: "#eedcff",
        200: "#d6c2ea",
        300: "#bfa8d5",
        400: "#a890c1",
        500: "#9177ad",
        600: "#7b609a",
        700: "#654986",
        800: "#4f3373",
        900: "#391e61"
    }
};
```

Use `extendTheme` function to override the `trails` colors:

```jsx
const customTheme = extendTheme({ colors }, theme);
```

Or use Chakra UI color schemes to override the `trails` (or `trails_alt`) colors:

```jsx
const customTheme = extendTheme(
    {
        colors: {
            trails: theme.colors.gray
        }
    },
    theme
);
```

`options: gray | red | orange | yellow | green | teal | blue | cyan | purple | pink`

Then pass in the custom theme in `createCustomElement`:

```jsx
createCustomElement({
    ...,
    theme: customTheme
});
```

### How to use button variants

```jsx
<Button variant="secondary">secondary</Button>
```

`options: solid | outline | ghost | link | primary | secondary | cancel`  
`default: solid`

## License

Apache-2.0 (see `LICENSE` file)
