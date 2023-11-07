// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { extendTheme, withDefaultColorScheme } from "@open-pioneer/chakra-integration";
import { theme as baseTheme } from "@open-pioneer/base-theme";

const fonts = {
    heading: "Tahoma",
    body: "Courier New"
};

const colors = {
    //primary = default color scheme
    //10 colors as hex values from 50 to 900 (light to dark)
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
    },
    //TODO ?? secondary/alternative = button variant secondary
    trails_alt: {
        500: "#e7a276",
        600: "#e09463",
        700: "#d98651",
        800: "#d1783f",
        900: "#c96a2c"
    }
};

const semanticTokens = {
    colors: {
        "background_body": "white",
        "background_primary": "trails.500",
        //"background_secondary": "trails.700",
        "placeholder": "gray.500",
        "font_primary": "black",
        //"font_secondary": "gray.500",
        "font_inverse": "white",
        "font_link": "trails.600",
        "border": "gray.300",
        //"error": "red.500",
        //"error_hover": "red.600",
        //"success": "green.500",
        //"highlight": "yellow.300",

        //override internal chakra theming variables
        //https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/semantic-tokens.ts
        "chakra-body-text": "font_primary",
        "chakra-body-bg": "background_body",
        "chakra-border-color": "border",
        "chakra-placeholder-color": "placeholder"
        //"chakra-inverse-text": "font_inverse",
        //"chakra-subtle-bg": "background_secondary",
        //"chakra-subtle-text": "font_secondary"
    }
};

//extend baseTheme
let theme = extendTheme({ fonts, colors, semanticTokens }, baseTheme);

/**
 * Get the color defined by a semantic token.
 * If it points to a color value (e.g. red.500), get the hex color value.
 * Needed for: "boxShadow" and "outline"
 */
const getColor = (semanticToken: string) => {
    const color = theme.semanticTokens.colors[semanticToken];
    if (color && color.includes(".")) {
        const kvp = color.split(".");
        const key = kvp[0],
            value = kvp[1];
        return theme.colors[key][value];
    }
    return color;
};

//extend theme
theme = extendTheme(
    withDefaultColorScheme({ colorScheme: "trails" }),
    {
        shadows: {
            //TODO ?? https://caniuse.com/?search=rrggbbaa -> default: rgba(66, 153, 225, 0.6)
            //opacity-to-hex: 0.6 => 99
            outline: `0 0 0 3px ${getColor("background_primary")}99`
        },
        components: {
            Button: {
                defaultProps: {
                    //TODO ?? defaults nur zeigen
                    //colorScheme: "gray"
                    //size: "md", //"lg" | "md" | "sm" | "xs"
                    //variant: "solid" //"primary" | "secondary" | "cancel" | "solid" | "outline" | "ghost" | "link"
                },
                variants: {
                    //definiert, da im Zweifel nicht ohne Style
                    primary: {
                        color: "font_inverse",
                        bg: "trails.500", //TODO ?? semToken ??
                        _hover: {
                            bg: "trails.600"
                        },
                        _active: {
                            bg: "trails.700"
                        }
                    },
                    secondary: {
                        color: "font_inverse",
                        bg: "trails_alt.700", //"gray.500",
                        _hover: {
                            bg: "trails_alt.800" //"gray.600"
                        },
                        _active: {
                            bg: "trails_alt.900" //"gray.700"
                        }
                    },
                    cancel: {
                        bg: "gray.300",
                        _hover: {
                            bg: "gray.400"
                        },
                        _active: {
                            bg: "gray.500"
                        }
                    }
                }
            },
            Checkbox: {
                defaultProps: {
                    //colorScheme: "blue"
                    //size: "md" //"lg" | "md" | "sm"
                }
            },
            Container: {
                //TODO ?? Box <-> Container
                //TODO: https://chakra-ui.com/docs/components/container/usage#centering-the-children
                baseStyle: {
                    bg: "white",
                    borderWidth: "1px",
                    borderRadius: "lg",
                    boxShadow: "lg",
                    padding: 2
                }
            },
            Divider: {
                baseStyle: {
                    borderColor: "background_primary"
                }
            },
            Input: {
                defaultProps: {
                    //size: "md" //"lg" | "md" | "sm" | "xs"
                    //variant: "outline" //"outline" | "filled" | "flushed" | "unstyled"
                },
                variants: {
                    outline: {
                        field: {
                            borderColor: "border",
                            _focusVisible: {
                                borderColor: "background_primary",
                                boxShadow: `0 0 0 1px ${getColor("background_primary")}`
                            }
                        },
                        addon: {
                            borderColor: "border",
                            bg: "background_primary"
                        }
                    },
                    filled: {
                        field: {
                            _focusVisible: {
                                borderColor: "background_primary"
                            }
                        },
                        addon: {
                            bg: "background_primary"
                        }
                    },
                    flushed: {
                        field: {
                            _focusVisible: {
                                borderColor: "background_primary",
                                boxShadow: `0px 1px 0px 0px ${getColor("background_primary")}`
                            }
                        }
                    }
                }
            },
            Link: {
                baseStyle: {
                    color: "font_link"
                }
            },
            Radio: {
                defaultProps: {
                    //colorScheme: "blue",
                    //size: "md" //"lg" | "md" | "sm"
                }
            },
            Select: {
                defaultProps: {
                    //size: "md" //"lg" | "md" | "sm" | "xs"
                    //variant: "outline" //"outline" | "filled" | "flushed" | "unstyled"
                },
                variants: {
                    outline: {
                        field: {
                            borderColor: "border",
                            _focusVisible: {
                                borderColor: "background_primary",
                                boxShadow: `0 0 0 1px ${getColor("background_primary")}`
                            }
                        }
                    },
                    filled: {
                        field: {
                            _focusVisible: {
                                borderColor: "background_primary"
                            }
                        },
                        addon: {
                            bg: "background_primary"
                        }
                    },
                    flushed: {
                        field: {
                            _focusVisible: {
                                borderColor: "background_primary",
                                boxShadow: `0px 1px 0px 0px ${getColor("background_primary")}`
                            }
                        }
                    }
                }
            },
            Slider: {
                defaultProps: {
                    //colorScheme: "blue"
                    //size: "md" //"lg" | "md" | "sm"
                },
                baseStyle: {
                    thumb: {
                        borderColor: "background_primary",
                        _hover: {
                            bg: "background_primary"
                        }
                    }
                }
            },
            Switch: {
                defaultProps: {
                    //colorScheme: "blue",
                    //size: "md" //"lg" | "md" | "sm"
                }
            },
            Textarea: {
                defaultProps: {
                    //size: "md", //"lg" | "md" | "sm" | "xs"
                    //variant: "outline" //"outline" | "filled" | "flushed" | "unstyled"
                },
                variants: {
                    outline: {
                        borderColor: "border",
                        _focusVisible: {
                            borderColor: "background_primary",
                            boxShadow: `0 0 0 1px ${getColor("background_primary")}`
                        }
                    },
                    filled: {
                        _focusVisible: {
                            borderColor: "background_primary"
                        }
                    },
                    flushed: {
                        _focusVisible: {
                            borderColor: "background_primary",
                            boxShadow: `0px 1px 0px 0px ${getColor("background_primary")}`
                        }
                    }
                }
            },
            Tooltip: {
                baseStyle: {
                    //bg: "background_primary",
                    //color: "font_inverse",
                    borderRadius: "md"
                }
            }
        }
    },
    theme
);

console.log("log theme", theme); //TODO ..
export { theme };
