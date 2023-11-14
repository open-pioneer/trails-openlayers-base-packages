// SPDX-FileCopyrightText: 2023 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import {
    StyleFunctionProps,
    extendTheme,
    withDefaultColorScheme
} from "@open-pioneer/chakra-integration";
import { theme as baseTheme } from "@open-pioneer/base-theme";

const fonts = {
    /* heading: "Tahoma",
    body: "Courier New" */
};

const colors = {
    //trails = default color scheme
    //10 colors as hex values from 50 to 900 (light to dark)
    trails: {
        50: "#eaf2f5",
        100: "#d5e5ec",
        200: "#abcbd9",
        300: "#81b1c5",
        400: "#5797b2",
        500: "#2d7d9f",
        600: "#24647f",
        700: "#1b4b5f",
        800: "#123240",
        900: "#091920"
    },
    //trails_alt = currently only used for: <Button variant="secondary">secondary</Button>
    //TODO: add 50-900
    trails_alt: {
        500: "#2c851e",
        600: "#236a18",
        700: "#1a5012",
        800: "#12350c",
        900: "#091b06"
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getColor = (semanticToken: string, theme: any) => {
    const color = theme.semanticTokens.colors[semanticToken];
    if (color && color.includes(".")) {
        const kvp = color.split(".");
        const key = kvp[0],
            value = kvp[1];
        return theme.colors[key][value];
    }
    return color;
};

/**
 * Provides a theme that uses the "trails" color scheme.
 */
export const theme = extendTheme(
    withDefaultColorScheme({ colorScheme: "trails" }),
    {
        styles: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            global({ theme }: any) {
                return {
                    "body": {
                        //TODO: Hack! Additional Hex digits only work because colors are hex, too
                        //opacity-to-hex: 0.6 => 99
                        "--trails-theme-shadow-color": `${getColor("background_primary", theme)}99`
                    }
                };
            }
        },
        shadows: {
            outline: `0 0 0 3px var(--trails-theme-shadow-color)`
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
                        bg: "trails_alt.500",
                        _hover: {
                            bg: "trails_alt.600"
                        },
                        _active: {
                            bg: "trails_alt.700"
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
                    outline({ theme }: StyleFunctionProps) {
                        return {
                            field: {
                                borderColor: "border",
                                _focusVisible: {
                                    borderColor: "background_primary",
                                    boxShadow: `0 0 0 1px ${getColor("background_primary", theme)}`
                                }
                            },
                            addon: {
                                borderColor: "border",
                                bg: "background_primary"
                            }
                        };
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
                    flushed({ theme }: StyleFunctionProps) {
                        return {
                            field: {
                                _focusVisible: {
                                    borderColor: "background_primary",
                                    boxShadow: `0px 1px 0px 0px ${getColor(
                                        "background_primary",
                                        theme
                                    )}`
                                }
                            }
                        };
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
                    outline({ theme }: StyleFunctionProps) {
                        return {
                            field: {
                                borderColor: "border",
                                _focusVisible: {
                                    borderColor: "background_primary",
                                    boxShadow: `0 0 0 1px ${getColor("background_primary", theme)}`
                                }
                            }
                        };
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
                    flushed({ theme }: StyleFunctionProps) {
                        return {
                            field: {
                                _focusVisible: {
                                    borderColor: "background_primary",
                                    boxShadow: `0px 1px 0px 0px ${getColor(
                                        "background_primary",
                                        theme
                                    )}`
                                }
                            }
                        };
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
                    outline({ theme }: StyleFunctionProps) {
                        return {
                            borderColor: "border",
                            _focusVisible: {
                                borderColor: "background_primary",
                                boxShadow: `0 0 0 1px ${getColor("background_primary", theme)}`
                            }
                        };
                    },
                    filled: {
                        _focusVisible: {
                            borderColor: "background_primary"
                        }
                    },
                    flushed({ theme }: StyleFunctionProps) {
                        return {
                            _focusVisible: {
                                borderColor: "background_primary",
                                boxShadow: `0px 1px 0px 0px ${getColor(
                                    "background_primary",
                                    theme
                                )}`
                            }
                        };
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
