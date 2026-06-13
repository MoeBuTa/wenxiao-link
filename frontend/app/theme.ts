import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

// Dark "orange · blue · black" palette. Black-blue canvas, warm orange as
// the primary accent, sky blue as the secondary. Forced dark mode so
// Chakra's built-in components (Input, Menu, Accordion, Toast, Badge)
// pick their dark variants automatically; our own colors come from the
// semantic tokens below.
const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  fonts: {
    heading: "var(--font-serif), Georgia, 'Times New Roman', serif",
    body: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  colors: {
    // Primary accent — orange.
    brand: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
      800: "#9a3412",
      900: "#7c2d12",
    },
    // Secondary accent — sky blue.
    ocean: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },
    // Black-blue neutral ramp for surfaces, borders, muted text.
    coal: {
      50: "#e7ebf0",
      100: "#c8d0db",
      200: "#9aa7b5",
      // Raised from #6b7684 to clear WCAG AA (>=4.5:1) on bg.card (#161c27);
      // fg.faint maps here, so every faint-text call site benefits.
      300: "#8a95a3",
      400: "#3a4452",
      500: "#2a3340",
      600: "#1f2733",
      700: "#161c27",
      800: "#11161f",
      900: "#0a0e16",
    },
  },
  semanticTokens: {
    colors: {
      "bg.canvas": "coal.900",
      "bg.surface": "coal.800",
      "bg.card": "coal.700",
      "bg.subtle": "coal.600",
      "border.default": "coal.500",
      "border.muted": "coal.600",
      "fg.default": "#e6edf3",
      "fg.muted": "coal.200",
      "fg.faint": "coal.300",
      accent: "brand.400",
      "accent.emphasis": "brand.500",
      "accent.subtle": "brand.300",
      ocean: "ocean.300",
    },
  },
  styles: {
    global: {
      "html, body": {
        bg: "bg.canvas",
        color: "fg.default",
        // Live-synced venue/title strings (max 500 chars) and user comments
        // can contain long unbreakable tokens — keep them inside the box.
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      },
      "*::selection": {
        background: "rgba(249, 115, 22, 0.3)",
      },
      "*::-webkit-scrollbar": { width: "10px", height: "10px" },
      "*::-webkit-scrollbar-thumb": {
        background: "coal.600",
        borderRadius: "8px",
      },
      "*::-webkit-scrollbar-thumb:hover": { background: "coal.500" },
    },
  },
  components: {
    Link: {
      baseStyle: {
        color: "accent.subtle",
        _hover: { color: "brand.200", textDecoration: "underline" },
      },
    },
    Heading: {
      baseStyle: { color: "fg.default", fontWeight: "600" },
    },
    // Force the dropdown dark — otherwise Chakra's light Menu variant gives
    // a white list while items inherit the near-white global text color.
    Menu: {
      baseStyle: {
        list: {
          bg: "bg.surface",
          borderColor: "border.muted",
          boxShadow: "dark-lg",
          py: 1,
        },
        item: {
          bg: "bg.surface",
          color: "fg.default",
          _hover: { bg: "bg.card" },
          _focus: { bg: "bg.card" },
        },
        divider: { borderColor: "border.muted" },
        groupTitle: { color: "fg.muted" },
      },
    },
  },
});
