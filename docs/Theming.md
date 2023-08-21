# Trails Theming
- theming provides a set of styling rules that are applied to all components of an app
- theming defines color scheme, fonts and font sizes
- app layout (placement of components) is still handled by each app itself
## Theming with Charka UI
 - Javascript-based
 - Chakra UI provides a default theme
   - it can be partially or completely overwritten
 - theme includes definitions for colors, typography, sizes (e.g. xl means 36rem), component specific styling...
 - semantic tokens add labels (e.g error or success) for specific colors 
## Trails Theming Concept
 - primarily use Chakra UI theming for basic definitions (e.g color scheme, font, fontsize)
 - if necessary each coponent can be syled indiviually with CSS
 - use of sematic tokens
 - each app has to provided a minimum set of required theming parameters (List of predined colors)
   - developer may assume that these values are always defined 
### Pros & Cons
#### Pro
* makes use of Chakra UI's theming capabilites  
  * very good configurability
  * no need to implement a custom solution
#### Contra
* developer must be familiar with the (Javascript-based) syntax of Chakra UI
  * instead of only CSS
* more rules that a developer has to follow
  * styling guidlines are part of documentation and cannot be enforced in the code base
  * e.g when to use primary background color and when to use secondary background color
## Guidline for Developers
 - use Chakra UI components instead of base HTML elements
   - otherwise theme might not be applied
 - components must be wrapped in a Chakra UI components
   - Wrapper must be annotated with a predefined CSS class
   - it must be possible to provide addtional CSS classes 
 - do not use specific colors or font (sizes) in components
   - only use semantic tokens
- if a component requires a value that is not part of the predifined sematic tokens it must be state in the documentation of the component
  - provide a default value in this case the
    - component must still work if the additional sematic token is missing 
### List of predfined Colors (Semantic Tokens)
* primary (background)
* secondary (background)
* font
* error
* success
* highlight
