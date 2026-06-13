"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { AuthProvider } from "./lib/auth-context";
import { EditModeProvider } from "./components/edit-mode/edit-mode-context";
import { EditDrawer } from "./components/edit-mode/EditDrawer";
import { EditModeFab } from "./components/edit-mode/EditModeFab";
import { theme } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme} resetCSS>
        <AuthProvider>
          <EditModeProvider>
            {children}
            <EditDrawer />
            <EditModeFab />
          </EditModeProvider>
        </AuthProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}
