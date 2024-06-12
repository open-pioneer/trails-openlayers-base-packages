---
"@open-pioneer/react-utils": patch
---

Add `sectionHeadingProps` to configure the generated `<SectionHeading>` if `title` is a string.

For example:

```tsx
<TitledSection title="some title" sectionHeadingProps={{ size: "lg" }}>
    ... Titled content ...
</TitledSection>
```
