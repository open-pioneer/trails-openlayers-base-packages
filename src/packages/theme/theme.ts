// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { extendTheme, withDefaultColorScheme } from "@open-pioneer/chakra-integration";
import { theme as baseTheme } from "@open-pioneer/base-theme";

const fonts = {
    /* heading: "Tahoma",
    body: "Courier New" */
};

const colors = {
    //trails = default color scheme
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
    //trails_alt = currently only used for: <Button variant="secondary">secondary</Button>
    //TODO: add 50-900
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

//Create an intermediate theme to have access to all colors and semantic tokens (function: getColor)
const intermediateTheme = extendTheme({ fonts, colors, semanticTokens }, baseTheme);

//Get the color defined by a semantic token.
//If it points to a color (e.g. red.500), get the hex color value out of the color scheme.
//Overrides: "boxShadow" and "outline"
const getColor = (semanticToken: string) => {
    const color = intermediateTheme.semanticTokens.colors[semanticToken];
    if (color && color.includes(".")) {
        const kvp = color.split(".");
        const key = kvp[0],
            value = kvp[1];
        return intermediateTheme.colors[key][value];
    }
    return color;
};

/**
 * Provides a theme that uses the "trails" color scheme.
 */
export const theme = extendTheme(
    withDefaultColorScheme({ colorScheme: "trails" }),
    {
        shadows: {
            //opacity-to-hex: 0.6 => 99
            outline: `0 0 0 3px ${getColor("background_primary")}99`
        },
        components: {
            Button: {
                defaultProps: {
                    //colorScheme: "gray"
                    //size: "md", //"lg" | "md" | "sm" | "xs"
                    //variant: "solid" //"primary" | "secondary" | "cancel" | "solid" | "outline" | "ghost" | "link"
                },
                variants: {
                    //primary === default
                    primary: {
                        color: "font_inverse",
                        bg: "trails.500",
                        _hover: {
                            bg: "trails.600"
                        },
                        _active: {
                            bg: "trails.700"
                        }
                    },
                    secondary: {
                        color: "font_inverse",
                        bg: "trails_alt.700",
                        _hover: {
                            bg: "trails_alt.800"
                        },
                        _active: {
                            bg: "trails_alt.900"
                        }
                    },
                    cancel: {
                        color: "font_inverse",
                        bg: "gray.500",
                        _hover: {
                            bg: "gray.600"
                        },
                        _active: {
                            bg: "gray.700"
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
    intermediateTheme
);
